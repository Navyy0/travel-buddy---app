// Network status indicator component
import React from 'react'
import { IonBadge, IonIcon } from '@ionic/react'
import { wifiOutline, cloudOfflineOutline } from 'ionicons/icons'
import { useNetworkStatus } from '../api/network'

export function NetworkStatus() {
  const { isOnline, connectionType } = useNetworkStatus()

  if (isOnline) {
    return (
      <IonBadge color="success" style={{ marginRight: '8px' }}>
        <IonIcon icon={wifiOutline} style={{ marginRight: '4px' }} />
        Online
      </IonBadge>
    )
  }

  return (
    <IonBadge color="warning" style={{ marginRight: '8px' }}>
      <IonIcon icon={cloudOfflineOutline} style={{ marginRight: '4px' }} />
      Offline
    </IonBadge>
  )
}

export default NetworkStatus

