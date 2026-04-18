import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

// 移除 Edge Runtime 声明，因为 Prisma SQLite 客户端不支持 Edge 环境
// export const runtime = "edge"; 

const openai = new OpenAI({
  apiKey: process.env.API_KEY || "",
  baseURL: process.env.BASE_URL || "https://api.openai.com/v1",
});

export async function POST(request: Request) {
  try {
    const { sessionId, userMessage } = await request.json();
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

    if (!sessionId || !userMessage) {
      return NextResponse.json({ code: 4000, message: "缺少 sessionId 或 userMessage" }, { status: 400 });
    }

    // 1. 将用户的消息先落库
    await prisma.interviewMessage.create({
      data: {
        sessionId,
        role: "user",
        content: userMessage,
      }
    });

    // 2. 拉取此 Session 下的所有历史消息作为上下文
    const history = await prisma.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 20, // 限制最大轮次防止 Token 爆炸
    });

    const sessionData = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { targetRole: true }
    });

    if (!sessionData) {
      return NextResponse.json({ code: 4040, message: "面试记录未找到" }, { status: 404 });
    }

    // 获取用户的全局画像和简历信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { persona: true, resumeText: true },
    });

    const personaContext = user?.persona ? `候选人的技术画像与能力特点：${user.persona}` : "";
    const resumeInfo = user?.resumeText ? `候选人的部分背景信息：${user.resumeText}` : "";

    // 3. 构建给大模型的历史对话数组
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = history.map(msg => ({
      role: msg.role === "ai" ? "assistant" : "user",
      content: msg.content,
    }));

    // 加入系统提示词设定人设
    messages.unshift({
      role: "system",
      content: `你正在面试一位申请【${sessionData.targetRole}】岗位的候选人。
      ${resumeInfo}
      ${personaContext}
      
      你的要求：
      1. 扮演一个严厉、专业且挑剔的面试官。
      2. 每次只抛出一个核心问题或一次深入追问，不要一口气问太多。
      3. 必须对候选人的回答进行挑刺或深挖细节，制造压力。结合候选人的技术画像，针对其优势或劣势进行重点考察。
      4. 说话要像人类面试官，简练、犀利，不带 markdown 冗余格式，不要输出 "面试官：" 这样的前缀。
      `
    });

    // 4. 调用 OpenAI 流式接口 (Stream)
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      stream: true, // 开启流式
    });

    // 5. 构造 Server-Sent Events (SSE) 响应流
    const encoder = new TextEncoder();
    
    const customStream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              // 按 SSE 格式写入 chunk 数据
              const payload = JSON.stringify({ chunk: content, isFinished: false });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }
          }

          // 当流结束时，发送一个带有 isFinished 的标志，并携带完整信息供前端处理落库逻辑
          const endPayload = JSON.stringify({ chunk: "", isFinished: true, fullMessage: fullResponse });
          controller.enqueue(encoder.encode(`data: ${endPayload}\n\n`));
          
          // 在后台默默把 AI 的完整回答落库
          await prisma.interviewMessage.create({
            data: {
              sessionId,
              role: "ai",
              content: fullResponse,
            }
          });
          
        } catch (err) {
          console.error("Stream generation error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "流式生成中断" })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Interview Chat Error:", error);
    return NextResponse.json({ code: 5001, message: "聊天请求异常" }, { status: 500 });
  }
}
