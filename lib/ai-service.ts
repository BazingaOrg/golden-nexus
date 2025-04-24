import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

interface ParsedPreference {
  type: string
  value: string
  importance: number
}

export async function parsePreferences(preferencesText: string): Promise<ParsedPreference[]> {
  if (!preferencesText.trim()) {
    return []
  }

  try {
    const prompt = `
      Parse the following meeting location preferences into structured data.
      For each preference, identify:
      1. Type (e.g., "brand", "amenity", "location_type", "distance", "transportation")
      2. Value (the specific brand, amenity, etc.)
      3. Importance (a number from 1-10, where 10 is most important)

      User preferences: "${preferencesText}"

      Return a JSON array of objects with the structure:
      [
        {
          "type": "brand",
          "value": "Starbucks",
          "importance": 8
        },
        ...
      ]
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.2, // Lower temperature for more consistent parsing
    })

    // Extract the JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Failed to parse preferences")
    }

    const parsedPreferences = JSON.parse(jsonMatch[0]) as ParsedPreference[]
    return parsedPreferences
  } catch (error) {
    console.error("Error parsing preferences:", error)
    throw new Error("Failed to parse preferences")
  }
}
