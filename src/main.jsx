// Main entry point
import React from 'react'
import { createRoot } from 'react-dom/client'
import { IonApp, setupIonicReact } from '@ionic/react'
import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'
import './styles.css'
import App from './App'

// Dev runtime diagnostics: expose plugin info to WebView console
try {
  // Use global Capacitor if available
  const cap = typeof window !== 'undefined' ? window.Capacitor : null
  const pluginInfo = {
    platform: cap && cap.getPlatform ? cap.getPlatform() : 'unknown',
    isNative: cap && cap.isNativePlatform ? cap.isNativePlatform() : false,
    CapacitorSQLite: cap?.Plugins?.CapacitorSQLite || null,
    LocalNotifications: cap?.Plugins?.LocalNotifications || null,
  }

  // Attach for easy inspection and log once
  if (typeof window !== 'undefined') {
    window.__appDebugPlugins__ = pluginInfo
    console.info('[debug] app plugin info:', pluginInfo)
  }
} catch (e) {
  console.warn('Could not read Capacitor plugin info', e)
}

// Initialize Ionic
setupIonicReact()

// Render app
const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
