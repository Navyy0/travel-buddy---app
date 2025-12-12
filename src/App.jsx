// Main App component
import React from 'react'
import { IonApp } from '@ionic/react'
import { AppRouter } from './router/AppRouter'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <IonApp>
        <AppRouter />
      </IonApp>
    </ErrorBoundary>
  )
}

export default App
