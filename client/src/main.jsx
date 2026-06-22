import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const root = createRoot(document.getElementById('root'))

if (!PUBLISHABLE_KEY) {
  console.warn("⚠️ Warning: VITE_CLERK_PUBLISHABLE_KEY is not set. Rendering configuration warning page.")
  root.render(
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '440px',
        padding: '32px',
        backgroundColor: '#1f2937',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        border: '1px solid #374151'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Configuration Required</h1>
        <p style={{ color: '#9ca3af', marginBottom: '24px', lineHeight: '1.5' }}>
          The environment variable <code style={{
            backgroundColor: '#030712',
            padding: '2px 6px',
            borderRadius: '4px',
            color: '#f87171',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>VITE_CLERK_PUBLISHABLE_KEY</code> is missing.
          <br /><br />
          Please configure it in your Vercel Project Settings to launch the application.
        </p>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Buddhimaan - AI-Powered Creative Suite</div>
      </div>
    </div>
  )
} else {
  root.render(
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl='/'>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  )
}
