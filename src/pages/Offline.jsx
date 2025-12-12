import React, { useEffect, useState } from 'react'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonSpinner, IonButton } from '@ionic/react'
import { getAllOfflineItineraries } from '../database/db'
import { useHistory } from 'react-router-dom'

const Offline = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const history = useHistory()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const data = await getAllOfflineItineraries()
        if (!mounted) return
        setItems(data)
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function openItinerary(row) {
    let parsed = null
    try { parsed = typeof row.json === 'string' ? JSON.parse(row.json) : row.json } catch (e) { parsed = null }
    history.push(`/itinerary/${row.id}`, { itinerary: parsed || row, source: 'offline' })
  }

  async function deleteOffline(row) {
    if (!confirm('Delete this offline itinerary?')) return
    try {
      const ok = await (await import('../database/db')).deleteOfflineItinerary(row.id)
      if (ok) setItems(prev => prev.filter(i => i.id !== row.id))
    } catch (e) {
      console.error(e)
      alert('Failed to delete offline itinerary')
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Offline</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: 16 }}>
          <h2>Offline Itineraries</h2>
          {loading && <IonSpinner />}
          {!loading && (
            <IonList>
              {items.map(i => (
                <IonItem key={i.id}>
                  <IonLabel onClick={() => openItinerary(i)} style={{ cursor: 'pointer' }}>
                    <h3>{i.id}</h3>
                    <p>{i.createdAt}</p>
                  </IonLabel>
                  <IonButton color="danger" slot="end" onClick={() => deleteOffline(i)}>Delete</IonButton>
                </IonItem>
              ))}
            </IonList>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Offline
