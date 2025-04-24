import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import ItineraryDisplay from "@/components/itinerary-display"
import Link from "next/link"
import AnimatedBackground from "@/components/animated-background"

export default function ItineraryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <main className="min-h-screen bg-gradient-radial from-gray-900 via-gray-800 to-black text-white">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>

      <div className="container max-w-5xl mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400 text-transparent bg-clip-text">
            您的旅行行程
          </h1>
          <Link href="/">
            <Button variant="outline" className="border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200">
              创建新行程
            </Button>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="text-center py-12">
              <div className="inline-block h-16 w-16 relative">
                <div className="absolute inset-0 rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-blue-500 border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
                <div className="absolute inset-4 rounded-full border-2 border-t-transparent border-r-transparent border-b-teal-500 border-l-transparent animate-spin animation-delay-300"></div>
              </div>
              <p className="text-lg text-gray-300 mt-4">正在加载您的旅行行程...</p>
            </div>
          }
        >
          <ItineraryDisplay searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  )
}
