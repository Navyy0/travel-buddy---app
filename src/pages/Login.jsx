import React, { useState } from 'react'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText } from '@ionic/react'
import { signInWithGoogleAndExchange } from '../firebaseAuth'
import { useHistory } from 'react-router-dom'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const history = useHistory()

  const onLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogleAndExchange()
      // navigate back to profile or home
      history.replace('/tab3')
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: 16 }}>
          <h2>Sign in</h2>
          <IonButton onClick={onLogin} disabled={loading}>{loading ? 'Signing in...' : 'Sign in with Google'}</IonButton>
          {error && <IonText color="danger">{error}</IonText>}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Login
