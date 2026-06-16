import { useState, useEffect } from 'react'

export default function LoadingPage({ image, onDone }) {
  const [step, setStep] = useState(0)
  const steps = [
    'Detecting objects and surfaces',
    'Removing distractions',
    'Preserving spatial structure',
  ]

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 900)
    const t2 = setTimeout(() => setStep(2), 1800)
    const t3 = setTimeout(() => onDone(image), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#fff',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column',
    }}>
      <div style={{
        fontStyle: 'italic', fontSize: 20,
        letterSpacing: 2, marginBottom: 60, color: '#000',
      }}>
        sugarwave
      </div>
      <div style={{
        background: '#f6faf6', border: '1px solid #d4e8d4',
        borderRadius: 4, padding: '40px 60px', textAlign: 'center', minWidth: 360,
      }}>
        <p style={{ fontSize: 18, fontWeight: 400, marginBottom: 24 }}>
          Analyzing Your Space...
        </p>
        {steps.map((s, i) => (
          <p key={s} style={{
            fontSize: 13, marginBottom: 10,
            color: i <= step ? '#2d7a2d' : '#ccc',
            transition: 'color 0.5s', letterSpacing: 0.5,
          }}>
            {i <= step ? '✓' : '○'} {s}
          </p>
        ))}
      </div>
    </div>
  )
}