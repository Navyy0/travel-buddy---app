// Protected route component
import React from 'react'
import { Redirect } from 'react-router-dom'
import { IonSpinner } from '@ionic/react'
import { useAuthContext } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthContext()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <IonSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />
  }

  return <>{children}</>
}

