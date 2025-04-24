import { NextResponse } from "next/server"
import { getItinerary } from "@/lib/mcp-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itineraryId = searchParams.get("id")

    if (!itineraryId) {
      return NextResponse.json({ error: "需要行程ID" }, { status: 400 })
    }

    // 获取行程
    const itinerary = await getItinerary(itineraryId)

    if (!itinerary) {
      return NextResponse.json({ error: "未找到行程" }, { status: 404 })
    }

    return NextResponse.json(itinerary)
  } catch (error) {
    console.error("获取行程时出错:", error)
    return NextResponse.json({ error: "获取行程失败" }, { status: 500 })
  }
}
