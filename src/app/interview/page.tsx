import InterviewConsole from "@/components/InterviewConsole";

export default function InterviewPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 flex flex-col items-center">
      <div className="max-w-4xl w-full text-center mb-8">
        <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight mb-4">
          AI 模拟压力面
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          真实的连环追问，全方位检验你的专业深度与抗压能力
        </p>
      </div>

      <div className="w-full">
        <InterviewConsole />
      </div>
    </main>
  );
}
