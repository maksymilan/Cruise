import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { search, SafeSearchType } from "duck-duck-scrape";

const openai = new OpenAI({
  apiKey: process.env.API_KEY || "",
  baseURL: process.env.BASE_URL || "https://api.openai.com/v1", // 允许自定义如深度求索或中转接口
});

export async function POST(request: Request) {
  try {
    const { parsedId, major = "计算机相关" } = await request.json();
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

    if (!parsedId) {
      return NextResponse.json({ code: 4000, message: "缺少 parsedId" }, { status: 400 });
    }

    // 1. 从数据库中拉取解析后的成绩单
    const transcript = await prisma.transcript.findUnique({
      where: { id: parsedId },
    });

    if (!transcript || transcript.userId !== userId) {
      return NextResponse.json({ code: 4040, message: "成绩单记录不存在" }, { status: 404 });
    }

    const courses = JSON.parse(transcript.parsedData);

    // 2. 启动 Agent：通过 Trae 内置能力或模拟联网获取当前专业最新校招、实习动态
    // 注：在真实的生产环境中，这里可以调用 Bing Search API、Google Custom Search API，
    // 或使用具有内置联网功能的模型 (如 Kimi、DeepSeek 等)。
    // 这里为了演示稳定性和规避免费爬虫被封禁的问题，使用模拟的实时数据。
    let searchResults = "未能获取到最新联网数据。";
    try {
      const year = new Date().getFullYear();
      // 模拟联网抓取到的结果
      searchResults = `
标题：${year}年 ${major} 校招趋势与薪资报告
摘要：当前行业对 ${major} 毕业生的要求更加注重工程化落地能力和 AI 工具使用经验。企业偏好有高并发处理经验或参与过知名开源项目的候选人。

标题：最新大厂 ${major} 实习生招聘要求
摘要：实习门槛提升，要求熟悉微服务架构（Spring Cloud/Dubbo 或 Go-Micro）、熟悉 Redis/MySQL 底层原理。建议大三学生尽早准备算法题和八股文。

标题：${major} 职业发展路线建议
摘要：建议在校期间不仅要刷题，还要注重软技能培养，如技术方案设计能力和跨团队沟通能力。
      `.trim();
    } catch (e) {
      console.warn("Agent 联网搜索失败，降级为使用模型内置知识:", e);
    }

    // 3. 构建 Prompt 给 LLM 生成雷达数据与分析报告
    const prompt = `
    你是一个专业的大学生职业规划和能力分析 AI 助手。
    用户专业：${major}
    用户已修课程、成绩与时间：${JSON.stringify(courses)}
    联网检索到的当前行业最新动态：
    ${searchResults}

    请基于以上信息，先根据用户最晚的课程时间推断出该用户当前所处的年级（例如：大二下学期、大三上学期等），然后结合所处年级进行分析。
    
    请返回严格的 JSON 格式数据，确保 JSON 结构严格如下（不要输出 markdown 代码块，直接输出合法 JSON）：
    {
      "inferredGrade": "string (推断出的当前年级，如：大三下学期)",
      "abilityRadar": {
        "programming": <数字，0-100的整数>,
        "math": <数字，0-100的整数>,
        "analysis": <数字，0-100的整数>,
        "communication": <数字，0-100的整数>,
        "teamwork": <数字，0-100的整数>
      },
      "matchedAlumni": [
        {
          "id": "string (模拟一个学长id)",
          "company": "string (如：字节跳动)",
          "role": "string (如：后端开发工程师)",
          "matchScore": <数字，0-100的整数>
        }
      ],
      "optimizationAdvice": {
        "course": ["string (结合当前年级给出的后续选修建议)"],
        "skills": ["string (结合当前年级和联网信息的技能提升建议)"],
        "projects": ["string (结合当前年级的项目建议)"],
        "internship": ["string (结合当前年级的时间线，给出具体的实习投递建议)"]
      },
      "persona": "string (一段约50-100字的用户个人画像描述，如：你是一位基础扎实、偏向后端的实干型开发者，具备较强的逻辑分析能力，但在团队协作和沟通表达上还有提升空间。)",
      "careerPath": [
        {
          "phase": "string (如：大三下学期 / 2025年春)",
          "milestone": "string (如：深入微服务架构与中间件)",
          "detail": "string (具体的执行细节，如：学习 Go 语言，完成一个高并发秒杀系统，并尝试投递日常实习。)"
        }
      ],
      "detailedGuide": "string (一份不少于800字的详细指导文档，使用 Markdown 格式排版。必须针对用户当前的年级量身定制。包含当前能力深度剖析、未来1-3年的阶段性发展规划、具体的学习资源/开源项目推荐、以及求职准备时间表等。)"
    }
    注意：
    1. 必须根据成绩单的时间轴准确推断年级。例如如果最晚的课程是 2025-2026春季学期，假设入学是2023年秋，那说明当前大概是大三下学期。
    2. optimizationAdvice 和 detailedGuide 的建议必须高度契合推断出的年级（比如大一侧重基础，大三侧重实习和项目，大四侧重秋招冲刺）。
    3. detailedGuide 需要排版精美，适合 Markdown 渲染。
    `;

    // 4. 调用 OpenAI 接口
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // 你可以根据自己的 API KEY 权限换成 "gpt-3.5-turbo" 或其他模型
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      // 移除 response_format，兼容更多国内大模型和中转 API
    });

    let aiResponseText = completion.choices[0].message.content || "{}";
    
    // 清理大模型可能输出的 Markdown 格式 (```json ... ```)
    aiResponseText = aiResponseText.replace(/^```json/im, '').replace(/```$/im, '').trim();

    let aiData;
    try {
      aiData = JSON.parse(aiResponseText);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw response:", aiResponseText);
      throw new Error("AI 返回的数据不是合法的 JSON 格式");
    }

    // 5. 将 AI 生成的能力图谱落库，并同步更新到 User 表中作为全局信息
    const [report] = await prisma.$transaction([
      prisma.analysisReport.create({
        data: {
          userId,
          transcriptId: parsedId,
          radarData: JSON.stringify(aiData.abilityRadar),
          optimizationAdvice: JSON.stringify(aiData.optimizationAdvice),
          detailedGuide: aiData.detailedGuide || "",
          inferredGrade: aiData.inferredGrade || "未知年级",
          persona: aiData.persona || "",
          careerPath: aiData.careerPath ? JSON.stringify(aiData.careerPath) : "[]",
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          persona: aiData.persona || "",
          careerPath: aiData.careerPath ? JSON.stringify(aiData.careerPath) : "[]",
        }
      })
    ]);

    // 6. 返回最终聚合结果
    return NextResponse.json({
      code: 200,
      data: {
        reportId: report.id,
        ...aiData,
      },
    });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ code: 5001, message: "AI 分析服务异常: " + error.message }, { status: 500 });
  }
}
