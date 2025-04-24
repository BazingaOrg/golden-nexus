import type { TravelPlan } from "./travel"

export interface GaodeCoordinate {
  longitude: number
  latitude: number
}

// Update the GaodeLocation interface to include optional additional fields
export interface GaodeLocation {
  id: string
  name: string
  address: string
  location: GaodeCoordinate
  // Additional fields from maps_search_detail
  type?: string
  tel?: string
  website?: string
  business_area?: string
}

export interface GaodeRoute {
  duration: number // in minutes
  distance: number // in meters
  steps: string[]
  mode?: TransportMode // Added transport mode
}

export interface ResultPerson {
  name: string
  travelTime: string
  transitInfo: string
  transportMode: TransportMode // Added transport mode
}

// Add transport mode enum
export type TransportMode = "transit" | "walking" | "bicycling" | "driving"

// Update the Recommendation interface to include additional fields
export interface Recommendation {
  id: string
  name: string
  address: string
  matchScore: number
  rationale: string
  matchedPreferences: string[]
  people: ResultPerson[]
  averageTravelTime: string
  furthestPerson: {
    name: string
    travelTime: string
  }
  closestPerson: {
    name: string
    travelTime: string
  }
  // Additional fields from POI details
  type?: string
  tel?: string
  website?: string
  business_area?: string
  // Distance information
  straightLineDistance?: string
}

export interface ResultsResponse {
  travelPlan?: TravelPlan
  status?: string
  error?: string
}
