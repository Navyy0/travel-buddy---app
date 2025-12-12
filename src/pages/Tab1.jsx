import React from 'react'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react'

const Tab1 = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Trips</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent fullscreen>
      <div style={{ padding: 16 }}>
        <h2>Welcome to Travel Buddy</h2>
        <p>This is the Trips tab. We'll add features later.</p>
      </div>
    </IonContent>
  </IonPage>
)

export default Tab1
