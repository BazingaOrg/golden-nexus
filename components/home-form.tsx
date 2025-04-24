"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function HomeForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [preferences, setPreferences] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证输入
    if (!preferences.trim()) {
      toast({
        title: "请输入旅行需求",
        description: "请描述您的旅行需求，以便我们为您规划行程。",
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
      const response = await fetch("/api/process", {
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
      router.push(`/results?session=${data.sessionId}`)
    } catch (error) {
      console.error("处理请求时出错:", error)
      toast({
        title: "错误",
        description: "处理您的请求失败。请重试。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <Label htmlFor="preferences" className="text-lg font-medium">
            您的旅行需求是什么？
          </Label>
          <Textarea
            id="preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="例如：我想去北京旅游3天，想去长城、故宫和颐和园，预算3000元，住宿希望在市中心，想吃北京烤鸭。"
            className="mt-2 h-36"
          />
          <p className="text-sm text-gray-500 mt-2">
            请详细描述您的旅行需求，包括目的地、时间、预算、偏好的景点、住宿和餐饮等信息。
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              正在规划您的行程...
            </>
          ) : (
            "生成旅行计划"
          )}
        </Button>
      </div>
    </form>
  )
}
