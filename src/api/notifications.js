// Push notifications and local notifications service
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

// Lazy load push notifications to avoid build issues
let PushNotifications = null
const loadPushNotifications = async () => {
  if (PushNotifications !== null) return PushNotifications
  if (!Capacitor.isNativePlatform()) return null
  
  try {
    // Use dynamic import with string to avoid static analysis
    const modName = '@capacitor/push-notifications'
    const mod = await import(/* @vite-ignore */ modName)
    PushNotifications = mod.PushNotifications
    return PushNotifications
  } catch (e) {
    console.warn('Push notifications not available', e)
    PushNotifications = false // Mark as tried
    return null
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  try {
    // Request local notification permissions
    const localPerm = await LocalNotifications.requestPermissions()
    const localGranted = localPerm.display === 'granted'

    // Request push notification permissions (native only)
    let pushGranted = false
    const pushMod = await loadPushNotifications()
    if (pushMod) {
      try {
        const pushPerm = await pushMod.requestPermissions()
        pushGranted = pushPerm.receive === 'granted'
      } catch (e) {
        console.warn('Push notifications permission error', e)
      }
    }

    return { local: localGranted, push: pushGranted }
  } catch (error) {
    console.error('Request notification permissions failed', error)
    return { local: false, push: false }
  }
}

/**
 * Initialize push notifications
 */
export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  const pushMod = await loadPushNotifications()
  if (!pushMod) return

  try {
    // Register for push notifications
    await pushMod.register()

    // Listen for registration
    if (pushMod.addListener) {
      pushMod.addListener('registration', (token) => {
        console.log('Push registration success, token:', token.value)
        // TODO: Send token to backend
      })

      // Listen for registration errors
      pushMod.addListener('registrationError', (error) => {
        console.error('Push registration error', error)
      })

      // Listen for push notifications
      pushMod.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received', notification)
      })

      // Listen for push notification actions
      pushMod.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification)
      })
    }
  } catch (error) {
    console.error('Init push notifications failed', error)
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification({ id, title, body, at, sound = 'default' }) {
  try {
    // Check plugin availability first
    const pluginAvailable = !!(window?.Capacitor?.Plugins && window.Capacitor.Plugins.LocalNotifications)
    console.debug('LocalNotifications plugin available?', pluginAvailable)

    if (!pluginAvailable && typeof window !== 'undefined' && !('Notification' in window)) {
      throw new Error('LocalNotifications plugin not available and browser Notifications API not supported')
    }

    await requestNotificationPermissions()

    const when = at instanceof Date ? at : new Date(at)
    const now = new Date()

    // Don't schedule if time is in the past
    if (when < now) {
      console.warn('Cannot schedule notification in the past')
      throw new Error('Cannot schedule notification in the past')
    }

    // If plugin available, use it. Otherwise fall back to the browser Notification API (limited).
    if (pluginAvailable) {
      try {
        // Native plugin expects simple JSON values (no Date objects, numeric id)
        const numericId = Number.isInteger(Number(id)) ? Number(id) : Math.floor(Date.now() % 1000000)
        const scheduleAt = new Date(when).toISOString()

        await LocalNotifications.schedule({
          notifications: [
            {
              id: numericId,
              title,
              body,
              sound,
              schedule: { at: scheduleAt },
            },
          ],
        })
        return true
      } catch (err) {
        console.error('LocalNotifications.schedule error', err)
        throw new Error('LocalNotifications schedule failed: ' + (err?.message || err))
      }
    }

    // Browser fallback: show a notification at the scheduled time only while the page is open
    // This is a limited fallback for development/testing when the native plugin isn't available.
    try {
      const permission = Notification.permission
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted')
      }

      const delay = when.getTime() - now.getTime()
      setTimeout(() => {
        try {
          new Notification(title, { body })
        } catch (e) {
          console.error('Browser Notification failed', e)
        }
      }, Math.max(0, delay))

      return true
    } catch (err) {
      console.error('Browser fallback notification error', err)
      throw err
    }
  } catch (error) {
    console.error('Schedule notification failed', error)
    // Re-throw so callers can show the specific error message
    throw error
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId) {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] })
    return true
  } catch (error) {
    console.error('Cancel notification failed', error)
    return false
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications() {
  try {
    await LocalNotifications.cancelAll()
    return true
  } catch (error) {
    console.error('Cancel all notifications failed', error)
    return false
  }
}

/**
 * Get pending notifications
 */
export async function getPendingNotifications() {
  try {
    const result = await LocalNotifications.getPending()
    return result.notifications || []
  } catch (error) {
    console.error('Get pending notifications failed', error)
    return []
  }
}

/**
 * Schedule itinerary reminder
 */
export async function scheduleItineraryReminder(itinerary) {
  if (!itinerary) return false

  const startDate = itinerary.startDate || 
                   itinerary.start_date || 
                   (itinerary.dates && itinerary.dates[0] && itinerary.dates[0].start) ||
                   (itinerary.activities && itinerary.activities[0] && itinerary.activities[0].date)

  if (!startDate) {
    console.warn('No start date found for itinerary')
    return false
  }

  const destination = itinerary.destination || 
                     itinerary.to || 
                     itinerary.name || 
                     itinerary.title || 
                     'your destination'

  const when = new Date(startDate)
  // Schedule for 1 day before
  when.setDate(when.getDate() - 1)
  
  // If the reminder time is in the past, schedule for today
  const now = new Date()
  if (when < now) {
    when.setTime(now.getTime() + 60000) // 1 minute from now
  }

  // Ensure numeric id for the native plugin
  const numericId = Number.isInteger(Number(itinerary.id)) ? Number(itinerary.id) : Math.floor(Date.now() % 1000000)

  return await scheduleLocalNotification({
    id: numericId,
    title: 'Trip Reminder',
    body: `Your trip to ${destination} starts ${when < new Date(startDate) ? 'tomorrow' : 'soon'}!`,
    at: when,
  })
}

// Initialize on import for native platforms (non-blocking)
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  initPushNotifications().catch(() => {})
}
