// Network detection service using Capacitor Network plugin
import { Network } from '@capacitor/network'
import { useState, useEffect } from 'react'

let networkStatus = { connected: true, connectionType: 'unknown' }
let listeners = []

/**
 * Initialize network monitoring
 */
export async function initNetwork() {
  try {
    const status = await Network.getStatus()
    networkStatus = status
    
    // Listen to network changes
    Network.addListener('networkStatusChange', (status) => {
      networkStatus = status
      listeners.forEach(cb => {
        try {
          cb(status)
        } catch (e) {
          console.error('Network listener error', e)
        }
      })
    })
  } catch (e) {
    console.warn('Network init failed', e)
    networkStatus = { connected: true, connectionType: 'unknown' }
  }
}

/**
 * Check if device is online
 */
export function isOnline() {
  return !!(networkStatus && networkStatus.connected)
}

/**
 * Get current network status
 */
export function getNetworkStatus() {
  return networkStatus
}

/**
 * Subscribe to network status changes
 */
export function onNetworkChange(callback) {
  listeners.push(callback)
  return () => {
    const index = listeners.indexOf(callback)
    if (index >= 0) {
      listeners.splice(index, 1)
    }
  }
}

/**
 * React hook for network status
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState(networkStatus)

  useEffect(() => {
    // Get initial status
    Network.getStatus().then(setStatus).catch(() => setStatus({ connected: true, connectionType: 'unknown' }))

    // Subscribe to changes
    const unsubscribe = onNetworkChange(setStatus)
    return unsubscribe
  }, [])

  return {
    isOnline: status.connected,
    connectionType: status.connectionType,
    status,
  }
}

// Initialize on import
initNetwork().catch(() => {})

