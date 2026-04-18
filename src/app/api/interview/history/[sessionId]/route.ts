import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

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

    return NextResponse.json({ code: 200, data: sessionData });
  } catch (error: any) {
    console.error("Fetch Session Detail Error:", error);
    return NextResponse.json({ code: 5001, message: "获取详情异常" }, { status: 500 });
  }
}