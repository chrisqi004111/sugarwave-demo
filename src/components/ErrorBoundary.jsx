import { Component } from 'react'

// Catches render/lifecycle errors so a crash shows a readable message on screen
// instead of a blank page (critical for diagnosing mobile Safari, where there is
// no easy console). Screenshot the message to report the exact error.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Surface in console too (desktop / remote-debug).
    console.error('App crashed:', error, info)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const message = String((error && error.message) || error)
    const stack = String((error && error.stack) || '').split('\n').slice(0, 10).join('\n')

    return (
      <div style={{
        minHeight: '100vh', boxSizing: 'border-box', padding: 20,
        background: '#fff', color: '#c00',
        fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
          ⚠ App error — please screenshot this
        </div>
        <div style={{ marginBottom: 14 }}>{message}</div>
        <div style={{ fontSize: 11, color: '#666' }}>{stack}</div>
        <button
          onClick={() => { try { localStorage.clear() } catch { /* ignore */ } location.reload() }}
          style={{ marginTop: 18, padding: '10px 16px', fontSize: 12, border: '1px solid #c00', background: '#fff', color: '#c00' }}
        >
          Clear data &amp; reload
        </button>
      </div>
    )
  }
}
