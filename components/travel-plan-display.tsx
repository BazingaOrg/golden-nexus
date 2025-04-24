"use client"

import { useEffect, useRef } from "react"

interface TravelPlanDisplayProps {
  html: string
}

export default function TravelPlanDisplay({ html }: TravelPlanDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current && html) {
      // 创建一个安全的方式来渲染HTML
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

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
  }, [html])

  return (
    <div className="travel-plan-container">
      <div ref={containerRef} className="travel-plan-content" />
    </div>
  )
}
