import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { persona, careerPath } = await request.json();
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

    // 验证报告所有权
    const existingReport = await prisma.analysisReport.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingReport || existingReport.userId !== userId) {
      return NextResponse.json({ code: 404, message: "未找到该分析报告" }, { status: 404 });
    }

    // 更新数据
    const updateData: any = {};
    if (persona !== undefined) updateData.persona = persona;
    if (careerPath !== undefined) updateData.careerPath = JSON.stringify(careerPath);

    // 使用事务同时更新 Report 表和 User 表，确保两边数据一致
    const [updatedReport] = await prisma.$transaction([
      prisma.analysisReport.update({
        where: { id },
        data: updateData,
      }),
      prisma.user.update({
        where: { id: existingReport.userId },
        data: updateData,
      })
    ]);

    return NextResponse.json({
      code: 200,
      message: "更新成功",
      data: {
        id: updatedReport.id,
        persona: updatedReport.persona,
        careerPath: updatedReport.careerPath ? JSON.parse(updatedReport.careerPath) : [],
      },
    });
  } catch (error: any) {
    console.error("Update Report Error:", error);
    return NextResponse.json({ code: 5000, message: "更新分析报告失败" }, { status: 500 });
  }
}
