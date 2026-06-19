import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const inputStyle = { background: '#1E1912', borderColor: '#4A3820', color: '#EDD98A' }

function AdminPromos() {
  const [promos, setPromos] = useState([])
  const [chargement, setChargement] = useState(true)
  const [creation, setCreation] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'percent', valeur: '', description: '', max_utilisations: '' })
  const [erreur, setErreur] = useState('')

  useEffect(() => { charger() }, [])

  async function charger() {
    setChargement(true)
    const { data, error } = await supabase.functions.invoke('gerer-promos', { body: { action: 'lister' } })
    if (!error && data?.promos) setPromos(data.promos)
    setChargement(false)
  }

  async function creer(e) {
    e.preventDefault()
    if (!form.code.trim() || !form.valeur) { setErreur('Code et valeur requis.'); return }
    if (form.type === 'percent' && (Number(form.valeur) <= 0 || Number(form.valeur) > 100)) {
      setErreur('Pourcentage entre 1 et 100.'); return
    }
    setCreation(true); setErreur('')
    const { data, error } = await supabase.functions.invoke('gerer-promos', {
      body: {
        action: 'creer',
        code: form.code.toUpperCase().trim(),
        type: form.type,
        valeur: Number(form.valeur),
        description: form.description,
        max_utilisations: form.max_utilisations ? Number(form.max_utilisations) : null,
      }
    })
    if (error || data?.error) {
      setErreur(data?.error || 'Erreur lors de la création.')
    } else {
      setForm({ code: '', type: 'percent', valeur: '', description: '', max_utilisations: '' })
      await charger()
    }
    setCreation(false)
  }

  async function desactiver(promoId) {
    if (!confirm('Désactiver ce code promo ?')) return
    await supabase.functions.invoke('gerer-promos', { body: { action: 'desactiver', promoId } })
    await charger()
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-6" style={{ color: '#EDD98A' }}>Codes promo</h2>

      {/* Formulaire création */}
      <div className="rounded-xl border p-5 mb-8" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#F0B429' }}>Créer un code promo</h3>
        {erreur && <p className="text-xs mb-3 p-2 rounded" style={{ background: 'rgba(176,58,46,0.15)', color: '#E74C3C' }}>{erreur}</p>}
        <form onSubmit={creer} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Code *</label>
            <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="EX: BIENVENUE10" required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none font-mono" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Description (interne)</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Ex: Code bienvenue nouveaux clients"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Type de réduction *</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
              <option value="percent">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>
              Valeur * {form.type === 'percent' ? '(%)' : '(€)'}
            </label>
            <input type="number" min="1" max={form.type === 'percent' ? 100 : undefined} step="0.01"
              value={form.valeur} onChange={e => setForm(p => ({ ...p, valeur: e.target.value }))} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Nb max d'utilisations (vide = illimité)</label>
            <input type="number" min="1" value={form.max_utilisations}
              onChange={e => setForm(p => ({ ...p, max_utilisations: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={creation}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
              style={{ background: '#F0B429', color: '#1E1912', opacity: creation ? 0.6 : 1 }}>
              {creation ? 'Création...' : 'Créer le code'}
            </button>
          </div>
        </form>
      </div>

      {/* Liste codes existants */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#F0B429' }}>Codes actifs</h3>
        {chargement ? (
          <p className="text-sm" style={{ color: '#FFFFFF' }}>Chargement...</p>
        ) : promos.length === 0 ? (
          <p className="text-sm" style={{ color: '#7A6A50' }}>Aucun code promo actif pour le moment.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#4A3820' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1a1610', borderBottom: '1px solid #4A3820' }}>
                  {['Code', 'Réduction', 'Utilisations', 'Statut', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: '#7A6A50' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {promos.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < promos.length - 1 ? '1px solid #4A3820' : 'none', background: i % 2 ? '#1E1912' : 'transparent' }}>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: '#F0B429' }}>{p.code}</td>
                    <td className="px-4 py-3" style={{ color: '#EDD98A' }}>
                      {p.coupon?.percent_off ? `${p.coupon.percent_off}%` : p.coupon?.amount_off ? `${(p.coupon.amount_off / 100).toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#FFFFFF' }}>
                      {p.times_redeemed ?? 0}{p.max_redemptions ? ` / ${p.max_redemptions}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={p.active
                          ? { background: 'rgba(107,142,78,0.2)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.3)' }
                          : { background: 'rgba(176,58,46,0.2)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                        {p.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.active && (
                        <button onClick={() => desactiver(p.id)}
                          className="text-xs px-3 py-1 rounded-md"
                          style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                          Désactiver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPromos
