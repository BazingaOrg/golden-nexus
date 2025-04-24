import type { ParsedPreference } from "./preferences"

export interface TravelItinerary {
  html: string
  preferences: ParsedPreference[]
  destination: string
  originalInput: string
}
