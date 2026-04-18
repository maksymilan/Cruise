import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params;
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

    // 1. 获取岗位详情
    const role = await prisma.careerRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ code: 4040, message: "岗位未找到" }, { status: 404 });
    }

    const requiredRadar = JSON.parse(role.requiredRadar);

    // 2. 查找用户最新生成的图谱，计算差距 (如果有)
    const userReport = await prisma.analysisReport.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    let gapAnalysis = null;
    let userRadar = null;

    if (userReport) {
      userRadar = JSON.parse(userReport.radarData);
      
      const strengths = [];
      const weaknesses = [];

      for (const [key, reqVal] of Object.entries(requiredRadar) as [string, number][]) {
        const userVal = userRadar[key] || 0;
        if (userVal >= reqVal) strengths.push(key);
        else weaknesses.push(key);
      }

      gapAnalysis = {
        strengths,
        weaknesses,
        learningPath: [
          { title: "针对短板的定制训练", action: "根据 AI 诊断生成的学习路径进行查漏补缺。" }
        ]
      };
    }

    return NextResponse.json({
      code: 200,
      data: {
        roleInfo: {
          roleName: role.roleName,
          companyName: role.companyName,
          salaryRange: role.salaryRange,
          description: role.description,
          prospects: "3-5年可晋升为高级工程师/架构师",
        },
        requiredRadar,
        userRadar, // 返回给前端双雷达图用
        gapAnalysis,
      },
    });
  } catch (error: any) {
    console.error("Role Detail Error:", error);
    return NextResponse.json({ code: 5000, message: "获取岗位详情失败" }, { status: 500 });
  }
}
