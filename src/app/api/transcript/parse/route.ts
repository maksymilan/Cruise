import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    // 为了方便演示，如果没有传 User-Id，默认分配一个
    const userId = request.headers.get("X-User-Id") || "demo-user-123";

    if (!file) {
      return NextResponse.json({ code: 4000, message: "未检测到上传的文件" }, { status: 400 });
    }

    // 校验文件格式
    if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type)) {
      return NextResponse.json({ code: 4001, message: "不支持的文件格式" }, { status: 400 });
    }

    // 确保用户存在（演示环境自动创建）
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({ data: { id: userId, roleType: "student" } });
    }

    // 模拟 OCR 提取过程：实际项目中这里会调用阿里云 OCR 或 OpenAI Vision API
    // 这里我们使用一份写死的结构化成绩单数据作为演示，并带有明确的学期时间信息
    const mockCourses = [
      { name: "微积分", credit: 5.0, score: 85, term: "2023-2024秋季学期" },
      { name: "大学英语", credit: 2.0, score: 90, term: "2023-2024秋季学期" },
      { name: "数据结构", credit: 3.0, score: 92, term: "2024-2025秋季学期" },
      { name: "计算机网络", credit: 4.0, score: 78, term: "2024-2025春季学期" },
      { name: "操作系统", credit: 4.0, score: 88, term: "2025-2026秋季学期" },
      { name: "软件工程", credit: 3.0, score: 82, term: "2025-2026春季学期" },
    ];

    // 将解析记录存入数据库
    const transcript = await prisma.transcript.create({
      data: {
        userId: user.id,
        rawFileUrl: `local-mock-storage/${file.name}`, // 模拟文件存储路径
        parsedData: JSON.stringify(mockCourses),
      },
    });

    return NextResponse.json({
      code: 200,
      data: {
        parsedId: transcript.id,
        courses: mockCourses,
      },
    });
  } catch (error: any) {
    console.error("OCR Parse Error:", error);
    return NextResponse.json({ code: 5000, message: "解析成绩单失败" }, { status: 500 });
  }
}
