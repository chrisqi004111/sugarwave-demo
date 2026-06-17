import { Page, Container, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'
import { loadLastOrder } from '../cart'

export default function OrderSuccessPage() {
  const { navigate } = useNav()
  const order = loadLastOrder()

  // Export Spec Sheet: build a plain-text summary of the saved order and
  // trigger a client-side download. No backend involved (DEMO-safe).
  function exportSpecSheet() {
    track('purchase', { step: 'export_spec_sheet' })
    const lines = []
    lines.push('SUGARWAVE — ORDER SPEC SHEET')
    lines.push('================================')
    lines.push(`Date: ${order ? new Date(order.ts).toLocaleString() : new Date().toLocaleString()}`)
    lines.push('')
    if (order?.contact) {
      lines.push('SHIP TO')
      lines.push(`  ${order.contact.name}`)
      lines.push(`  ${order.contact.email} · ${order.contact.phone}`)
      lines.push(`  ${order.contact.address}, ${order.contact.city} ${order.contact.postal}`)
      lines.push(`  ${order.contact.country}`)
      if (order.contact.notes) lines.push(`  Notes: ${order.contact.notes}`)
      lines.push('')
    }
    lines.push('ITEMS')
    ;(order?.items || []).forEach(it => {
      lines.push(`  ${it.name} × ${it.qty}  —  €${it.price * it.qty}`)
      if (it.material) lines.push(`     Material: ${it.material}`)
      if (it.size) lines.push(`     Size: ${it.size}`)
    })
    lines.push('')
    lines.push(`Subtotal: €${order?.subtotal ?? 0}`)
    lines.push(`Shipping${order?.shipping ? ` (${order.shipping.label})` : ''}: €${order?.delivery ?? 0}`)
    lines.push(`Estimated Total: €${order?.total ?? 0}`)
    lines.push('')
    lines.push('Custom color, size, and texture options will be available in a future version.')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sugarwave-spec-sheet.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Page>
      <Container style={{ paddingTop: 96, textAlign: 'center', maxWidth: 560 }}>
        <p style={kicker}>Order confirmed</p>
        <h1 style={{ fontSize: 40, fontWeight: 400, margin: '12px 0 24px' }}>Order submitted.</h1>
        <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.9, marginBottom: 8 }}>
          Your AI scene preview and selected products have been saved.
        </p>
        <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.9, marginBottom: 40 }}>
          A sugarwave specialist will follow up with delivery and production details.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('scene-lab')} style={primaryBtn}>BACK TO SCENE LAB</button>
          <button onClick={() => navigate('shop')} style={ghostBtn}>CONTINUE SHOPPING</button>
          <button onClick={exportSpecSheet} style={ghostBtn}>EXPORT SPEC SHEET</button>
        </div>
      </Container>
    </Page>
  )
}

const baseBtn = {
  padding: '13px 26px', fontSize: 12, letterSpacing: 2, cursor: 'pointer',
  border: `1px solid ${C.black}`,
}
const primaryBtn = { ...baseBtn, background: C.black, color: C.bg }
const ghostBtn = { ...baseBtn, background: C.bg, color: C.black }
