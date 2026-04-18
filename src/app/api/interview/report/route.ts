import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.API_KEY || "",
  baseURL: process.env.BASE_URL || "https://api.openai.com/v1",
});

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

    if (!sessionId) {
      return NextResponse.json({ code: 4000, message: "缺少 sessionId" }, { status: 400 });
    }

    // 1. 获取会话及对话历史
    const sessionData = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!sessionData || sessionData.userId !== userId) {
      return NextResponse.json({ code: 4040, message: "未找到面试记录" }, { status: 404 });
    }

    if (sessionData.status === "completed" && sessionData.reportData) {
      // 如果已经生成过，直接返回
      return NextResponse.json({
        code: 200,
        data: JSON.parse(sessionData.reportData),
      });
    }

    // 2. 构造对话文本供大模型评估
    const chatHistoryText = sessionData.messages
      .map((m) => `${m.role === "ai" ? "面试官" : "候选人"}: ${m.content}`)
      .join("\n");

    if (sessionData.messages.length <= 1) {
       return NextResponse.json({ code: 4001, message: "对话轮次太少，无法生成报告" }, { status: 400 });
    }

    // 3. 调用大模型生成报告 (Structured JSON)
    const prompt = `
请根据以下面试官与候选人的对话记录，为候选人生成一份专业的面试评估报告。
面试岗位：${sessionData.targetRole}

对话记录：
${chatHistoryText}

你需要输出一个 JSON 对象，必须符合以下格式（严格不要返回 markdown 代码块如 \`\`\`json，只返回纯 JSON 文本）：
{
  "score": 85, // 0-100的综合评分
  "summary": "候选人展现了扎实的...能力，但在...方面稍有欠缺。", // 总体评价 (50-100字)
  "strengths": ["优点1", "优点2", "优点3"], // 候选人的优势 (至少2条)
  "weaknesses": ["不足1", "不足2"], // 候选人的不足 (至少2条)
  "suggestions": ["建议1", "建议2"] // 改进建议
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    let resultText = completion.choices[0]?.message?.content || "{}";
    
    // 清理可能的 markdown
    resultText = resultText.replace(/^```json/m, '').replace(/^```/m, '').trim();
    
    let reportJson;
    try {
      reportJson = JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse report JSON:", resultText);
      return NextResponse.json({ code: 5002, message: "报告生成格式错误" }, { status: 500 });
    }

    // 4. 落库
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        reportData: JSON.stringify(reportJson),
      },
    });

    return NextResponse.json({
      code: 200,
      data: reportJson,
    });
  } catch (error: any) {
    console.error("Generate Interview Report Error:", error);
    return NextResponse.json({ code: 5001, message: "报告生成异常" }, { status: 500 });
  }
}
