import { NextResponse } from "next/server"
import { getResults } from "@/lib/mcp-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session")

    if (!sessionId) {
      return NextResponse.json({ error: "需要会话ID" }, { status: 400 })
    }

    // 从MCP服务获取结果
    const results = await getResults(sessionId)

    return NextResponse.json(results)
  } catch (error) {
    console.error("获取结果时出错:", error)
    return NextResponse.json({ error: "获取结果失败" }, { status: 500 })
  }
}
