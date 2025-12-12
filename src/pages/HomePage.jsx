// Home page with online itinerary list
import React, { useState, useEffect } from 'react'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonText
} from '@ionic/react'
import { useHistory } from 'react-router-dom'
import { trashOutline, downloadOutline, mapOutline } from 'ionicons/icons'
import { useItineraries } from '../hooks/useItineraries'
import { useNetworkStatus } from '../api/network'
import { NetworkStatus } from '../components/NetworkStatus'
import { getItineraryDestination, getTotalActivityCount, formatDate } from '../utils/helpers'

export function HomePage() {
  const history = useHistory()
  const { itineraries, loading, error, loadItineraries, deleteItinerary, checkIsOffline } = useItineraries()
  const { isOnline } = useNetworkStatus()
  const [deletingIds, setDeletingIds] = useState(new Set())
  const [offlineStatus, setOfflineStatus] = useState({})

  useEffect(() => {
    // Check offline status for each itinerary
    const checkOfflineStatus = async () => {
      const status = {}
      for (const itinerary of itineraries) {
        if (itinerary.id) {
          status[itinerary.id] = await checkIsOffline(itinerary.id)
        }
      }
      setOfflineStatus(status)
    }
    if (itineraries.length > 0) {
      checkOfflineStatus()
    }
  }, [itineraries, checkIsOffline])

  const handleRefresh = async (event) => {
    await loadItineraries()
    event.detail.complete()
  }

  const handleOpenItinerary = (itinerary) => {
    history.push(`/itinerary/${itinerary.id}`, { itinerary, source: 'remote' })
  }

  const handleDelete = async (itinerary, event) => {
    event.stopPropagation()
    
    if (!window.confirm(`Delete itinerary "${getItineraryDestination(itinerary)}"?`)) {
      return
    }

    setDeletingIds(prev => new Set(prev).add(itinerary.id))
    
    try {
      await deleteItinerary(itinerary.id)
    } catch (err) {
      console.error('Delete error', err)
      alert('Failed to delete itinerary: ' + (err.message || err))
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(itinerary.id)
        return newSet
      })
    }
  }

  if (loading && itineraries.length === 0) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>My Itineraries</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle slot="start">My Itineraries</IonTitle>
          <NetworkStatus slot="end" />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {error && (
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <IonText color="danger">{error}</IonText>
          </div>
        )}

        {!isOnline && (
          <div style={{ padding: '16px', background: '#fff3cd', textAlign: 'center' }}>
            <IonText color="warning">
              You are offline. Showing cached itineraries.
            </IonText>
          </div>
        )}

        {itineraries.length === 0 && !loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <IonText color="medium">
              <p>No itineraries yet.</p>
              <p>Create your first travel itinerary to get started!</p>
            </IonText>
          </div>
        ) : (
          <IonList>
            {itineraries.map((itinerary) => (
              <IonItem 
                key={itinerary.id} 
                button 
                onClick={() => handleOpenItinerary(itinerary)}
                detail={true}
              >
                <IonLabel>
                  <h2>{getItineraryDestination(itinerary)}</h2>
                  <p>
                    {itinerary.start_date && formatDate(itinerary.start_date)}
                    {itinerary.startDate && !itinerary.start_date && formatDate(itinerary.startDate)}
                    {(() => {
                      const count = getTotalActivityCount(itinerary)
                      return count > 0 ? ` • ${count} ${count === 1 ? 'activity' : 'activities'}` : ''
                    })()}
                  </p>
                </IonLabel>
                <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {offlineStatus[itinerary.id] && (
                    <IonBadge color="success">
                      <IonIcon icon={downloadOutline} style={{ fontSize: '12px' }} />
                    </IonBadge>
                  )}
                  <IonButton
                    fill="clear"
                    color="danger"
                    size="small"
                    onClick={(e) => handleDelete(itinerary, e)}
                    disabled={deletingIds.has(itinerary.id)}
                  >
                    {deletingIds.has(itinerary.id) ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      <IonIcon icon={trashOutline} />
                    )}
                  </IonButton>
                </div>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  )
}

export default HomePage

