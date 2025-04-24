"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)
  const { theme } = useTheme()

  // 初始化画布尺寸
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 初始化粒子
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return

    const particleCount = Math.min(Math.floor((dimensions.width * dimensions.height) / 9000), 100)
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: getRandomColor(),
      })
    }

    particlesRef.current = particles
  }, [dimensions])

  // 动画循环
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0 || dimensions.height === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    const connections: { p1: number; p2: number; opacity: number }[] = []

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 更新和绘制粒子
      particlesRef.current.forEach((particle, index) => {
        // 更新位置
        particle.x += particle.speedX
        particle.y += particle.speedY

        // 边界检查
        if (particle.x < 0 || particle.x > dimensions.width) {
          particle.speedX = -particle.speedX
        }
        if (particle.y < 0 || particle.y > dimensions.height) {
          particle.speedY = -particle.speedY
        }

        // 绘制粒子
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${hexToRgb(particle.color)}, ${particle.opacity})`
        ctx.fill()

        // 寻找附近的粒子并连接
        for (let j = index + 1; j < particlesRef.current.length; j++) {
          const dx = particle.x - particlesRef.current[j].x
          const dy = particle.y - particlesRef.current[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            connections.push({
              p1: index,
              p2: j,
              opacity: 1 - distance / 150,
            })
          }
        }
      })

      // 绘制连接线
      connections.forEach((connection) => {
        const p1 = particlesRef.current[connection.p1]
        const p2 = particlesRef.current[connection.p2]

        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)

        // 使用粒子的颜色混合
        const color1 = hexToRgb(p1.color)
        const color2 = hexToRgb(p2.color)
        const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
        gradient.addColorStop(0, `rgba(${color1}, ${connection.opacity * 0.5})`)
        gradient.addColorStop(1, `rgba(${color2}, ${connection.opacity * 0.5})`)

        ctx.strokeStyle = gradient
        ctx.lineWidth = 0.5
        ctx.stroke()
      })

      connections.length = 0
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [dimensions])

  // 颜色辅助函数
  function getRandomColor() {
    // 根据主题选择颜色范围
    const colors = [
      "#3B82F6", // blue-500
      "#06B6D4", // cyan-500
      "#2DD4BF", // teal-400
      "#4F46E5", // indigo-600
      "#8B5CF6", // violet-500
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  function hexToRgb(hex: string) {
    // 移除#号
    hex = hex.replace("#", "")

    // 解析RGB值
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    return `${r}, ${g}, ${b}`
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}
