import { Suspense } from "react"
import TravelForm from "@/components/travel-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AnimatedBackground from "@/components/animated-background"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-radial from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>

      <div className="container max-w-4xl mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400 text-transparent bg-clip-text">
            智能旅行规划
          </h1>
          <p className="text-xl mt-3 text-gray-300">AI驱动的个性化旅行体验</p>
        </div>

        <Card className="w-full mx-auto shadow-2xl border-0 overflow-hidden bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 pb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-32 -mb-32"></div>
            <CardTitle className="text-3xl font-bold relative z-10">开始您的旅程</CardTitle>
            <CardDescription className="text-blue-100 text-lg relative z-10">
              告诉我们您的旅行偏好，我们将为您创建完美的行程
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-10 px-8 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500/30 to-transparent"></div>
            <Suspense fallback={<div className="text-center py-8 text-gray-400">加载中...</div>}>
              <TravelForm />
            </Suspense>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-gray-400 text-sm">
          <p>由 Qwen 2.5 和高德地图提供技术支持</p>
        </div>
      </div>
    </main>
  )
}
