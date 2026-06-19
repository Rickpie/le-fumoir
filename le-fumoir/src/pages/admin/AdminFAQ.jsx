import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const inputStyle = { background: '#1E1912', borderColor: '#4A3820', color: '#EDD98A' }
const FORM_VIDE = { question: '', reponse: '', ordre: 0 }

function AdminFAQ() {
  const [items, setItems] = useState([])
  const [chargement, setChargement] = useState(true)
  const [form, setForm] = useState(FORM_VIDE)
  const [editId, setEditId] = useState(null)
  const [sauvegarde, setSauvegarde] = useState(false)

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data } = await supabase.from('faq_items').select('*').order('ordre').order('cree_le')
    setItems(data || [])
    setChargement(false)
  }

  async function soumettre(e) {
    e.preventDefault()
    if (!form.question.trim() || !form.reponse.trim()) return
    setSauvegarde(true)
    if (editId) {
      await supabase.from('faq_items').update({ question: form.question, reponse: form.reponse, ordre: Number(form.ordre) }).eq('id', editId)
    } else {
      await supabase.from('faq_items').insert({ question: form.question, reponse: form.reponse, ordre: Number(form.ordre), actif: true })
    }
    setForm(FORM_VIDE); setEditId(null)
    await charger()
    setSauvegarde(false)
  }

  async function toggleActif(item) {
    await supabase.from('faq_items').update({ actif: !item.actif }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, actif: !i.actif } : i))
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cette question ?')) return
    await supabase.from('faq_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    if (editId === id) { setEditId(null); setForm(FORM_VIDE) }
  }

  function commencerEdition(item) {
    setEditId(item.id)
    setForm({ question: item.question, reponse: item.reponse, ordre: item.ordre ?? 0 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-6" style={{ color: '#EDD98A' }}>FAQ</h2>

      {/* Formulaire */}
      <div className="rounded-xl border p-5 mb-8" style={{ background: '#2C2518', borderColor: editId ? '#F0B429' : '#4A3820' }}>
        {editId && (
          <div className="mb-3 text-xs px-2 py-1 rounded inline-block" style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429' }}>
            Mode édition — <button onClick={() => { setEditId(null); setForm(FORM_VIDE) }} className="underline">Annuler</button>
          </div>
        )}
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#F0B429' }}>
          {editId ? 'Modifier la question' : 'Ajouter une question'}
        </h3>
        <form onSubmit={soumettre} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Question *</label>
              <input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} required
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>
            <div style={{ width: '80px' }}>
              <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Ordre</label>
              <input type="number" value={form.ordre} onChange={e => setForm(p => ({ ...p, ordre: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Réponse *</label>
            <textarea value={form.reponse} onChange={e => setForm(p => ({ ...p, reponse: e.target.value }))} required rows={4}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y" style={inputStyle} />
          </div>
          <button type="submit" disabled={sauvegarde}
            className="px-4 py-2 rounded-lg text-sm font-semibold self-start transition-opacity"
            style={{ background: '#F0B429', color: '#1E1912', opacity: sauvegarde ? 0.6 : 1 }}>
            {sauvegarde ? 'Sauvegarde...' : editId ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </form>
      </div>

      {/* Liste */}
      {chargement ? (
        <p className="text-sm" style={{ color: '#FFFFFF' }}>Chargement...</p>
      ) : items.length === 0 ? (
        <p className="text-sm" style={{ color: '#7A6A50' }}>Aucune question pour le moment. Ajoutez-en une ci-dessus.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div key={item.id} className="rounded-xl border p-4" style={{ background: '#2C2518', borderColor: editId === item.id ? '#F0B429' : '#4A3820' }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold" style={{ color: '#EDD98A' }}>{item.question}</p>
                <span className="text-xs shrink-0" style={{ color: '#7A6A50' }}>#{item.ordre ?? 0}</span>
              </div>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: '#FFFFFF' }}>{item.reponse}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={item.actif
                    ? { background: 'rgba(107,142,78,0.2)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.3)' }
                    : { background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                  {item.actif ? 'Visible' : 'Masqué'}
                </span>
                <button onClick={() => toggleActif(item)}
                  className="text-xs px-3 py-1 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                  {item.actif ? 'Masquer' : 'Afficher'}
                </button>
                <button onClick={() => commencerEdition(item)}
                  className="text-xs px-3 py-1 rounded-md"
                  style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
                  Modifier
                </button>
                <button onClick={() => supprimer(item.id)}
                  className="text-xs px-3 py-1 rounded-md"
                  style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminFAQ
