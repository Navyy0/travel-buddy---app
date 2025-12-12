import React from 'react'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react'
import { useHistory } from 'react-router-dom'
import { clearTokens } from '../authStorage'

const Tab3 = () => {
  const history = useHistory()

  const goLogin = () => history.push('/login')
  const onSignOut = async () => {
    await clearTokens()
    history.replace('/tab1')
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: 16 }}>
          <h2>Profile</h2>
          <p>Account and settings will be here.</p>
          <IonButton onClick={goLogin}>Sign in</IonButton>
          <IonButton onClick={onSignOut} style={{ marginLeft: 8 }}>Sign out</IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Tab3
