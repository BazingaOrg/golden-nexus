"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Sparkles } from "lucide-react"

export default function TravelForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [preferences, setPreferences] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证输入
    if (!preferences.trim()) {
      toast({
        title: "请输入您的旅行偏好",
        description: "请告诉我们您想去哪里以及您想做什么。",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 准备数据
      const formData = {
        preferences: preferences,
      }

      // 调用API处理请求
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("处理请求失败")
      }

      const data = await response.json()

      // 导航到结果页面
      router.push(`/itinerary?id=${data.itineraryId}`)
    } catch (error) {
      console.error("处理请求时出错:", error)
      toast({
        title: "错误",
        description: "生成您的行程时出错。请重试。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="preferences" className="text-lg font-medium block mb-3 text-gray-200">
          您的旅行偏好是什么？
        </Label>
        <div className="relative">
          <Textarea
            id="preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="例如：我想和家人4月去东京旅游5天。我们对文化景点、美食和购物感兴趣。预算大约2000美元，希望住在市中心。"
            className="min-h-[180px] text-base bg-gray-800/50 border-gray-700 focus:border-cyan-500 focus:ring-cyan-500/20 text-gray-100 placeholder:text-gray-500"
          />
          <div className="absolute -bottom-1 -right-1 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
        <p className="text-sm text-gray-400 mt-2">请包括目的地、时间、兴趣点、预算以及您想参观的特定地点等详细信息。</p>
      </div>

      <Button
        type="submit"
        className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all border-0 shadow-lg shadow-cyan-700/20"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            正在创建您的完美行程...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            生成旅行行程
          </>
        )}
      </Button>
    </form>
  )
}
