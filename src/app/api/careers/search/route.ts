import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const skip = (page - 1) * pageSize;

    // 模糊搜索岗位和公司
    const where = {
      OR: [
        { companyName: { contains: keyword } },
        { roleName: { contains: keyword } },
      ],
    };

    const [total, roles] = await Promise.all([
      prisma.careerRole.count({ where }),
      prisma.careerRole.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          companyName: "asc",
        },
      }),
    ]);

    // 格式化为按公司分组的数据结构
    const groupedData = roles.reduce((acc: any[], role) => {
      let companyGroup = acc.find((c) => c.companyName === role.companyName);
      
      if (!companyGroup) {
        companyGroup = {
          companyId: `c-${role.companyName}`,
          companyName: role.companyName,
          companyUrl: role.companyUrl,
          roles: [],
        };
        acc.push(companyGroup);
      }

      companyGroup.roles.push({
        roleId: role.id,
        roleName: role.roleName,
        alumniCount: Math.floor(Math.random() * 200) + 10, // 演示用的随机校友数量
      });

      return acc;
    }, []);

    return NextResponse.json({
      code: 200,
      data: {
        total,
        list: groupedData,
      },
    });
  } catch (error: any) {
    console.error("Career Search Error:", error);
    return NextResponse.json({ code: 5000, message: "岗位检索失败" }, { status: 500 });
  }
}
