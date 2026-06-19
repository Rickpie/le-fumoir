import { useEffect, useRef, useState } from 'react'

function SelectMultiple({ label, options, selectionnes, onToggle, afficherPrix = true }) {
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>{label}</label>
      <button type="button" onClick={() => setOuvert(!ouvert)}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none text-left flex items-center justify-between gap-2"
        style={inputStyle}>
        <span className="flex flex-wrap gap-1 flex-1">
          {selectionnes.length === 0
            ? <span style={{ color: '#FFFFFF' }}>Aucun sélectionné</span>
            : options.filter(o => selectionnes.includes(o.id)).map(o => (
                <span key={o.id} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#F0B429', color: '#1E1912' }}>
                  {o.nom || o.titre}
                </span>
              ))
          }
        </span>
        <span style={{ color: '#FFFFFF', flexShrink: 0 }}>{ouvert ? '▲' : '▼'}</span>
      </button>

      {ouvert && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border shadow-lg"
          style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          {options.length === 0 ? (
            <p className="text-xs p-3" style={{ color: '#FFFFFF' }}>Aucune option disponible.</p>
          ) : options.map(opt => (
            <label key={opt.id}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-white/5"
              style={{ color: '#EDD98A' }}>
              <input type="checkbox" checked={selectionnes.includes(opt.id)} onChange={() => onToggle(opt.id)} />
              {opt.nom || opt.titre}
              {afficherPrix && (opt.prix_supplement != null || opt.prix != null) && (
                <span style={{ color: '#F0B429' }}>
                  (+{opt.prix_supplement ?? opt.prix}€)
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default SelectMultiple
