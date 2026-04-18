import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

    const sessions = await prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        targetRole: true,
        status: true,
        createdAt: true,
        reportData: true,
      },
    });

    return NextResponse.json({ code: 200, data: sessions });
  } catch (error: any) {
    console.error("Fetch History Error:", error);
    return NextResponse.json({ code: 5001, message: "获取历史记录异常" }, { status: 500 });
  }
}