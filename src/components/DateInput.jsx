import { useRef, useState, useEffect } from 'react'

export function DateInput({ label, value, onChange, style, className, placeholder = 'DD/MM/AAAA' }) {
  const dateRef = useRef(null)

  const toDisplay = (v) => {
    if (!v) return ''
    const parts = v.split('-')
    if (parts.length === 3 && parts[0].length === 4) return parts[2] + '/' + parts[1] + '/' + parts[0]
    return ''
  }

  const [display, setDisplay] = useState(toDisplay(value))
  useEffect(() => { setDisplay(toDisplay(value)) }, [value])

  const handleText = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
    let fmt = raw
    if (raw.length > 2) fmt = raw.slice(0,2) + '/' + raw.slice(2)
    if (raw.length > 4) fmt = raw.slice(0,2) + '/' + raw.slice(2,4) + '/' + raw.slice(4)
    setDisplay(fmt)
    if (raw.length === 8) onChange(raw.slice(4,8) + '-' + raw.slice(2,4) + '-' + raw.slice(0,2))
    else if (raw.length === 0) onChange('')
  }

  const openPicker = () => { try { dateRef.current?.showPicker() } catch(e2) { dateRef.current?.click() } }

  const inputStyle = className
    ? { paddingRight: 36 }
    : { width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box', outline:'none', paddingRight:36, ...(style||{}) }

  const inner = (
    <div style={{ position:'relative' }}>
      <input type="text" inputMode="numeric" placeholder={placeholder}
        value={display} onChange={handleText}
        style={inputStyle} className={className||''} />
      <button type="button" onClick={openPicker}
        style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:18, padding:0, lineHeight:1, zIndex:1 }}>📅</button>
      <input ref={dateRef} type="date" value={value||''} onChange={e => onChange(e.target.value)}
        style={{ position:'absolute', opacity:0, width:1, height:1, top:0, left:0, pointerEvents:'none' }} tabIndex={-1} />
    </div>
  )

  if (label) return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</label>
      {inner}
    </div>
  )
  return inner
}
