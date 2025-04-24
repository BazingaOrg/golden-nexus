"use server"

import { parsePreferences } from "@/lib/ai-service"
import { processLocations, getResults } from "@/lib/mcp-service"

interface Person {
  name: string
  address: string
}

interface FormData {
  people: Person[]
  preferences: string
}

export async function processFormData(formData: FormData) {
  try {
    // Validate input
    if (!formData.people || formData.people.length < 2) {
      return { error: "At least two people with addresses are required" }
    }

    // Step 1: Parse preferences using OpenAI
    const parsedPreferences = await parsePreferences(formData.preferences)

    // Step 2: Process locations using Gaode MCP
    const sessionId = await processLocations(formData.people, parsedPreferences)

    return {
      success: true,
      sessionId,
      message: "Processing started successfully",
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return { error: "Failed to process request" }
  }
}

export async function fetchResults(sessionId: string) {
  try {
    if (!sessionId) {
      return { error: "Session ID is required" }
    }

    // Get results from the MCP service
    const results = await getResults(sessionId)
    return results
  } catch (error) {
    console.error("Error fetching results:", error)
    return { error: "Failed to fetch results" }
  }
}
