import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.API_KEY || "",
  baseURL: process.env.BASE_URL || "https://api.openai.com/v1",
});

export async function POST(request: Request) {
  try {
    const { targetRole, resumeContext = "" } = await request.json();
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

    if (!targetRole) {
      return NextResponse.json({ code: 4000, message: "缺少 targetRole" }, { status: 400 });
    }

    // 确保用户在数据库中存在（防止外键约束报错 P2003）
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, persona: true, resumeText: true },
    });

    // 如果用户不存在，则创建一个初始用户
    if (!user) {
      user = await prisma.user.create({
        data: { id: userId, roleType: "student" },
        select: { id: true, persona: true, resumeText: true },
      });
    }

    const personaContext = user.persona ? `候选人的技术画像与能力特点：${user.persona}` : "";
    const resumeInfo = user.resumeText || resumeContext || "暂无特殊背景";

    // 1. 生成第一道面试题 (作为 AI 的开场白)
    const prompt = `
      你是一位资深技术/业务面试官，现在要面试一位申请【${targetRole}】岗位的候选人。
      候选人的部分背景信息：${resumeInfo}
      ${personaContext}
      
      请直接以面试官的口吻，给出一句简短的欢迎语，并根据候选人的画像抛出第一个有深度、有针对性的压力面试问题。
      注意：不要输出多余的解释，直接输出你的第一句话。
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.8,
    });

    const aiMessage = completion.choices[0].message.content || "你好，请先简单做个自我介绍。";

    // 2. 创建面试 Session 和首条记录入库
    const session = await prisma.interviewSession.create({
      data: {
        userId,
        targetRole,
        status: "ongoing",
        messages: {
          create: {
            role: "ai",
            content: aiMessage,
          }
        }
      }
    });

    return NextResponse.json({
      code: 200,
      data: {
        sessionId: session.id,
        aiMessage,
      },
    });
  } catch (error: any) {
    console.error("Interview Init Error:", error);
    return NextResponse.json({ code: 5001, message: "初始化面试失败" }, { status: 500 });
  }
}
