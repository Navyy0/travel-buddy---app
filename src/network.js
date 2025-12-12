import { Network } from '@capacitor/network'

let _status = { connected: true }
let _listeners = []

async function initNetwork() {
  try {
    const status = await Network.getStatus()
    _status = status
  } catch (e) {
    // assume online if detection fails
    _status = { connected: true }
  }

  // listen to changes
  Network.addListener('networkStatusChange', (status) => {
    _status = status
    _listeners.forEach(cb => {
      try { cb(status) } catch (e) { console.error(e) }
    })
  })
}

function isOnline() {
  return !!(_status && _status.connected)
}

function onNetworkChange(cb) {
  _listeners.push(cb)
  return () => {
    const idx = _listeners.indexOf(cb)
    if (idx >= 0) _listeners.splice(idx, 1)
  }
}

// initialize immediately (safe to call multiple times)
initNetwork().catch(() => {})

export { isOnline, onNetworkChange, initNetwork }
export default { isOnline, onNetworkChange, initNetwork }
