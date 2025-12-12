import { LocalNotifications } from '@capacitor/local-notifications'

async function requestPermission() {
  try {
    const perm = await LocalNotifications.requestPermissions()
    return perm.display === 'granted' || perm.display === 'granted'
  } catch (e) {
    console.error('LocalNotifications permission error', e)
    return false
  }
}

async function scheduleNotification({ id, title, body, at }) {
  try {
    await requestPermission()
    // ensure `at` is a Date
    const when = at instanceof Date ? at : new Date(at)
    await LocalNotifications.schedule({
      notifications: [
        {
          id: id || Math.floor(Math.random() * 100000),
          title,
          body,
          schedule: { at: when }
        }
      ]
    })
    return true
  } catch (e) {
    console.error('Failed to schedule notification', e)
    throw e
  }
}

export { requestPermission, scheduleNotification }
export default { requestPermission, scheduleNotification }
