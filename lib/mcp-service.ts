import type { Person } from "@/types/person"
import type { ParsedPreference, TransportPreference } from "@/types/preferences"
import type {
  GaodeCoordinate,
  GaodeLocation,
  GaodeRoute,
  Recommendation,
  ResultPerson,
  TransportMode,
} from "@/types/mcp"
import type { TravelPlan, TravelItinerary } from "@/types/travel"
import type { ResultsResponse } from "@/types/mcp"

const MCP_API_ENDPOINT = process.env.MCP_API_ENDPOINT || "https://router.mcp.so/mcp/zmu0knm9i3x6v5"
const MCP_API_KEY = process.env.MCP_API_KEY

// In-memory store for itineraries (would be replaced with a database in production)
const itineraryStore = new Map<string, TravelItinerary>()

// Process and store the generated itinerary
export async function processItinerary(itinerary: TravelItinerary): Promise<string> {
  try {
    // Generate an ID for this itinerary
    const itineraryId = `itinerary-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`

    // Store the itinerary
    itineraryStore.set(itineraryId, itinerary)

    return itineraryId
  } catch (error) {
    console.error("Error processing itinerary:", error)
    throw new Error("Failed to process itinerary")
  }
}

// Retrieve a stored itinerary
export async function getItinerary(itineraryId: string): Promise<TravelItinerary | null> {
  try {
    const itinerary = itineraryStore.get(itineraryId)
    return itinerary || null
  } catch (error) {
    console.error(`Error retrieving itinerary ${itineraryId}:`, error)
    return null
  }
}

// Get weather information for a location using Amap MCP
export async function getWeather(city: string): Promise<any> {
  try {
    const MCP_API_ENDPOINT = process.env.MCP_API_ENDPOINT
    const MCP_API_KEY = process.env.MCP_API_KEY

    if (!MCP_API_ENDPOINT || !MCP_API_KEY) {
      throw new Error("MCP API configuration missing")
    }

    const response = await fetch(`${MCP_API_ENDPOINT}/maps_weather`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MCP_API_KEY}`,
      },
      body: JSON.stringify({
        city: city,
      }),
    })

    if (!response.ok) {
      throw new Error(`Weather request failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error getting weather for ${city}:`, error)
    return null
  }
}

// Geocode an address using Amap MCP
export async function geocodeAddress(address: string, city = "北京"): Promise<any> {
  try {
    const MCP_API_ENDPOINT = process.env.MCP_API_ENDPOINT
    const MCP_API_KEY = process.env.MCP_API_KEY

    if (!MCP_API_ENDPOINT || !MCP_API_KEY) {
      throw new Error("MCP API configuration missing")
    }

    const response = await fetch(`${MCP_API_ENDPOINT}/maps_geo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MCP_API_KEY}`,
      },
      body: JSON.stringify({
        address: address,
        city: city,
      }),
    })

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error geocoding address ${address}:`, error)
    return null
  }
}

// Search for POIs using Amap MCP
export async function searchPOIs(keywords: string, city: string): Promise<any> {
  try {
    const MCP_API_ENDPOINT = process.env.MCP_API_ENDPOINT
    const MCP_API_KEY = process.env.MCP_API_KEY

    if (!MCP_API_ENDPOINT || !MCP_API_KEY) {
      throw new Error("MCP API configuration missing")
    }

    const response = await fetch(`${MCP_API_ENDPOINT}/maps_text_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MCP_API_KEY}`,
      },
      body: JSON.stringify({
        keywords: keywords,
        city: city,
      }),
    })

    if (!response.ok) {
      throw new Error(`POI search failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error searching POIs for ${keywords} in ${city}:`, error)
    return null
  }
}

// Update the geocodeAddress function to use the maps_geo tool
// async function geocodeAddress(address: string): Promise<GaodeCoordinate> {
//   try {
//     const response = await fetch(`${MCP_API_ENDPOINT}/maps_geo`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${MCP_API_KEY}`,
//       },
//       body: JSON.stringify({
//         address: address,
//         city: "北京", // Default to Beijing, could be made dynamic
//       }),
//     })

//     if (!response.ok) {
//       throw new Error(`Geocoding failed: ${response.status}`)
//     }

//     const data = await response.json()

//     // Extract the first result's location
//     if (data.geocodes && data.geocodes.length > 0) {
//       const location = data.geocodes[0].location.split(",")
//       return {
//         longitude: Number.parseFloat(location[0]),
//         latitude: Number.parseFloat(location[1]),
//       }
//     }

//     throw new Error("No geocoding results found")
//   } catch (error) {
//     console.error(`Error geocoding address ${address}:`, error)

//     // Fallback to mock data for development/demo purposes
//     return {
//       longitude: 116.3 + Math.random() * 0.1,
//       latitude: 39.9 + Math.random() * 0.1,
//     }
//   }
// }

// Add a new function to get POI details using maps_search_detail
async function getPOIDetails(poiId: string): Promise<GaodeLocation | null> {
  try {
    const response = await fetch(`${MCP_API_ENDPOINT}/maps_search_detail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MCP_API_KEY}`,
      },
      body: JSON.stringify({
        id: poiId,
      }),
    })

    if (!response.ok) {
      throw new Error(`POI detail search failed: ${response.status}`)
    }

    const data = await response.json()

    // Extract POI information
    if (data.pois && data.pois.length > 0) {
      const poi = data.pois[0]
      const location = poi.location.split(",")
      return {
        id: poi.id,
        name: poi.name,
        address: poi.address || "No address available",
        location: {
          longitude: Number.parseFloat(location[0]),
          latitude: Number.parseFloat(location[1]),
        },
        // Add additional fields if needed
        type: poi.type,
        tel: poi.tel,
        website: poi.website,
        business_area: poi.business_area,
      }
    }

    return null
  } catch (error) {
    console.error(`Error getting POI details for ${poiId}:`, error)
    return null
  }
}

// Add a function to get reverse geocoding information
async function reverseGeocode(coordinate: GaodeCoordinate): Promise<string> {
  try {
    const response = await fetch(`${MCP_API_ENDPOINT}/maps_regeocode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MCP_API_KEY}`,
      },
      body: JSON.stringify({
        location: `${coordinate.longitude},${coordinate.latitude}`,
      }),
    })

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`)
    }

    const data = await response.json()

    // Extract address information
    if (data.regeocode && data.regeocode.formatted_address) {
      return data.regeocode.formatted_address
    }

    throw new Error("No reverse geocoding results found")
  } catch (error) {
    console.error(`Error reverse geocoding coordinates:`, error)
    return "Unknown location"
  }
}

// Add a function to calculate distance using maps_distance
async function calculateDistance(origin: GaodeCoordinate, destination: GaodeCoordinate, type = 0): Promise<number> {
  try {
    const response = await fetch(`${MCP_API_ENDPOINT}/maps_distance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MCP_API_KEY}`,
      },
      body: JSON.stringify({
        origins: `${origin.longitude},${origin.latitude}`,
        destination: `${destination.longitude},${destination.latitude}`,
        type: type, // 0 for straight line, 1 for driving, 3 for walking
      }),
    })

    if (!response.ok) {
      throw new Error(`Distance calculation failed: ${response.status}`)
    }

    const data = await response.json()

    // Extract distance information
    if (data.results && data.results.length > 0 && data.results[0].distance) {
      return data.results[0].distance
    }

    throw new Error("No distance results found")
  } catch (error) {
    console.error("Error calculating distance:", error)

    // Fallback to a simple calculation for development/demo purposes
    const latDiff = Math.abs(destination.latitude - origin.latitude)
    const lngDiff = Math.abs(destination.longitude - origin.longitude)
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 100000
  }
}

// Update the route calculation function to support multiple transport modes
async function calculateRoutes(
  origin: GaodeCoordinate,
  destination: GaodeCoordinate,
  mode: TransportMode = "transit",
): Promise<GaodeRoute> {
  try {
    let endpoint: string
    let requestBody: any

    switch (mode) {
      case "walking":
        endpoint = `${MCP_API_ENDPOINT}/maps_direction_walking`
        requestBody = {
          origin: `${origin.longitude},${origin.latitude}`,
          destination: `${destination.longitude},${destination.latitude}`,
        }
        break
      case "bicycling":
        endpoint = `${MCP_API_ENDPOINT}/maps_bicycling`
        requestBody = {
          origin: `${origin.longitude},${origin.latitude}`,
          destination: `${destination.longitude},${destination.latitude}`,
        }
        break
      case "driving":
        endpoint = `${MCP_API_ENDPOINT}/maps_direction_driving`
        requestBody = {
          origin: `${origin.longitude},${origin.latitude}`,
          destination: `${destination.longitude},${destination.latitude}`,
        }
        break
      case "transit":
      default:
        endpoint = `${MCP_API_ENDPOINT}/maps_direction_transit_integrated`
        requestBody = {
          origin: `${origin.longitude},${origin.latitude}`,
          destination: `${destination.longitude},${destination.latitude}`,
          city: "北京", // Default to Beijing
          cityd: "北京", // Default to Beijing
        }
        break
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MCP_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Route calculation failed: ${response.status}`)
    }

    const data = await response.json()

    // Extract route information based on transport mode
    let duration = 0
    let distance = 0
    let steps: string[] = []

    switch (mode) {
      case "walking":
        if (data.route && data.route.paths && data.route.paths.length > 0) {
          const path = data.route.paths[0]
          duration = path.duration / 60 // Convert to minutes
          distance = path.distance
          steps = path.steps.map((step: any) => `Walk ${step.instruction}`)
        }
        break
      case "bicycling":
        if (data.data && data.data.paths && data.data.paths.length > 0) {
          const path = data.data.paths[0]
          duration = path.duration / 60 // Convert to minutes
          distance = path.distance
          steps = path.steps.map((step: any) => `Cycle ${step.instruction}`)
        }
        break
      case "driving":
        if (data.route && data.route.paths && data.route.paths.length > 0) {
          const path = data.route.paths[0]
          duration = path.duration / 60 // Convert to minutes
          distance = path.distance
          steps = path.steps.map((step: any) => `Drive ${step.instruction}`)
        }
        break
      case "transit":
      default:
        if (data.route && data.route.transits && data.route.transits.length > 0) {
          const transit = data.route.transits[0]
          duration = transit.duration / 60 // Convert to minutes
          distance = transit.distance

          // Extract steps information
          steps = transit.segments.map((segment: any) => {
            if (segment.walking) {
              return `Walk ${segment.walking.distance}m`
            } else if (segment.bus) {
              return `Take ${segment.bus.buslines[0].name} for ${segment.bus.buslines[0].via_stops} stops`
            } else if (segment.railway) {
              return `Take ${segment.railway.name} for ${segment.railway.via_stops} stops`
            }
            return "Transit"
          })
        }
        break
    }

    if (duration === 0 && distance === 0) {
      throw new Error("No route results found")
    }

    return {
      duration: Math.round(duration),
      distance: Math.round(distance),
      steps: steps,
      mode: mode,
    }
  } catch (error) {
    console.error(`Error calculating ${mode} route:`, error)

    // Fallback to mock data for development/demo purposes
    const latDiff = Math.abs(destination.latitude - origin.latitude)
    const lngDiff = Math.abs(destination.longitude - origin.longitude)
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 100000
    let duration: number

    // Adjust duration based on transport mode
    switch (mode) {
      case "walking":
        duration = distance / 80 // Roughly 80m per minute walking
        break
      case "bicycling":
        duration = distance / 250 // Roughly 250m per minute cycling
        break
      case "driving":
        duration = distance / 800 // Roughly 800m per minute driving
        break
      case "transit":
      default:
        duration = distance / 500 // Roughly 500m per minute on transit
        break
    }

    let stepText: string
    switch (mode) {
      case "walking":
        stepText = "Walk to destination"
        break
      case "bicycling":
        stepText = "Cycle to destination"
        break
      case "driving":
        stepText = "Drive to destination"
        break
      case "transit":
      default:
        stepText = "Take public transit to destination"
        break
    }

    return {
      duration: Math.round(duration),
      distance: Math.round(distance),
      steps: [stepText],
      mode: mode,
    }
  }
}

// Update the searchPOIs function to use maps_around_search and maps_text_search
async function searchPOIs_old(
  location: GaodeCoordinate,
  preferences: ParsedPreference[],
  searchRadius = 3000,
): Promise<GaodeLocation[]> {
  try {
    // Extract keywords from preferences
    const keywords = preferences
      .filter((pref) => pref.type === "brand" || pref.type === "amenity")
      .map((pref) => pref.value)
      .join("|")

    // Extract types from preferences
    const types = preferences
      .filter((pref) => pref.type === "location_type")
      .map((pref) => pref.value)
      .join("|")

    // Use maps_around_search for location-based search
    const aroundResponse = await fetch(`${MCP_API_ENDPOINT}/maps_around_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MCP_API_KEY}`,
      },
      body: JSON.stringify({
        location: `${location.longitude},${location.latitude}`,
        keywords: keywords || undefined,
        radius: searchRadius,
      }),
    })

    if (!aroundResponse.ok) {
      throw new Error(`POI around search failed: ${aroundResponse.status}`)
    }

    const aroundData = await aroundResponse.json()
    const aroundPois = aroundData.pois || []

    // Use maps_text_search for keyword-based search if we have specific types
    let textPois: any[] = []
    if (types) {
      const textResponse = await fetch(`${MCP_API_ENDPOINT}/maps_text_search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MCP_API_KEY}`,
        },
        body: JSON.stringify({
          keywords: keywords || "meeting point",
          types: types,
          city: "北京", // Default to Beijing
        }),
      })

      if (textResponse.ok) {
        const textData = await textResponse.json()
        textPois = textData.pois || []
      }
    }

    // Combine and deduplicate POIs
    const combinedPois = [...aroundPois]
    textPois.forEach((poi) => {
      if (!combinedPois.some((p) => p.id === poi.id)) {
        combinedPois.push(poi)
      }
    })

    // Sort by distance from center point
    combinedPois.sort((a, b) => {
      const aLocation = a.location.split(",")
      const bLocation = b.location.split(",")
      const aLat = Number.parseFloat(aLocation[1])
      const aLng = Number.parseFloat(aLocation[0])
      const bLat = Number.parseFloat(bLocation[1])
      const bLng = Number.parseFloat(bLocation[0])

      const aDist = Math.pow(aLat - location.latitude, 2) + Math.pow(aLng - location.longitude, 2)
      const bDist = Math.pow(bLat - location.latitude, 2) + Math.pow(bLng - location.longitude, 2)

      return aDist - bDist
    })

    // Get detailed information for each POI
    const pois: GaodeLocation[] = []
    const poiLimit = Math.min(5, combinedPois.length) // Limit to top 5 to avoid too many API calls

    for (let i = 0; i < poiLimit; i++) {
      const poi = combinedPois[i]
      const poiDetail = await getPOIDetails(poi.id)
      if (poiDetail) {
        pois.push(poiDetail)
      } else {
        // Fallback to basic POI info if details can't be fetched
        const location = poi.location.split(",")
        pois.push({
          id: poi.id,
          name: poi.name,
          address: poi.address || "No address available",
          location: {
            longitude: Number.parseFloat(location[0]),
            latitude: Number.parseFloat(location[1]),
          },
        })
      }
    }

    return pois
  } catch (error) {
    console.error("Error searching POIs:", error)

    // Fallback to mock data for development/demo purposes
    const poiCount = 3 + Math.floor(Math.random() * 3) // 3-5 POIs
    const pois: GaodeLocation[] = []
    const poiTypes = ["Shopping Mall", "Office Building", "Restaurant", "Cafe", "Park"]

    for (let i = 0; i < poiCount; i++) {
      const poi: GaodeLocation = {
        id: `poi-${i}`,
        name: `${poiTypes[Math.floor(Math.random() * poiTypes.length)]} ${i + 1}`,
        address: `Sample Street ${100 + i}, Beijing`,
        location: {
          longitude: location.longitude + (Math.random() - 0.5) * 0.01,
          latitude: location.latitude + (Math.random() - 0.5) * 0.01,
        },
      }
      pois.push(poi)
    }

    return pois
  }
}

// Add a function to get weather information
// async function getWeather(city: string): Promise<any> {
//   try {
//     const response = await fetch(`${MCP_API_ENDPOINT}/maps_weather`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${MCP_API_KEY}`,
//       },
//       body: JSON.stringify({
//         city: city,
//       }),
//     })

//     if (!response.ok) {
//       throw new Error(`Weather request failed: ${response.status}`)
//     }

//     return await response.json()
//   } catch (error) {
//     console.error(`Error getting weather for ${city}:`, error)
//     return null
//   }
// }

// Update the findOptimalMeetingPoints function to consider transport preferences
async function findOptimalMeetingPoints(
  peopleCoordinates: { name: string; coordinate: GaodeCoordinate; id?: string }[],
  preferences: ParsedPreference[],
  transportPreferences: TransportPreference[] = [],
): Promise<Recommendation[]> {
  try {
    // Calculate center point (simple average for demo)
    const centerPoint = peopleCoordinates.reduce(
      (acc, person) => {
        acc.longitude += person.coordinate.longitude / peopleCoordinates.length
        acc.latitude += person.coordinate.latitude / peopleCoordinates.length
        return acc
      },
      { longitude: 0, latitude: 0 },
    )

    // Check if there are any weather preferences
    const weatherPreferences = preferences.filter((pref) => pref.type === "weather")
    let weatherData = null

    if (weatherPreferences.length > 0) {
      // Get weather data for Beijing (or dynamically determine city)
      weatherData = await getWeather("北京")
    }

    // Search for POIs near the center point
    const pois = await searchPOIs_old(centerPoint, preferences)

    // For each POI, calculate routes from each person
    const recommendations: Recommendation[] = []

    for (const poi of pois.slice(0, 3)) {
      // Limit to top 3 POIs
      const people: ResultPerson[] = []
      let totalTime = 0
      let minTime = Number.MAX_SAFE_INTEGER
      let maxTime = 0
      let closestPerson = { name: "", travelTime: "" }
      let furthestPerson = { name: "", travelTime: "" }

      // Calculate straight-line distance for reference
      const straightLineDistance = await calculateDistance(centerPoint, poi.location, 0)

      // Calculate routes for each person
      for (const person of peopleCoordinates) {
        // Determine transport mode for this person
        let transportMode: TransportMode = "transit" // Default to transit
        if (person.id) {
          const preference = transportPreferences.find((p) => p.personId === person.id)
          if (preference) {
            transportMode = preference.mode
          }
        }

        const route = await calculateRoutes(person.coordinate, poi.location, transportMode)
        const travelTimeMinutes = route.duration
        totalTime += travelTimeMinutes

        const resultPerson: ResultPerson = {
          name: person.name,
          travelTime: `${travelTimeMinutes} min`,
          transitInfo: route.steps.join(", "),
          transportMode: transportMode,
        }

        if (travelTimeMinutes < minTime) {
          minTime = travelTimeMinutes
          closestPerson = { name: person.name, travelTime: resultPerson.travelTime }
        }

        if (travelTimeMinutes > maxTime) {
          maxTime = travelTimeMinutes
          furthestPerson = { name: person.name, travelTime: resultPerson.travelTime }
        }

        people.push(resultPerson)
      }

      // Calculate match score based on preferences
      const matchedPreferences = calculateMatchedPreferences(poi, preferences, weatherData)
      const matchScore = calculateMatchScore(matchedPreferences, preferences)

      // Create recommendation with additional POI details
      recommendations.push({
        id: poi.id,
        name: poi.name,
        address: poi.address,
        matchScore,
        rationale: generateRationale(matchedPreferences, people.length),
        matchedPreferences: matchedPreferences.map((p) => p.value),
        people,
        averageTravelTime: `${Math.round(totalTime / people.length)} min avg`,
        furthestPerson,
        closestPerson,
        // Add additional fields from POI details
        type: poi.type,
        tel: poi.tel,
        website: poi.website,
        business_area: poi.business_area,
        // Add straight-line distance
        straightLineDistance: `${(straightLineDistance / 1000).toFixed(1)} km`,
      })
    }

    // Sort recommendations by match score (highest first)
    return recommendations.sort((a, b) => b.matchScore - a.matchScore)
  } catch (error) {
    console.error("Error finding optimal meeting points:", error)
    throw new Error("Failed to find optimal meeting points")
  }
}

// Helper function to calculate matched preferences
function calculateMatchedPreferences(
  poi: GaodeLocation,
  preferences: ParsedPreference[],
  weatherData: any = null,
): ParsedPreference[] {
  const matchedPrefs: ParsedPreference[] = []

  for (const pref of preferences) {
    let isMatched = false

    switch (pref.type) {
      case "brand":
      case "amenity":
        // Check if POI name or type contains the preference value
        isMatched =
          poi.name.toLowerCase().includes(pref.value.toLowerCase()) ||
          (poi.type && poi.type.toLowerCase().includes(pref.value.toLowerCase()))
        break

      case "location_type":
        // Check if POI type matches the preference
        isMatched = poi.type && poi.type.toLowerCase().includes(pref.value.toLowerCase())
        break

      case "weather":
        // Check if weather data matches preference
        if (weatherData && weatherData.forecasts && weatherData.forecasts.length > 0) {
          const forecast = weatherData.forecasts[0]
          isMatched = forecast.dayWeather.toLowerCase().includes(pref.value.toLowerCase())
        }
        break

      default:
        // For other preference types, use a random match for demo purposes
        isMatched = Math.random() > 0.3
    }

    if (isMatched) {
      matchedPrefs.push(pref)
    }
  }

  return matchedPrefs
}

// Helper function to calculate match score
function calculateMatchScore(matchedPreferences: ParsedPreference[], allPreferences: ParsedPreference[]): number {
  if (allPreferences.length === 0) return 7 // Default score

  // Calculate weighted score based on matched preferences and their importance
  const totalImportance = allPreferences.reduce((sum, pref) => sum + pref.importance, 0)
  const matchedImportance = matchedPreferences.reduce((sum, pref) => sum + pref.importance, 0)

  // Scale to 1-10 range
  return 7 + (matchedImportance / totalImportance) * 3
}

// Helper function to generate rationale
function generateRationale(matchedPreferences: ParsedPreference[], peopleCount: number): string {
  const prefTypes = new Set(matchedPreferences.map((p) => p.type))
  const prefValues = matchedPreferences.map((p) => p.value).join(", ")

  return `This location matches ${matchedPreferences.length} of your preferences (${prefValues}) and provides reasonable travel times for all ${peopleCount} people.`
}

// Main function to process locations and preferences
export async function processLocations(
  people: Person[],
  preferences: ParsedPreference[],
  transportPreferences: TransportPreference[] = [],
): Promise<string> {
  try {
    // Generate a session ID for this request
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`

    // Store the request data in a database or cache for later processing
    // For this example, we'll use a simple in-memory store
    sessionStore.set(sessionId, { people, preferences, transportPreferences, status: "processing" })

    // Start asynchronous processing
    processSessionAsync(sessionId)

    return sessionId
  } catch (error) {
    console.error("Error processing locations:", error)
    throw new Error("Failed to process locations")
  }
}

// In-memory session store (would be replaced with a database in production)
const sessionStore = new Map<string, any>()

// Asynchronous processing function
async function processSessionAsync(sessionId: string) {
  try {
    const session = sessionStore.get(sessionId)
    if (!session) return

    const { people, preferences, transportPreferences } = session

    // Geocode all addresses
    const peopleCoordinates = await Promise.all(
      people.map(async (person) => ({
        id: person.id,
        name: person.name,
        coordinate: await geocodeAddress(person.address),
      })),
    )

    // Find optimal meeting points
    const recommendations = await findOptimalMeetingPoints(peopleCoordinates, preferences, transportPreferences)

    // Store results
    sessionStore.set(sessionId, {
      ...session,
      status: "completed",
      recommendations,
      completedAt: new Date(),
    })
  } catch (error) {
    console.error(`Error processing session ${sessionId}:`, error)
    const session = sessionStore.get(sessionId)
    if (session) {
      sessionStore.set(sessionId, {
        ...session,
        status: "error",
        error: "Failed to process request",
      })
    }
  }
}

// Function to get results for a session
export async function getResults(sessionId: string): Promise<ResultsResponse> {
  try {
    const session = sessionStore.get(sessionId)

    if (!session) {
      throw new Error("Session not found")
    }

    if (session.status === "processing") {
      return { recommendations: [], status: "processing" }
    }

    if (session.status === "error") {
      throw new Error(session.error || "Unknown error")
    }

    return { recommendations: session.recommendations || [] }
  } catch (error) {
    console.error(`Error getting results for session ${sessionId}:`, error)

    // For development/demo purposes, return mock data if session not found
    if (!sessionStore.has(sessionId)) {
      const mockRecommendations = generateMockRecommendations()
      return { recommendations: mockRecommendations }
    }

    throw new Error("Failed to get results")
  }
}

// Helper function to generate mock recommendations (for development/demo)
function generateMockRecommendations(): Recommendation[] {
  const recommendationCount = 2 + Math.floor(Math.random() * 2) // 2-3 recommendations
  const recommendations: Recommendation[] = []

  const locationTypes = ["Joy City Mall", "Wangjing SOHO", "Sanlitun Plaza", "China World Trade Center"]
  const preferences = ["Near subway station", "Has Starbucks", "Shopping options", "Restaurants nearby"]

  for (let i = 0; i < recommendationCount; i++) {
    // Generate mock people data
    const peopleCount = 2 + Math.floor(Math.random() * 3) // 2-4 people
    const mockPeople: ResultPerson[] = []

    let totalTime = 0
    let minTime = 100
    let maxTime = 0
    let closestPerson = { name: "", travelTime: "" }
    let furthestPerson = { name: "", travelTime: "" }

    for (let j = 0; j < peopleCount; j++) {
      const travelTimeMinutes = 15 + Math.floor(Math.random() * 45) // 15-60 minutes
      totalTime += travelTimeMinutes

      // Randomly assign a transport mode
      const transportModes: TransportMode[] = ["transit", "walking", "bicycling", "driving"]
      const randomMode = transportModes[Math.floor(Math.random() * transportModes.length)]

      const person: ResultPerson = {
        name: `Person ${j + 1}`,
        travelTime: `${travelTimeMinutes} min`,
        transitInfo: getTransitInfoByMode(randomMode, travelTimeMinutes),
        transportMode: randomMode,
      }

      if (travelTimeMinutes < minTime) {
        minTime = travelTimeMinutes
        closestPerson = { name: person.name, travelTime: person.travelTime }
      }

      if (travelTimeMinutes > maxTime) {
        maxTime = travelTimeMinutes
        furthestPerson = { name: person.name, travelTime: person.travelTime }
      }

      mockPeople.push(person)
    }

    // Select random preferences for this recommendation
    const matchedPrefsCount = 2 + Math.floor(Math.random() * 3) // 2-4 preferences
    const matchedPreferences: string[] = []
    const shuffledPrefs = [...preferences].sort(() => 0.5 - Math.random())

    for (let k = 0; k < matchedPrefsCount; k++) {
      if (shuffledPrefs[k]) {
        matchedPreferences.push(shuffledPrefs[k])
      }
    }

    const recommendation: Recommendation = {
      id: `rec-${i}`,
      name: locationTypes[Math.floor(Math.random() * locationTypes.length)],
      address: `Beijing, Chaoyang District, Sample Road ${100 + i}`,
      matchScore: 7 + Math.random() * 3, // 7-10 score
      rationale: `This location matches ${matchedPrefsCount} of your preferences and provides reasonable travel times for everyone.`,
      matchedPreferences,
      people: mockPeople,
      averageTravelTime: `${Math.round(totalTime / peopleCount)} min avg`,
      furthestPerson,
      closestPerson,
      straightLineDistance: `${(1 + Math.random() * 5).toFixed(1)} km`,
      type: "商场,购物中心",
      tel: `010-${Math.floor(10000000 + Math.random() * 90000000)}`,
      business_area: "朝阳区",
    }

    recommendations.push(recommendation)
  }

  // Sort recommendations by match score (highest first)
  recommendations.sort((a, b) => b.matchScore - a.matchScore)

  return recommendations
}

// Helper function to generate transit info based on transport mode
function getTransitInfoByMode(mode: TransportMode, duration: number): string {
  switch (mode) {
    case "walking":
      return `Walk ${Math.round(duration * 80)}m to destination`
    case "bicycling":
      return `Cycle ${Math.round(duration * 250)}m to destination`
    case "driving":
      return `Drive via ${["Third Ring Road", "Fourth Ring Road", "Airport Expressway"][Math.floor(Math.random() * 3)]}`
    case "transit":
    default:
      return `Take Line ${Math.floor(Math.random() * 15) + 1} for ${Math.floor(Math.random() * 8) + 1} stops`
  }
}

// 内存中的会话存储（在生产环境中会替换为数据库）
// const sessionStore = new Map<string, any>() // already defined above

// 处理旅行计划
export async function processTravelPlan(travelPlan: TravelPlan): Promise<string> {
  try {
    // 为此请求生成会话ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`

    // 将请求数据存储在数据库或缓存中以供后续处理
    // 对于此示例，我们将使用简单的内存存储
    sessionStore.set(sessionId, {
      travelPlan,
      status: "completed",
      completedAt: new Date(),
    })

    return sessionId
  } catch (error) {
    console.error("处理旅行计划时出错:", error)
    throw new Error("处理旅行计划失败")
  }
}

// 获取会话结果的函数
// export async function getResults(sessionId: string): Promise<ResultsResponse> { // Overriding existing function
//   try {
//     const session = sessionStore.get(sessionId)

//     if (!session) {
//       throw new Error("会话未找到")
//     }

//     if (session.status === "processing") {
//       return { status: "processing" }
//     }

//     if (session.status === "error") {
//       throw new Error(session.error || "未知错误")
//     }

//     return {
//       travelPlan: session.travelPlan,
//       status: "completed"
//     }
//   } catch (error) {
//     console.error(`获取会话 ${sessionId} 的结果时出错:`, error)
//     throw new Error("获取结果失败")
//   }
// }
