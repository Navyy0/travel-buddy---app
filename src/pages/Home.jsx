import React, { useEffect, useState } from 'react'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonSpinner, IonButton } from '@ionic/react'
import apiClient from '../api/client'
import { useHistory } from 'react-router-dom'

const Home = () => {
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const history = useHistory()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const data = await apiClient.get('/itineraries')
        if (!mounted) return
        setItineraries(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function openItinerary(item) {
    // Pass the itinerary in state to detail page for fast navigation
    history.push(`/itinerary/${item.id}`, { itinerary: item, source: 'remote' })
  }

  async function deleteItinerary(id) {
    if (!confirm('Delete this itinerary from backend?')) return
    try {
      await apiClient.delete(`/itineraries/${id}`)
      // reload list
      setItineraries(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error(err)
      alert('Failed to delete itinerary: ' + (err.message || err.body || err))
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: 16 }}>
          <h2>Saved Itineraries</h2>
          {loading && <IonSpinner />}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && !error && (
            <IonList>
              {itineraries.map(it => {
                let title = it.name || (it.meta && it.meta.title) || it.id
                // if json stored as string, try parse
                if (!title && typeof it.json === 'string') {
                  try { const parsed = JSON.parse(it.json); title = parsed.name || parsed.title || it.id } catch (e) {}
                }
                return (
                  <IonItem key={it.id}>
                    <IonLabel onClick={() => openItinerary(it)} style={{ cursor: 'pointer' }}>
                      <h3>{title}</h3>
                      <p>{it.createdAt || ''}</p>
                    </IonLabel>
                    <IonButton color="danger" slot="end" onClick={() => deleteItinerary(it.id)}>Delete</IonButton>
                  </IonItem>
                )
              })}
            </IonList>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Home
