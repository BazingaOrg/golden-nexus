"use client"

import Link from "next/link"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Download, Printer, Share2 } from "lucide-react"
import type { TravelItinerary } from "@/types/travel"

interface ItineraryDisplayProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ItineraryDisplay({ searchParams }: ItineraryDisplayProps) {
  const { toast } = useToast()
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const itineraryId = searchParams.id as string

  useEffect(() => {
    const fetchItinerary = async () => {
      if (!itineraryId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/itinerary?id=${itineraryId}`)

        if (!response.ok) {
          throw new Error("获取行程失败")
        }

        const data = await response.json()
        setItinerary(data)
      } catch (error) {
        console.error("获取行程时出错:", error)
        toast({
          title: "错误",
          description: "加载您的行程失败。请重试。",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchItinerary()
  }, [itineraryId, toast])

  useEffect(() => {
    if (containerRef.current && itinerary?.html) {
      // 创建一个安全的方式来渲染HTML
      const parser = new DOMParser()
      const doc = parser.parseFromString(itinerary.html, "text/html")

      // 提取<body>内容
      const bodyContent = doc.body.innerHTML

      // 设置HTML内容
      containerRef.current.innerHTML = bodyContent

      // 执行脚本
      const scripts = containerRef.current.querySelectorAll("script")
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script")
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value)
        })
        newScript.appendChild(document.createTextNode(oldScript.innerHTML))
        oldScript.parentNode?.replaceChild(newScript, oldScript)
      })
    }
  }, [itinerary])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!itinerary) return

    const blob = new Blob([itinerary.html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${itinerary.destination.replace(/\s+/g, "-").toLowerCase()}-行程.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "行程已下载",
      description: "您的行程已作为HTML文件下载。",
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${itinerary?.destination || "您的旅行"}行程`,
          text: `查看我的${itinerary?.destination || "旅行"}行程！`,
          url: window.location.href,
        })
      } catch (error) {
        console.error("分享时出错:", error)
      }
    } else {
      // 备选方案 - 复制到剪贴板
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "链接已复制",
        description: "行程链接已复制到剪贴板！",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-gray-800/70 border-gray-700 backdrop-blur-sm">
          <Skeleton className="h-12 w-3/4 mb-6 bg-gray-700" />
          <Skeleton className="h-6 w-full mb-4 bg-gray-700" />
          <Skeleton className="h-6 w-5/6 mb-4 bg-gray-700" />
          <Skeleton className="h-6 w-4/6 mb-8 bg-gray-700" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Skeleton className="h-40 w-full bg-gray-700" />
            <Skeleton className="h-40 w-full bg-gray-700" />
          </div>
          <Skeleton className="h-60 w-full bg-gray-700" />
        </Card>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-8 backdrop-blur-sm max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-gray-200">未找到行程</h2>
          <p className="text-gray-400 mb-6">我们无法找到您的旅行行程。请返回首页重新创建。</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0">
              创建新行程
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-end print:hidden">
        <Button
          variant="outline"
          onClick={handlePrint}
          className="border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200"
        >
          <Printer className="mr-2 h-4 w-4" />
          打印
        </Button>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200"
        >
          <Download className="mr-2 h-4 w-4" />
          下载
        </Button>
        <Button
          variant="outline"
          onClick={handleShare}
          className="border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200"
        >
          <Share2 className="mr-2 h-4 w-4" />
          分享
        </Button>
      </div>

      <div
        ref={containerRef}
        className="itinerary-content bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in-50 border border-gray-700"
      />
    </div>
  )
}
