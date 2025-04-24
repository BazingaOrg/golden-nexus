import type { ParsedPreference } from "@/types/preferences"
import type { TravelItinerary } from "@/types/travel"

interface QwenFunctionDefinition {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required: string[]
  }
}

interface QwenFunctionCall {
  name: string
  arguments: string
}

interface QwenResponse {
  id: string
  model: string
  created: number
  choices: {
    message: {
      role: string
      content: string | null
      function_call?: QwenFunctionCall
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// 解析用户偏好
export async function parsePreferences(preferencesText: string): Promise<ParsedPreference[]> {
  if (!preferencesText.trim()) {
    return []
  }

  try {
    const QWEN_API_KEY = process.env.QWEN_API_KEY
    const QWEN_API_ENDPOINT =
      process.env.QWEN_API_ENDPOINT || "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"

    // 更新函数定义，包括旅行偏好解析
    const parsePreferencesFunction: QwenFunctionDefinition = {
      name: "parse_travel_preferences",
      description: "解析用户旅行偏好并提取结构化数据",
      parameters: {
        type: "object",
        properties: {
          preferences: {
            type: "array",
            description: "解析后的偏好列表",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  description: "偏好类型（如目的地、时长、预算、兴趣、住宿等）",
                  enum: [
                    "destination",
                    "city",
                    "country",
                    "duration",
                    "dates",
                    "budget",
                    "interests",
                    "accommodation",
                    "transportation",
                    "food",
                    "activities",
                    "travelers",
                    "special_requirements",
                  ],
                },
                value: {
                  type: "string",
                  description: "具体偏好值",
                },
                importance: {
                  type: "number",
                  description: "重要性评分，1-10，10为最重要",
                  minimum: 1,
                  maximum: 10,
                },
              },
              required: ["type", "value", "importance"],
            },
          },
        },
        required: ["preferences"],
      },
    }

    // 准备请求Qwen API
    const response = await fetch(QWEN_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen-2.5-72b",
        messages: [
          {
            role: "system",
            content: "你是一个AI助手，帮助解析用户的旅行偏好。",
          },
          {
            role: "user",
            content: `解析以下旅行偏好并提取结构化数据: "${preferencesText}"`,
          },
        ],
        functions: [parsePreferencesFunction],
        function_call: { name: "parse_travel_preferences" },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Qwen API错误:", errorData)
      throw new Error(`Qwen API错误: ${response.status}`)
    }

    const data = (await response.json()) as QwenResponse

    // 提取函数调用结果
    const functionCall = data.choices[0]?.message?.function_call
    if (!functionCall || functionCall.name !== "parse_travel_preferences") {
      throw new Error("解析偏好失败: 响应中没有有效的函数调用")
    }

    // 解析函数调用参数
    const parsedArgs = JSON.parse(functionCall.arguments)
    return parsedArgs.preferences as ParsedPreference[]
  } catch (error) {
    console.error("使用Qwen解析偏好时出错:", error)
    throw new Error("解析偏好失败")
  }
}

// 生成旅行行程
export async function generateItinerary(
  preferences: ParsedPreference[],
  originalPreferences: string,
): Promise<TravelItinerary> {
  try {
    const QWEN_API_KEY = process.env.QWEN_API_KEY
    const QWEN_API_ENDPOINT =
      process.env.QWEN_API_ENDPOINT || "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"

    // 提取目的地以动态确定城市
    const destinationPref = preferences.find(
      (pref) => pref.type === "destination" || pref.type === "city" || pref.type === "country",
    )
    const destination = destinationPref?.value || "未知目的地"

    // 准备偏好描述
    const preferencesDescription = preferences
      .map((pref) => `${pref.type}: ${pref.value} (重要性: ${pref.importance}/10)`)
      .join("\n")

    // 准备请求Qwen API
    const response = await fetch(QWEN_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen-2.5-72b",
        messages: [
          {
            role: "system",
            content: `# 旅游行程规划师提示词

你是一位经验丰富的旅游行程规划师。根据用户的旅行需求，创建一个旅行计划并以网页格式呈现。该过程严格分为两个步骤：规划行程和生成精美的网页。天气和地址信息可以通过高德MCP地图工具获取。

## **第一步：规划行程**

### **具体要求**

#### **行程标题区**
-   **目的地名称**（主标题，醒目位置）
-   旅行日期和总天数
-   旅行者姓名/团队名称（可选）
-   天气信息摘要（通过高德MCP地图工具查询）

#### **行程概览区**
-   按日期分区的行程简表
-   每天主要活动/景点的概览
-   使用图标标识不同类型的活动

#### **详细时间表区**
-   以表格或时间轴形式呈现详细行程
-   包含时间、地点、活动描述
-   每个景点的停留时间
-   标注门票价格和必要预订信息

#### **交通信息区**
-   主要交通换乘点及方式
-   地铁/公交线路和站点信息
-   预计交通时间
-   使用箭头或连线表示行程路线

#### **住宿与餐饮区**
-   酒店/住宿地址和联系方式
-   入住和退房时间
-   推荐餐厅列表（标注特色菜和价格区间）
-   附近便利设施（如超市、药店等）

#### **实用信息区**
-   紧急联系电话
-   重要提示和注意事项
-   预算摘要
-   行李清单提醒

--- 

## **第二步：生成网页**

### **技术规范**
1.  **使用以下框架和库：**
    -   HTML5
    -   Font Awesome: [https://lf6-cdn-tos.bytecdntp.com/cdn/expire-100-M/font-awesome/6.0.0/css/all.min.css](https://lf6-cdn-tos.bytecdntp.com/cdn/expire-100-M/font-awesome/6.0.0/css/all.min.css)
    -   Tailwind CSS: [https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/tailwindcss/2.2.19/tailwind.min.css](https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/tailwindcss/2.2.19/tailwind.min.css)
    -   中文字体: [https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap](https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap)
    -   Leaflet.js:
        \`\`\`html
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        \`\`\`

2.  **代码要求：**
    -   确保代码简洁高效，注重性能和可维护性。
    -   使用CSS变量管理颜色和间距，便于风格统一。
    -   输出一个完整的HTML文件，包含所有设计风格的卡片。
    -   代码应当优雅且符合最佳实践，CSS应体现出对细节的极致追求。
    -   设计宽度根据手机宽度自适应。

3.  **功能要求：**
    -   文字背景干净，字体颜色不一致，保证文字可阅读性。
    -   信息完整，确保用户能够轻松理解。
    -   地点导航功能：点击地点能唤起高德App进行导航（安卓使用安卓的，苹果使用苹果的，PC使用网页）。

--- 

### **风格要求**

#### **设计目标**
1.  **视觉吸引力：** 创造一个在视觉上令人印象深刻的网页，能够立即吸引用户的注意力，并激发他们的阅读兴趣。
2.  **可读性：** 确保内容清晰易读，无论在桌面端还是移动端，都能提供舒适的阅读体验。
3.  **信息传达：** 以一种既美观又高效的方式呈现信息，突出关键内容，引导用户理解核心思想。
4.  **情感共鸣：** 通过设计激发与内容主题相关的情感（例如，对于励志内容，激发积极向上的情绪；对于严肃内容，营造庄重、专业的氛围）。

#### **设计指导**
1.  **整体风格：** 可以考虑杂志风格、出版物风格，或者其他现代Web设计风格。目标是创造一个既有信息量，又有视觉吸引力的页面，就像一本精心设计的数字杂志或一篇深度报道。
2.  **Hero模块**（可选，但强烈建议）：设计一个引人注目的Hero模块，包含大标题、副标题、一段引人入胜的引言，以及一张高质量的背景图片或插图。
3.  **排版：**
    -   精心选择字体组合（衬线和无衬线），以提升中文阅读体验。
    -   利用不同的字号、字重、颜色和样式，创建清晰的视觉层次结构。
    -   使用Font Awesome图标点缀增加趣味性。
4.  **配色方案：**
    -   选择一套既和谐又具有视觉冲击力的配色方案。
    -   配色活泼大方，适合旅游风格。
    -   考虑使用高对比度的颜色组合来突出重要元素， 比如渐变、阴影。
5.  **布局：**
    -   使用基于网格的布局系统来组织页面元素。
    -   充分利用负空间（留白），创造视觉平衡和呼吸感。
    -   使用卡片、分割线、图标等视觉元素来分隔和组织内容。
6.  **调性：** 整体风格精致，营造一种高级感。

#### **数据可视化**
-   设计一个或多个数据可视化元素，展示关键概念和它们之间的关系。
-   使用Mermaid.js实现交互式图表，允许用户探索不同概念之间的关联。

#### **景点地图功能**
-   使用Leaflet.js库，标记景点位置和名称，名称一直显示。
    \`\`\`html
       <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
       <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
       \`\`\`
--- 

### **输出要求**
-   提供一个完整的HTML文件，包含所有设计风格的卡片。
-   确保网页在移动端和桌面端均能完美展示。
-   注重创建现代、视觉吸引人的设计，具有出色的移动响应性。
-   删除任何不必要的代码，确保最终输出干净且结构良好。
-   在页面中添加适当的动画效果，以增强用户体验。
-   页面内容全部使用中文。`,
          },
          {
            role: "user",
            content: `根据以下旅行偏好，生成详细的旅行行程并以网页形式呈现：

原始用户输入: "${originalPreferences}"

解析后的偏好:
${preferencesDescription}

目的地似乎是: ${destination}

请创建一个完整的旅行行程，并以精美、现代的网页形式呈现。确保针对移动设备进行优化，并创建视觉吸引人的设计。`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Qwen API错误:", errorData)
      throw new Error(`Qwen API错误: ${response.status}`)
    }

    const data = (await response.json()) as QwenResponse
    const htmlContent = data.choices[0]?.message?.content || ""

    // 提取HTML内容
    const htmlMatch = htmlContent.match(/<html[\s\S]*<\/html>/i)
    const extractedHtml = htmlMatch ? htmlMatch[0] : htmlContent

    return {
      html: extractedHtml,
      preferences: preferences,
      destination: destination,
      originalInput: originalPreferences,
    }
  } catch (error) {
    console.error("生成行程时出错:", error)
    throw new Error("生成行程失败")
  }
}
