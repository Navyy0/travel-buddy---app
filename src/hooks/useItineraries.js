// Hook for managing itineraries (online and offline)
import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/axiosClient'
import { 
  getAllOfflineItineraries, 
  saveItineraryOffline, 
  getOfflineItinerary,
  deleteOfflineItinerary,
  isItineraryOffline 
} from '../storage/sqlite'
import { useNetworkStatus } from '../api/network'

export function useItineraries() {
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isOnline } = useNetworkStatus()

  const loadItineraries = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (isOnline) {
        // Fetch from backend
        const response = await api.itineraries.getAll()
        const data = Array.isArray(response.data) ? response.data : []
        setItineraries(data)
      } else {
        // Load from offline storage
        const offlineData = await getAllOfflineItineraries()
        setItineraries(offlineData)
      }
    } catch (err) {
      console.error('Load itineraries error', err)
      
      // Fallback to offline if online fails
      if (isOnline) {
        try {
          const offlineData = await getAllOfflineItineraries()
          setItineraries(offlineData)
        } catch (offlineErr) {
          setError(err.message || 'Failed to load itineraries')
        }
      } else {
        setError(err.message || 'Failed to load offline itineraries')
      }
    } finally {
      setLoading(false)
    }
  }, [isOnline])

  useEffect(() => {
    loadItineraries()
  }, [loadItineraries])

  const getItinerary = useCallback(async (id) => {
    try {
      if (isOnline) {
        const response = await api.itineraries.getById(id)
        return response.data
      } else {
        return await getOfflineItinerary(id)
      }
    } catch (err) {
      // Fallback to offline
      if (isOnline) {
        return await getOfflineItinerary(id)
      }
      throw err
    }
  }, [isOnline])

  const downloadOffline = useCallback(async (itinerary) => {
    try {
      await saveItineraryOffline(itinerary)
      return true
    } catch (err) {
      console.error('Download offline error', err)
      throw err
    }
  }, [])

  const deleteItinerary = useCallback(async (id) => {
    try {
      if (isOnline) {
        await api.itineraries.delete(id)
      }
      // Also delete from offline
      await deleteOfflineItinerary(id)
      setItineraries(prev => prev.filter(i => i.id !== id))
      return true
    } catch (err) {
      console.error('Delete itinerary error', err)
      throw err
    }
  }, [isOnline])

  const checkIsOffline = useCallback(async (id) => {
    return await isItineraryOffline(id)
  }, [])

  return {
    itineraries,
    loading,
    error,
    loadItineraries,
    getItinerary,
    downloadOffline,
    deleteItinerary,
    checkIsOffline,
    isOnline,
  }
}

