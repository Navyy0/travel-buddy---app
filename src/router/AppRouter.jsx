// Main app router
import React, { useEffect } from 'react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { IonPage, IonContent, IonTabs, IonTabBar, IonTabButton, IonLabel, IonIcon, IonRouterOutlet, IonSpinner } from '@ionic/react'
import { home, cloudDownload, person } from 'ionicons/icons'

// Pages
import { LoginPage } from '../pages/LoginPage'
import { HomePage } from '../pages/HomePage'
import { ItineraryDetailPage } from '../pages/ItineraryDetailPage'
import { OfflinePage } from '../pages/OfflinePage'
import { SettingsPage } from '../pages/SettingsPage'

// Components
import { ProtectedRoute } from '../components/ProtectedRoute'

// Context
import { AuthProvider, useAuthContext } from '../context/AuthContext'

// Services
import { initNetwork } from '../api/network'
import { requestNotificationPermissions, initPushNotifications } from '../api/notifications'

// Initialize app services
function useAppInit() {
  useEffect(() => {
    initNetwork().catch(console.error)
    requestNotificationPermissions().catch(console.error)
    initPushNotifications().catch(console.error)
  }, [])
}

// Routes that should show tabs
const TAB_ROUTES = ['/home', '/offline', '/settings']

// Inner router component
function InnerRouter() {
  const { isAuthenticated, loading } = useAuthContext()
  const location = useLocation()
  const showTabs = TAB_ROUTES.includes(location.pathname)
  
  useAppInit()

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <IonSpinner />
            <p style={{ marginTop: '16px', color: '#666' }}>Loading...</p>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route exact path="/login" component={LoginPage} />
        <Route path="*">
          <Redirect to="/login" />
        </Route>
      </Switch>
    )
  }

  // Show tabs and protected routes if authenticated
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Switch>
          <Route exact path="/home">
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          </Route>
          <Route exact path="/offline">
            <ProtectedRoute>
              <OfflinePage />
            </ProtectedRoute>
          </Route>
          <Route exact path="/settings">
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          </Route>
          <Route exact path="/itinerary/:id">
            <ProtectedRoute>
              <ItineraryDetailPage />
            </ProtectedRoute>
          </Route>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
          <Route path="*">
            <Redirect to="/home" />
          </Route>
        </Switch>
      </IonRouterOutlet>
      <IonTabBar slot="bottom" style={{ display: showTabs ? 'flex' : 'none' }}>
        <IonTabButton tab="home" href="/home">
          <IonIcon icon={home} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="offline" href="/offline">
          <IonIcon icon={cloudDownload} />
          <IonLabel>Offline</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/settings">
          <IonIcon icon={person} />
          <IonLabel>Settings</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  )
}

// Main router with auth provider
export function AppRouter() {
  return (
    <IonReactRouter>
      <AuthProvider>
        <IonRouterOutlet>
          <InnerRouter />
        </IonRouterOutlet>
      </AuthProvider>
    </IonReactRouter>
  )
}

export default AppRouter
