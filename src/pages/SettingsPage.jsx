// Settings/Profile page
import React from 'react'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonAvatar,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon
} from '@ionic/react'
import { useHistory } from 'react-router-dom'
import { logOutOutline, personOutline } from 'ionicons/icons'
import { useAuthContext } from '../context/AuthContext'
import { NetworkStatus } from '../components/NetworkStatus'

export function SettingsPage() {
  const history = useHistory()
  const { user, logout, loading } = useAuthContext()

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to sign out?')) {
      return
    }

    try {
      await logout()
      history.replace('/login')
    } catch (err) {
      console.error('Logout error', err)
      alert('Failed to sign out: ' + (err.message || err))
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
          <NetworkStatus slot="end" />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="ion-padding">
          {/* User Profile Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Profile</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                {user?.photoURL ? (
                  <IonAvatar>
                    <img src={user.photoURL} alt={user.displayName || 'User'} />
                  </IonAvatar>
                ) : (
                  <IonAvatar>
                    <IonIcon icon={personOutline} size="large" />
                  </IonAvatar>
                )}
                <div>
                  <h2>{user?.displayName || 'User'}</h2>
                  <IonText color="medium">
                    <p>{user?.email || ''}</p>
                  </IonText>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Settings List */}
          <IonList>
            <IonItem>
              <IonLabel>
                <h2>App Version</h2>
                <p>1.0.0</p>
              </IonLabel>
            </IonItem>
          </IonList>

          {/* Logout Button */}
          <IonButton 
            expand="block" 
            color="danger" 
            onClick={handleLogout}
            disabled={loading}
            style={{ marginTop: '24px' }}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Sign Out
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default SettingsPage

