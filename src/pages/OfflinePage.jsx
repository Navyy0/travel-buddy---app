// Offline itineraries page from SQLite
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
import { trashOutline, cloudDownloadOutline } from 'ionicons/icons'
import { getAllOfflineItineraries, deleteOfflineItinerary } from '../storage/sqlite'
import { getItineraryDestination, getTotalActivityCount, formatDate } from '../utils/helpers'

export function OfflinePage() {
  const history = useHistory()
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState(new Set())

  const loadItineraries = async () => {
    setLoading(true)
    try {
      const data = await getAllOfflineItineraries()
      setItineraries(data)
    } catch (err) {
      console.error('Load offline itineraries error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItineraries()
  }, [])

  const handleRefresh = async (event) => {
    await loadItineraries()
    event.detail.complete()
  }

  const handleOpenItinerary = (itinerary) => {
    history.push(`/itinerary/${itinerary.id}`, { itinerary, source: 'offline' })
  }

  const handleDelete = async (itinerary, event) => {
    event.stopPropagation()
    
    if (!window.confirm(`Delete offline itinerary "${getItineraryDestination(itinerary)}"?`)) {
      return
    }

    setDeletingIds(prev => new Set(prev).add(itinerary.id))
    
    try {
      const success = await deleteOfflineItinerary(itinerary.id)
      if (success) {
        setItineraries(prev => prev.filter(i => i.id !== itinerary.id))
      } else {
        alert('Failed to delete offline itinerary')
      }
    } catch (err) {
      console.error('Delete offline error', err)
      alert('Failed to delete offline itinerary: ' + (err.message || err))
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(itinerary.id)
        return newSet
      })
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Offline Itineraries</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading && itineraries.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
          </div>
        ) : itineraries.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <IonIcon icon={cloudDownloadOutline} size="large" style={{ fontSize: '64px', color: '#92949c', marginBottom: '16px' }} />
            <h2>No Offline Itineraries</h2>
            <IonText color="medium">
              <p>Download itineraries from the home screen to access them offline.</p>
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
                    {itinerary.createdAt && `Saved: ${formatDate(itinerary.createdAt)}`}
                    {(() => {
                      const count = getTotalActivityCount(itinerary)
                      return count > 0 ? ` • ${count} ${count === 1 ? 'activity' : 'activities'}` : ''
                    })()}
                  </p>
                </IonLabel>
                <IonBadge color="success" slot="end" style={{ marginRight: '8px' }}>
                  <IonIcon icon={cloudDownloadOutline} style={{ fontSize: '12px' }} />
                  Offline
                </IonBadge>
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
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  )
}

export default OfflinePage

