import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { id: userId, roleType: "student" },
      });
    }

    return NextResponse.json({
      code: 200,
      data: {
        id: user.id,
        persona: (user as any).persona || "",
        resumeText: (user as any).resumeText || "",
        careerPath: (user as any).careerPath ? JSON.parse((user as any).careerPath) : [],
      },
    });
  } catch (error: any) {
    console.error("Get User Profile Error:", error);
    return NextResponse.json({ code: 5000, message: "获取用户信息失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = request.headers.get("X-User-Id") || "demo-user-123";
    const body = await request.json();
    const { persona, resumeText } = body;

    const updateData: any = {};
    if (persona !== undefined) updateData.persona = persona;
    if (resumeText !== undefined) updateData.resumeText = resumeText;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      code: 200,
      data: {
        id: updatedUser.id,
        persona: (updatedUser as any).persona || "",
        resumeText: (updatedUser as any).resumeText || "",
      },
    });
  } catch (error: any) {
    console.error("Update User Profile Error:", error);
    return NextResponse.json({ code: 5001, message: "更新用户信息失败" }, { status: 500 });
  }
}
