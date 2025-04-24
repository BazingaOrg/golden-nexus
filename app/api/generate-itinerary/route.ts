import { NextResponse } from "next/server"
import { parsePreferences, generateItinerary } from "@/lib/qwen-service"
import { processItinerary } from "@/lib/mcp-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { preferences } = body

    // 验证输入
    if (!preferences || typeof preferences !== "string" || !preferences.trim()) {
      return NextResponse.json({ error: "请提供您的旅行偏好" }, { status: 400 })
    }

    // 步骤1：使用Qwen 2.5解析偏好
    const parsedPreferences = await parsePreferences(preferences)

    // 步骤2：生成行程
    const itinerary = await generateItinerary(parsedPreferences, preferences)

    // 步骤3：处理行程（存储并准备展示）
    const itineraryId = await processItinerary(itinerary)

    return NextResponse.json({
      success: true,
      itineraryId,
      message: "行程生成成功",
    })
  } catch (error) {
    console.error("处理请求时出错:", error)
    return NextResponse.json({ error: "处理请求失败" }, { status: 500 })
  }
}
