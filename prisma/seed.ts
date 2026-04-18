import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  {
    companyName: "字节跳动",
    companyUrl: "https://jobs.bytedance.com/campus/position/detail/7386341258705602857",
    roleName: "后端开发工程师",
    salaryRange: "25k-40k",
    description: "负责字节跳动核心业务后端系统的设计与开发。要求扎实的计算机基础，熟练掌握 Go/Python/C/C++ 等编程语言，熟悉常见的数据结构和算法，有高并发系统架构经验者优先。你需要具备优秀的逻辑分析能力和团队协作精神，共同打造支撑亿级用户的稳定后端服务。",
    requiredRadar: JSON.stringify({
      programming: 90,
      math: 80,
      analysis: 85,
      communication: 75,
      teamwork: 85,
    }),
  },
  {
    companyName: "腾讯",
    companyUrl: "https://careers.tencent.com/jobdesc.html?postId=1725515291244032000",
    roleName: "产品经理",
    salaryRange: "20k-35k",
    description: "负责微信、QQ、腾讯视频等核心产品线的需求调研、产品设计和迭代优化。需要敏锐的用户洞察力，优秀的数据分析能力和跨部门团队协作能力。你将与研发、设计、运营等团队紧密合作，推动产品从概念到落地，持续提升用户体验。",
    requiredRadar: JSON.stringify({
      programming: 40,
      math: 60,
      analysis: 90,
      communication: 95,
      teamwork: 90,
    }),
  },
  {
    companyName: "阿里巴巴",
    companyUrl: "https://talent.alibaba.com/campus/position-detail?positionId=1234567",
    roleName: "前端开发工程师",
    salaryRange: "22k-38k",
    description: "负责淘宝、天猫等电商核心业务的前端研发。要求精通 HTML/CSS/JavaScript，熟悉 React 或 Vue 生态，对前端工程化、性能优化、跨端技术有深入理解。希望你对新技术充满热情，追求极致的用户体验和代码质量。",
    requiredRadar: JSON.stringify({
      programming: 85,
      math: 70,
      analysis: 80,
      communication: 80,
      teamwork: 85,
    }),
  },
  {
    companyName: "百度",
    companyUrl: "https://talent.baidu.com/jobs/detail/12345",
    roleName: "算法工程师 (大模型方向)",
    salaryRange: "30k-50k",
    description: "参与文心一言等大模型底层算法的研发与优化，包括预训练、微调、强化学习等环节。要求计算机、人工智能或数学相关专业，熟悉 PyTorch/TensorFlow 框架，具备扎实的数学基础和论文阅读复现能力，在顶级会议有论文发表者优先。",
    requiredRadar: JSON.stringify({
      programming: 85,
      math: 95,
      analysis: 90,
      communication: 70,
      teamwork: 80,
    }),
  },
  {
    companyName: "美团",
    companyUrl: "https://zhaopin.meituan.com/web/position/detail?jobUnionId=12345",
    roleName: "数据分析师",
    salaryRange: "18k-30k",
    description: "深入美团外卖、到店等业务，通过数据分析驱动业务决策。熟练使用 SQL、Python/R 进行数据处理和统计建模，具备良好的商业 Sense 和逻辑思维。你将构建业务监控指标体系，设计 A/B 实验，并输出深度分析报告。",
    requiredRadar: JSON.stringify({
      programming: 75,
      math: 90,
      analysis: 90,
      communication: 85,
      teamwork: 80,
    }),
  },
  {
    companyName: "快手",
    companyUrl: "https://campus.kuaishou.cn/recruit/campus/e/#/campus/jobs",
    roleName: "客户端开发工程师 (iOS/Android)",
    salaryRange: "22k-40k",
    description: "负责快手短视频、直播等核心业务的移动端研发。熟悉 Objective-C/Swift 或 Java/Kotlin，了解移动端内存管理、网络优化和 UI 渲染机制。面对千万级 DAU 挑战，你将参与解决各种复杂的性能和稳定性问题。",
    requiredRadar: JSON.stringify({
      programming: 85,
      math: 75,
      analysis: 80,
      communication: 75,
      teamwork: 85,
    }),
  }
];

async function main() {
  console.log("Start seeding Career Roles...");

  // 清空现有的测试数据
  await prisma.careerRole.deleteMany();
  console.log("Cleared existing roles.");

  for (const role of roles) {
    const createdRole = await prisma.careerRole.create({
      data: role,
    });
    console.log(`Created role: ${createdRole.roleName} @ ${createdRole.companyName}`);
  }

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
