import { NextResponse } from "next/server"
import { parsePreferences, generateTravelPlan } from "@/lib/qwen-service"
import { processTravelPlan } from "@/lib/mcp-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { preferences } = body

    // 验证输入
    if (!preferences || typeof preferences !== "string" || !preferences.trim()) {
      return NextResponse.json({ error: "请提供旅行需求描述" }, { status: 400 })
    }

    // 步骤1：使用Qwen 2.5解析偏好
    const parsedPreferences = await parsePreferences(preferences)

    // 步骤2：生成旅行计划
    const travelPlan = await generateTravelPlan(parsedPreferences)

    // 步骤3：处理旅行计划（存储并准备展示）
    const sessionId = await processTravelPlan(travelPlan)

    return NextResponse.json({
      success: true,
      sessionId,
      message: "旅行计划生成成功",
    })
  } catch (error) {
    console.error("处理请求时出错:", error)
    return NextResponse.json({ error: "处理请求失败" }, { status: 500 })
  }
}
