"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import TravelPlanDisplay from "@/components/travel-plan-display"
import type { TravelPlan } from "@/types/travel"

export default function ResultsList({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { toast } = useToast()
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)

  const sessionId = searchParams.session as string

  useEffect(() => {
    const fetchResults = async () => {
      if (!sessionId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/results?session=${sessionId}`)

        if (!response.ok) {
          throw new Error("获取结果失败")
        }

        const data = await response.json()

        if (data.status === "processing") {
          setStatus("processing")
          // 2秒后再次轮询
          setTimeout(fetchResults, 2000)
          return
        }

        setTravelPlan(data.travelPlan || null)
        setStatus(null)
      } catch (error) {
        console.error("获取结果时出错:", error)
        toast({
          title: "错误",
          description: "加载旅行计划失败。请重试。",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [sessionId, toast])

  if (loading || status === "processing") {
    return (
      <div className="space-y-6">
        <div className="text-center mb-4">
          {status === "processing" ? (
            <p className="text-blue-600 dark:text-blue-400">正在处理您的请求...这可能需要一点时间。</p>
          ) : (
            <p>加载结果中...</p>
          )}
        </div>
        <Card className="p-6">
          <Skeleton className="h-12 w-3/4 mb-6" />
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-5/6 mb-4" />
          <Skeleton className="h-6 w-4/6 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-60 w-full" />
        </Card>
      </div>
    )
  }

  if (!travelPlan) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">未找到旅行计划</h2>
        <p className="text-gray-500 dark:text-gray-400">我们无法找到您的旅行计划。请返回首页重新提交您的旅行需求。</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <TravelPlanDisplay html={travelPlan.html} />
    </div>
  )
}
