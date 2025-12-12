// Itinerary detail page with JSON view, map view, and offline download
import React, { useState, useEffect } from 'react'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem
} from '@ionic/react'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { downloadOutline, notificationsOutline, documentTextOutline } from 'ionicons/icons'
import { useItineraries } from '../hooks/useItineraries'
import { useNetworkStatus } from '../api/network'
import { scheduleItineraryReminder } from '../api/notifications'
import { 
  getItineraryDestination, 
  getItineraryStartDate, 
  getItineraryActivities,
  getTotalActivityCount,
  getItineraryDuration,
  formatDate 
} from '../utils/helpers'

export function ItineraryDetailPage() {
  const { id } = useParams()
  const history = useHistory()
  const location = useLocation()
  const [itinerary, setItinerary] = useState(location.state?.itinerary || null)
  const [source, setSource] = useState(location.state?.source || 'remote')
  const [loading, setLoading] = useState(!itinerary)
  const [message, setMessage] = useState(null)
  const [viewMode, setViewMode] = useState('json')
  const [isOffline, setIsOffline] = useState(false)
  const { getItinerary, downloadOffline, checkIsOffline } = useItineraries()
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    const loadItinerary = async () => {
      if (itinerary) {
        const offline = await checkIsOffline(itinerary.id)
        setIsOffline(offline)
        return
      }

      setLoading(true)
      try {
        const data = await getItinerary(id)
        if (data) {
          setItinerary(data)
          setSource(data._isOffline ? 'offline' : 'remote')
          const offline = await checkIsOffline(data.id)
          setIsOffline(offline)
        } else {
          setMessage('Itinerary not found')
        }
      } catch (err) {
        console.error('Load itinerary error', err)
        setMessage('Failed to load itinerary: ' + (err.message || err))
      } finally {
        setLoading(false)
      }
    }

    loadItinerary()
  }, [id, itinerary, getItinerary, checkIsOffline])

  const handleDownloadOffline = async () => {
    if (!itinerary) return

    try {
      await downloadOffline(itinerary)
      setIsOffline(true)
      setMessage('Downloaded for offline access')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Download offline error', err)
      setMessage('Failed to download offline: ' + (err.message || err))
    }
  }

  const handleSetReminder = async () => {
    if (!itinerary) {
      setMessage('No itinerary to set reminder for')
      return
    }

    const startDate = getItineraryStartDate(itinerary)
    if (!startDate) {
      setMessage('No start date found on itinerary')
      return
    }

    try {
      const success = await scheduleItineraryReminder(itinerary)
      if (success) {
        const when = new Date(startDate)
        when.setDate(when.getDate() - 1)
        setMessage(`Reminder scheduled for ${formatDate(when)}`)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage('Failed to schedule reminder')
      }
    } catch (err) {
      console.error('Schedule reminder error', err)
      setMessage('Failed to schedule reminder: ' + (err.message || err))
    }
  }

  const activities = getItineraryActivities(itinerary)
  const destination = getItineraryDestination(itinerary)
  const startDate = getItineraryStartDate(itinerary)
  const totalActivities = getTotalActivityCount(itinerary)
  const duration = getItineraryDuration(itinerary)

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton />
            </IonButtons>
            <IonTitle>Loading...</IonTitle>
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

  if (!itinerary) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton />
            </IonButtons>
            <IonTitle>Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <IonText color="danger">{message || 'Itinerary not found'}</IonText>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>{destination}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="ion-padding">
          {/* Header info */}
          <IonCard className="app-card">
            <IonCardHeader>
              <IonCardTitle>{destination}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {startDate && (
                <p>
                  <strong>Start Date:</strong> {formatDate(startDate)}
                </p>
              )}
              {itinerary.end_date && (
                <p>
                  <strong>End Date:</strong> {formatDate(itinerary.end_date)}
                </p>
              )}
              {duration > 0 && (
                <p>
                  <strong>Duration:</strong> {duration} {duration === 1 ? 'day' : 'days'}
                </p>
              )}
              {totalActivities > 0 && (
                <p>
                  <strong>Total Activities:</strong> {totalActivities}
                </p>
              )}
              {itinerary.travel_style && (
                <p>
                  <strong>Travel Style:</strong> {itinerary.travel_style}
                </p>
              )}
              {itinerary.total_budget && (
                <p>
                  <strong>Total Budget:</strong> ${itinerary.total_budget.toFixed(2)}
                </p>
              )}
              {source === 'offline' && (
                <IonBadge color="success">Available Offline</IonBadge>
              )}
              {isOffline && source !== 'offline' && (
                <IonBadge color="success" style={{ marginLeft: '8px' }}>
                  <IonIcon icon={downloadOutline} style={{ fontSize: '12px' }} />
                  Downloaded
                </IonBadge>
              )}
            </IonCardContent>
          </IonCard>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }} className="action-row">
            {!isOffline && (
              <IonButton expand="block" className="big-button" onClick={handleDownloadOffline}>
                <IonIcon icon={downloadOutline} slot="start" />
                Download Offline
              </IonButton>
            )}
            <IonButton expand="block" fill="outline" onClick={handleSetReminder}>
              <IonIcon icon={notificationsOutline} slot="start" />
              Set Reminder
            </IonButton>
          </div>

          {/* Message */}
          {message && (
            <IonText color={message.includes('Failed') ? 'danger' : 'success'} style={{ display: 'block', marginBottom: '16px' }}>
              {message}
            </IonText>
          )}

          {/* Structured Day Plans */}
          {itinerary.day_plans && itinerary.day_plans.length > 0 ? (
            itinerary.day_plans.map((dayPlan, idx) => (
              <IonCard key={dayPlan.day || idx} className="app-card" style={{ marginTop: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle>Day {dayPlan.day || idx + 1} {dayPlan.title ? `— ${dayPlan.title}` : ''}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {dayPlan.date && <p className="muted">{dayPlan.date}</p>}
                  {dayPlan.theme && <p className="muted">{dayPlan.theme}</p>}
                  {dayPlan.notes && <p><em>{dayPlan.notes}</em></p>}
                  {dayPlan.estimated_budget != null && (
                    <p><strong>Estimated Budget:</strong> ${Number(dayPlan.estimated_budget).toFixed(2)}</p>
                  )}

                  {dayPlan.activities && dayPlan.activities.length > 0 ? (
                    <IonList>
                      {dayPlan.activities.map((activity, aidx) => (
                        <IonItem key={activity.id || aidx} lines="none">
                          <IonLabel>
                            <h3 style={{ margin: 0 }}>
                              {activity.time && <span style={{ color: '#666', marginRight: '8px' }}>{activity.time}</span>}
                              {activity.title || activity.name || `Activity ${aidx + 1}`}
                            </h3>
                            {activity.description && <p style={{ margin: '6px 0' }}>{activity.description}</p>}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {activity.location && <span className="muted">📍 {activity.location}</span>}
                              {activity.activity_type && <span className="muted">🏷️ {activity.activity_type}</span>}
                              {activity.duration_minutes != null && <span className="muted">⏱ {activity.duration_minutes} min</span>}
                              {activity.cost != null && activity.cost > 0 && <span className="muted">💰 ${Number(activity.cost).toFixed(2)}</span>}
                            </div>
                            {activity.notes && <p style={{ marginTop: '6px' }}><em>{activity.notes}</em></p>}
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  ) : (
                    <p className="muted">No activities for this day.</p>
                  )}
                </IonCardContent>
              </IonCard>
            ))
          ) : (
            // Fallback to flat activities list when no day_plans exist
            activities.length > 0 && (
              <IonCard style={{ marginTop: '16px' }} className="app-card">
                <IonCardHeader>
                  <IonCardTitle>Activities</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {activities.map((activity, idx) => (
                      <IonItem key={activity.id || idx} lines="none">
                        <IonLabel>
                          <h3 style={{ margin: 0 }}>
                            {activity.time && <span style={{ color: '#666', marginRight: '8px' }}>{activity.time}</span>}
                            {activity.title || activity.name || `Activity ${idx + 1}`}
                          </h3>
                          {activity.description && <p style={{ margin: '6px 0' }}>{activity.description}</p>}
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {activity.location && <span className="muted">📍 {activity.location}</span>}
                            {activity.activity_type && <span className="muted">🏷️ {activity.activity_type}</span>}
                            {activity.duration_minutes != null && <span className="muted">⏱ {activity.duration_minutes} min</span>}
                            {activity.cost != null && activity.cost > 0 && <span className="muted">💰 ${Number(activity.cost).toFixed(2)}</span>}
                          </div>
                          {activity.notes && <p style={{ marginTop: '6px' }}><em>{activity.notes}</em></p>}
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            )
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default ItineraryDetailPage

