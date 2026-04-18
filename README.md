# 🚢 Cruise (巡航)

> 基于 AI 的学生能力分析与个性化职业规划平台 (课程项目)

## 📖 项目简介

**Cruise** 是一个旨在帮助大学生打破“信息差”、实现精准求职的智能职业规划平台。系统通过分析学生的成绩单，利用大语言模型（LLM）构建多维度的个人能力图谱（Persona），并基于真实的行业招聘数据，为学生提供量身定制的职业发展路径、岗位匹配度分析以及沉浸式的 AI 模拟压力面试体验。

本项目为课程演示级全栈 Web 应用，涵盖了从数据解析、图谱生成、职业探索到实时流式对话（SSE）等多个核心模块。

---

## ✨ 核心功能模块

### 1. 📊 成绩单分析与智能画像 (Module 1)
- **模拟 OCR 解析**：用户上传成绩单（支持 PDF/Image），系统解析出课程、学分与成绩。
- **动态年级推断**：AI 根据课程时间轴智能推断用户当前所处的年级（如：大三下学期）。
- **五维能力雷达图**：生成包括编程实践、数学基础、分析解决、沟通表达、团队协作的雷达数据（基于 Recharts 渲染）。
- **个性化发展指南**：结合当前年级，生成详细的课程修读、技能提升、项目实践及实习规划 Markdown 报告。
- **可编辑的个人档案**：AI 提炼用户的技术特征与画像（Persona），并生成阶段性的职业生涯路径图，支持用户手动修改并**全局持久化落库**。

### 2. 🔍 职业探索与能力对比 (Module 2)
- **真实大厂数据展示**：内置精选的一线互联网大厂（字节、腾讯、阿里等）真实岗位 JD、薪资与能力要求基线。
- **双层雷达图对比分析**：使用 CSS 乘底混合（Mix-blend-multiply）技术，直观呈现用户的个人能力雷达与岗位基线雷达的重叠区域，精准定位差距。
- **智能学习路径推荐**：基于能力差距分析（Gap Analysis），针对短板维度提供定制化的学习行动建议。

### 3. 🎙️ 沉浸式 AI 模拟压力面 (Module 3)
- **动态上下文注入**：AI 面试官在开场前会自动读取用户的“全局个人画像”和“历史简历库”，发起极其针对性的高压提问。
- **SSE 流式输出 (打字机效果)**：基于 `ReadableStream` 封装 Server-Sent Events，实现与 OpenAI 的实时流式对话，确保丝滑的体验。
- **真实面试环境模拟**：支持自选面试时长（15/30/45/60分钟）、内置严格的倒计时系统，支持快捷键（Shift+Enter）发送。
- **面试复盘与历史回放**：结束面试后，大模型会对整场表现进行综合打分，生成评估报告。用户可在全局档案中心随时查阅历次面试记录及完整对话回放。

---

## 🛠️ 技术栈选型

### 前端 (Frontend)
- **框架**: Next.js 15 (App Router) + React 19
- **样式**: Tailwind CSS v4 + `@tailwindcss/typography`
- **UI 组件**: Lucide React (图标)
- **数据可视化**: Recharts
- **文本渲染**: React Markdown

### 后端 (Backend)
- **运行环境**: Node.js
- **数据库**: SQLite (用于本地快速演示与开发)
- **ORM 框架**: Prisma v6.4
- **AI 接口**: OpenAI Node SDK (`gpt-4o` 模型，兼容流式输出与 JSON 格式强制约束)

---

## 🚀 快速开始

### 1. 克隆并安装依赖
\`\`\`bash
git clone <repository-url>
cd Cruise
npm install
\`\`\`

### 2. 环境配置
在项目根目录创建一个 \`.env\` 文件，并配置你的大模型 API 密钥：
\`\`\`env
# 数据库连接
DATABASE_URL="file:./dev.db"

# OpenAI 兼容 API 配置 (必填)
API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
BASE_URL="https://api.openai.com/v1" # 或使用国内/中转代理商的 URL
\`\`\`

### 3. 初始化数据库与注入真实数据
生成 Prisma Client，并将表结构推送到本地 SQLite 数据库，最后注入大厂岗位真实 Seed 数据：
\`\`\`bash
npx prisma db push
npx prisma generate
npm run prisma:seed
\`\`\`

### 4. 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`
打开浏览器访问 [http://localhost:3000](http://localhost:3000) (或根据终端提示的端口访问) 即可开始体验！

---

## 📂 项目结构概览

\`\`\`text
Cruise/
├── prisma/
│   ├── schema.prisma       # 数据库模型定义 (User, Transcript, AnalysisReport, CareerRole, Session, Message)
│   └── seed.ts             # 大厂真实岗位数据填充脚本
├── src/
│   ├── app/                # Next.js App Router 目录
│   │   ├── api/            # 后端 API 路由 (分析生成、面试流式处理、历史记录、全局用户档案)
│   │   ├── career/         # 职业探索页面
│   │   ├── interview/      # 模拟面试页面
│   │   └── page.tsx        # 首页 (成绩单上传与智能画像展示)
│   ├── components/         # React 核心业务组件
│   │   ├── AbilityRadarChart.tsx # 雷达图组件
│   │   ├── EditablePersonaPath.tsx # 可编辑的画像与路径图组件
│   │   ├── InterviewConsole.tsx  # 模拟面试控制台 (SSE 流式接收核心)
│   │   ├── Navbar.tsx            # 全局导航栏
│   │   ├── RoleDetailModal.tsx   # 岗位对比详情模态框
│   │   ├── UploadTranscript.tsx  # 上传交互组件
│   │   └── UserProfileModal.tsx  # 结合 Portal 的全局个人档案中心 (简历库)
│   └── lib/                # 工具函数 (Prisma 实例)
├── Design.md               # 早期项目需求与架构设计文档
└── package.json            # 依赖与脚本配置
\`\`\`

---

## 💡 开发踩坑记录与解决方案 (Tips)

1. **React Strict Mode 与 SSE 流式输出双字重复**：
   - *问题*：在 React 18+ 的严格模式下，直接修改状态对象（如 `lastMsg.content += data.chunk`）会导致在开发环境下出现文字重复（如“你你提提到到”）。
   - *解决*：严格遵循不可变数据（Immutable Data）原则，在 `setMessages` 时返回全新的对象内存地址：`{ ...lastMsg, content: lastMsg.content + chunk }`。
2. **Next.js 开发模式下 Prisma 500 错误**：
   - *问题*：更新 Prisma Schema 并 `db push` 后，调用 API 报错 `Unknown argument`。
   - *解决*：这是因为 Next.js 进程缓存了旧的 Prisma Client 实例，手动重启 `npm run dev` 即可解决。
3. **Tailwind Backdrop-blur 遮挡 Fixed Modal**：
   - *问题*：在带有 `backdrop-blur` 滤镜的导航栏中触发全屏 Modal 时，Modal 无法覆盖整个视口，层级被限制。
   - *解决*：使用 React `createPortal` 将 Modal 组件从导航栏 DOM 树中抽离，直接挂载到 `document.body` 尾部，彻底解决层叠上下文（Stacking Context）问题。
4. **Agent 联网搜索方案降级**：
   - *问题*：使用 `duck-duck-scrape` 时容易被搜索引擎反爬虫封禁导致接口超时。
   - *解决*：在演示项目中降级为模拟的高质量行业趋势文本注入；建议在生产环境切换为支持原生联网功能的大模型（如 Kimi、百川）或购买商用搜索 API（如 Bing Search API）。

---

> 👨‍💻 *由 AI Pair-Programming 辅助构建，致力于为大学生提供更好的求职护航。*
