// Utility helper functions

/**
 * Generate a unique ID
 */
export function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Parse JSON safely
 */
export function safeJsonParse(str, defaultValue = null) {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str
  } catch (e) {
    return defaultValue
  }
}

/**
 * Stringify JSON safely
 */
export function safeJsonStringify(obj, defaultValue = '{}') {
  try {
    return typeof obj === 'string' ? obj : JSON.stringify(obj)
  } catch (e) {
    return defaultValue
  }
}

/**
 * Format date for display
 */
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}

/**
 * Extract coordinates from activity
 * Supports multiple field name variations for coordinates
 */
export function getActivityCoordinates(activity) {
  if (!activity) return null
  
  // Try various field name combinations for coordinates
  const lon = activity.lon ?? 
              activity.longitude ?? 
              activity.lng ?? 
              activity.long ??
              (activity.coordinates && activity.coordinates[0]) ??
              (activity.coords && activity.coords[0])
  
  const lat = activity.lat ?? 
              activity.latitude ??
              (activity.coordinates && activity.coordinates[1]) ??
              (activity.coords && activity.coords[1])
  
  // Also check nested location object
  if ((!lon || !lat) && activity.location) {
    if (typeof activity.location === 'object') {
      const locLon = activity.location.lon ?? activity.location.longitude ?? activity.location.lng
      const locLat = activity.location.lat ?? activity.location.latitude
      if (locLon != null && locLat != null) {
        return [Number(locLon), Number(locLat)]
      }
    }
  }
  
  if (lon != null && lat != null) {
    const lonNum = Number(lon)
    const latNum = Number(lat)
    // Validate coordinates are reasonable
    if (!isNaN(lonNum) && !isNaN(latNum) && 
        lonNum >= -180 && lonNum <= 180 && 
        latNum >= -90 && latNum <= 90) {
      return [lonNum, latNum]
    }
  }
  
  // If location is a string, coordinates might need geocoding
  // For now, return null - geocoding can be done later if needed
  return null
}

/**
 * Extract start date from itinerary
 * Supports MongoDB schema (start_date) and legacy formats
 */
export function getItineraryStartDate(itinerary) {
  if (!itinerary) return null
  return itinerary.start_date ||  // MongoDB schema
         itinerary.startDate || 
         (itinerary.dates && itinerary.dates[0] && itinerary.dates[0].start) ||
         (itinerary.day_plans && itinerary.day_plans[0] && itinerary.day_plans[0].date) ||
         (itinerary.activities && itinerary.activities[0] && itinerary.activities[0].date) ||
         null
}

/**
 * Extract destination from itinerary
 * Supports MongoDB schema and legacy formats
 */
export function getItineraryDestination(itinerary) {
  if (!itinerary) return ''
  return itinerary.destination ||  // MongoDB schema
         itinerary.to || 
         itinerary.name || 
         itinerary.title || 
         'Unknown Destination'
}

/**
 * Get total activity count from itinerary
 * Supports MongoDB schema (day_plans) and legacy formats
 */
export function getTotalActivityCount(itinerary) {
  if (!itinerary) return 0
  
  // MongoDB schema: count activities in day_plans
  if (itinerary.day_plans && Array.isArray(itinerary.day_plans)) {
    return itinerary.day_plans.reduce((total, dayPlan) => {
      return total + (dayPlan.activities?.length || 0)
    }, 0)
  }
  
  // Legacy formats
  if (Array.isArray(itinerary.activities)) return itinerary.activities.length
  if (Array.isArray(itinerary.items)) return itinerary.items.length
  if (Array.isArray(itinerary.places)) return itinerary.places.length
  return 0
}

/**
 * Get duration in days from itinerary
 * Supports MongoDB schema (duration_days) and legacy formats
 */
export function getItineraryDuration(itinerary) {
  if (!itinerary) return 0
  
  if (itinerary.duration_days) return itinerary.duration_days
  
  // Calculate from dates if available
  if (itinerary.start_date && itinerary.end_date) {
    const start = new Date(itinerary.start_date)
    const end = new Date(itinerary.end_date)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays || 1
  }
  
  // Fallback to day_plans length
  if (itinerary.day_plans && Array.isArray(itinerary.day_plans)) {
    return itinerary.day_plans.length
  }
  
  return 0
}

/**
 * Extract activities from itinerary
 * Supports MongoDB schema (day_plans[].activities[]) and legacy formats
 */
export function getItineraryActivities(itinerary) {
  if (!itinerary) return []
  
  // MongoDB schema: activities are nested in day_plans
  if (itinerary.day_plans && Array.isArray(itinerary.day_plans)) {
    const allActivities = []
    itinerary.day_plans.forEach(dayPlan => {
      if (dayPlan.activities && Array.isArray(dayPlan.activities)) {
        // Add day info to each activity for context
        dayPlan.activities.forEach(activity => {
          allActivities.push({
            ...activity,
            day: dayPlan.day,
            dayDate: dayPlan.date,
            dayTitle: dayPlan.title,
            dayTheme: dayPlan.theme,
          })
        })
      }
    })
    if (allActivities.length > 0) return allActivities
  }
  
  // Legacy formats
  return itinerary.activities || 
         itinerary.items || 
         itinerary.places || 
         []
}

