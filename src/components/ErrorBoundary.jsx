// Error boundary component to catch React errors
import React from 'react'
import { IonPage, IonContent, IonButton, IonText } from '@ionic/react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <IonPage>
          <IonContent className="ion-padding">
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100vh',
              textAlign: 'center'
            }}>
              <h2>Something went wrong</h2>
              <IonText color="danger">
                <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
              </IonText>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px' }}>
                  <summary>Error Details</summary>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '10px', 
                    overflow: 'auto',
                    fontSize: '12px'
                  }}>
                    {this.state.error?.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              <IonButton 
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null })
                  window.location.href = '/login'
                }}
                style={{ marginTop: '20px' }}
              >
                Go to Login
              </IonButton>
            </div>
          </IonContent>
        </IonPage>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

