import React, { useEffect, useState } from 'react'
import { useLocation, useParams, useHistory } from 'react-router-dom'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react'
import apiClient from '../api/client'
import { saveItinerary } from '../database/db'
import { scheduleNotification } from '../notifications'

const ItineraryDetail = () => {
  const { id } = useParams()
  const location = useLocation()
  const [itinerary, setItinerary] = useState(location.state?.itinerary || null)
  const [source, setSource] = useState(location.state?.source || 'remote')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const history = useHistory()

  useEffect(() => {
    let mounted = true
    async function load() {
      if (itinerary) return
      setLoading(true)
      try {
        const data = await apiClient.get(`/itineraries/${id}`)
        if (!mounted) return
        setItinerary(data)
        setSource('remote')
      } catch (err) {
        // try loading from offline DB
        try {
          const offline = await (await import('../database/db')).getOfflineItinerary(id)
          if (offline) {
            const parsed = typeof offline.json === 'string' ? JSON.parse(offline.json) : offline.json
            setItinerary(parsed)
            setSource('offline')
          }
        } catch (e) {
          console.error(e)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  const onDownloadOffline = async () => {
    if (!itinerary) return
    try {
      const res = await saveItinerary(itinerary)
      setMessage('Saved offline: ' + res.id)
    } catch (e) {
      setMessage('Failed to save offline')
    }
  }

  const onSetReminder = async () => {
    if (!itinerary) return setMessage('No itinerary to set reminder for')
    // try to find a start date on itinerary
    const start = itinerary.startDate || itinerary.start_date || (itinerary.dates && itinerary.dates[0] && itinerary.dates[0].start)
    if (!start) return setMessage('No start date found on itinerary')

    try {
      const when = new Date(start)
      const destination = itinerary.destination || itinerary.to || itinerary.name || ''
      const title = 'Trip Reminder'
      const body = `Your trip to ${destination} starts today!`
      await scheduleNotification({ title, body, at: when })
      setMessage('Reminder scheduled for ' + when.toLocaleString())
    } catch (e) {
      console.error(e)
      setMessage('Failed to schedule reminder')
    }
  }

  const onSaveRemote = async () => {
    if (!itinerary) return setMessage('No itinerary to save')
    try {
      // POST to backend to save itinerary
      const resp = await apiClient.post('/itineraries', itinerary)
      setMessage('Saved to backend')
      // if backend returned an id, update state
      if (resp && resp.id) setItinerary(prev => ({ ...prev, id: resp.id }))
    } catch (e) {
      console.error(e)
      setMessage('Failed to save to backend')
    }
  }

  const onDeleteRemote = async () => {
    if (!itinerary || !itinerary.id) return setMessage('No remote id to delete')
    if (!confirm('Delete itinerary from backend?')) return
    try {
      await apiClient.delete(`/itineraries/${itinerary.id}`)
      setMessage('Deleted from backend')
      // navigate back to home
      history.replace('/tab1')
    } catch (e) {
      console.error(e)
      setMessage('Failed to delete from backend')
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Itinerary</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: 16 }}>
          {loading && <p>Loading...</p>}
          {!loading && itinerary && (
            <div>
              <h2>{itinerary.name || itinerary.title || id}</h2>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(itinerary, null, 2)}</pre>

              <div style={{ marginTop: 12 }}>
                <IonButton onClick={onDownloadOffline}>Download Offline</IonButton>
                <IonButton onClick={onSetReminder} style={{ marginLeft: 8 }}>Set Reminder</IonButton>
                <IonButton onClick={onSaveRemote} style={{ marginLeft: 8 }}>Save Remote</IonButton>
                {source === 'remote' && (
                  <IonButton color="danger" onClick={onDeleteRemote} style={{ marginLeft: 8 }}>Delete Remote</IonButton>
                )}
              </div>

              {message && <p>{message}</p>}
            </div>
          )}
          {!loading && !itinerary && <p>Itinerary not found.</p>}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default ItineraryDetail
