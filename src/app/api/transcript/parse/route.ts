import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const pdf = require("pdf-parse");

const openai = new OpenAI({
  apiKey: process.env.API_KEY || "",
  baseURL: process.env.BASE_URL || "https://api.openai.com/v1",
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

    if (!file) {
      return NextResponse.json({ code: 4000, message: "未检测到上传的文件" }, { status: 400 });
    }

    if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type)) {
      return NextResponse.json({ code: 4001, message: "不支持的文件格式" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({ data: { id: userId, roleType: "student" } });
    }

    let extractedText = "";

    console.log(`\n--- [Parse API] 开始处理文件上传 ---`);
    console.log(`[Parse API] 文件名: ${file.name}, 类型: ${file.type}, 大小: ${file.size} bytes`);

    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdf(buffer);
        extractedText = data.text;
        console.log(`[Parse API] PDF解析成功，提取文本长度: ${extractedText.length}`);
        console.log(`[Parse API] 提取文本前500字符: \n${extractedText.substring(0, 500)}\n------------------------`);
      } catch (err) {
        console.error(`[Parse API] PDF解析失败:`, err);
        return NextResponse.json({ code: 5001, message: "PDF读取失败，请检查文件是否损坏" }, { status: 500 });
      }
    } else {
      console.log(`[Parse API] 收到图像文件，暂无 Vision OCR，使用降级提示。`);
      extractedText = "此为图像文件，目前仅支持 PDF 成绩单的精确提取。如果是真实成绩单，请提供对应专业和课程信息。";
    }

    if (extractedText.trim().length < 20 && file.type === "application/pdf") {
      console.warn(`[Parse API] 提取到的文本过短，可能是纯图片/扫描件 PDF。`);
    }

    // 调用大模型提取课程信息和专业信息
    const prompt = `
    你是一个专业的成绩单解析助手。请从以下文本中提取用户的【专业名称】以及【所有的课程成绩信息】。
    文本内容如下：
    ${extractedText.substring(0, 4000)} // 限制长度防止超长

    请返回严格的 JSON 格式数据（不要输出 markdown 代码块，直接输出合法 JSON）：
    {
      "major": "string (如：工商管理、计算机科学与技术、汉语言文学等。如果无法识别，请根据课程推断，或默认填'通用专业')",
      "courses": [
        {
          "name": "string (课程名称)",
          "credit": <数字，学分，如无则填 0>,
          "score": <数字，成绩，百分制。如果是优良中差，请转换为 90, 80, 70, 60>,
          "term": "string (学期，如：2023-2024秋季学期)"
        }
      ]
    }
    注意：
    1. 提取出尽可能多的课程。如果文本中没有明确写明学期，可以尝试根据顺序推断，或者填“未知学期”。
    2. 如果文本内容提示为图像文件或者无法识别到任何课程，请在 major 中填入 "解析失败"，courses 返回空数组。
    `;

    console.log(`[Parse API] 准备请求大模型进行结构化提取...`);
    const response = await openai.chat.completions.create({
      model: "ep-20250218165747-8zng5", // 或使用当前默认模型
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    let rawOutput = response.choices[0].message.content || "{}";
    console.log(`[Parse API] 大模型返回原始结果: \n${rawOutput}\n------------------------`);
    
    rawOutput = rawOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(rawOutput);
    } catch (e) {
      console.error("LLM 返回非合法 JSON:", rawOutput);
      parsedJson = { major: "未知专业", courses: [] };
    }

    const major = parsedJson.major || "未知专业";
    const courses = parsedJson.courses && parsedJson.courses.length > 0 ? parsedJson.courses : [
      { name: "未识别出具体课程", credit: 0, score: 0, term: "未知学期" }
    ];

    const transcript = await prisma.transcript.create({
      data: {
        userId: user.id,
        rawFileUrl: `local-mock-storage/${file.name}`,
        parsedData: JSON.stringify({ major, courses }), // 存入 major 和 courses
      },
    });

    return NextResponse.json({
      code: 200,
      data: {
        parsedId: transcript.id,
        major: major,
        courses: courses,
      },
    });
  } catch (error: any) {
    console.error("OCR Parse Error:", error);
    return NextResponse.json({ code: 5000, message: "解析成绩单失败" }, { status: 500 });
  }
}
