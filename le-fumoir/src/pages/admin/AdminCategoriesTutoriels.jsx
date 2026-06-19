import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const inputStyle = { background: '#1E1912', borderColor: '#4A3820', color: '#EDD98A' }
const FORM_VIDE = { nom: '', icone: '📖', couleur: '#F0B429', ordre: 0 }
const COULEURS = ['#F0B429', '#E8954A', '#A78BFA', '#60A5FA', '#F87171', '#34D399', '#6B8E4E', '#FFFFFF']

function AdminCategoriesTutoriels() {
  const [categories, setCategories] = useState([])
  const [chargement, setChargement] = useState(true)
  const [form, setForm] = useState(FORM_VIDE)
  const [editId, setEditId] = useState(null)
  const [sauvegarde, setSauvegarde] = useState(false)

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data } = await supabase.from('categorie_tutoriels').select('*').order('ordre').order('nom')
    setCategories(data || [])
    setChargement(false)
  }

  async function soumettre(e) {
    e.preventDefault()
    if (!form.nom.trim()) return
    setSauvegarde(true)
    const payload = { nom: form.nom.trim(), icone: form.icone, couleur: form.couleur, ordre: Number(form.ordre) }
    if (editId) {
      await supabase.from('categorie_tutoriels').update(payload).eq('id', editId)
    } else {
      await supabase.from('categorie_tutoriels').insert(payload)
    }
    setForm(FORM_VIDE); setEditId(null)
    await charger()
    setSauvegarde(false)
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cette catégorie ? Les tutoriels associés perdront ce tag.')) return
    await supabase.from('categorie_tutoriels').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
    if (editId === id) { setEditId(null); setForm(FORM_VIDE) }
  }

  function commencerEdition(cat) {
    setEditId(cat.id)
    setForm({ nom: cat.nom, icone: cat.icone || '📖', couleur: cat.couleur || '#F0B429', ordre: cat.ordre ?? 0 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-6" style={{ color: '#EDD98A' }}>Catégories de tutoriels</h2>

      {/* Formulaire */}
      <div className="rounded-xl border p-5 mb-8" style={{ background: '#2C2518', borderColor: editId ? '#F0B429' : '#4A3820' }}>
        {editId && (
          <div className="mb-3 text-xs px-2 py-1 rounded inline-block" style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429' }}>
            Mode édition — <button onClick={() => { setEditId(null); setForm(FORM_VIDE) }} className="underline">Annuler</button>
          </div>
        )}
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#F0B429' }}>
          {editId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        </h3>
        <form onSubmit={soumettre} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Nom *</label>
            <input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} required
              placeholder="Ex: Salage, Fumage, Poisson..."
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Icone (emoji)</label>
            <input value={form.icone} onChange={e => setForm(p => ({ ...p, icone: e.target.value }))}
              placeholder="🧂"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Couleur</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COULEURS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, couleur: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-transform"
                  style={{ background: c, borderColor: form.couleur === c ? '#FFFFFF' : 'transparent', transform: form.couleur === c ? 'scale(1.2)' : 'scale(1)' }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Ordre d'affichage</label>
            <input type="number" value={form.ordre} onChange={e => setForm(p => ({ ...p, ordre: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={sauvegarde}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
              style={{ background: '#F0B429', color: '#1E1912', opacity: sauvegarde ? 0.6 : 1 }}>
              {sauvegarde ? 'Sauvegarde...' : editId ? 'Mettre à jour' : 'Créer la catégorie'}
            </button>
            {/* Prévisualisation */}
            {form.nom && (
              <span className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: `${form.couleur}22`, color: form.couleur, border: `1px solid ${form.couleur}55` }}>
                {form.icone} {form.nom}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Liste */}
      {chargement ? (
        <p className="text-sm" style={{ color: '#FFFFFF' }}>Chargement...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm" style={{ color: '#7A6A50' }}>Aucune catégorie. Créez-en une ci-dessus.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map(cat => (
            <div key={cat.id} className="rounded-xl border p-3 flex items-center gap-3"
              style={{ background: '#2C2518', borderColor: editId === cat.id ? '#F0B429' : '#4A3820' }}>
              <span className="text-xl">{cat.icone}</span>
              <span className="text-sm font-medium flex-1" style={{ color: '#EDD98A' }}>{cat.nom}</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: `${cat.couleur}22`, color: cat.couleur, border: `1px solid ${cat.couleur}55` }}>
                {cat.nom}
              </span>
              <span className="text-xs" style={{ color: '#7A6A50' }}>#{cat.ordre}</span>
              <div className="flex gap-1">
                <button onClick={() => commencerEdition(cat)} className="text-xs px-3 py-1 rounded-md"
                  style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
                  Modifier
                </button>
                <button onClick={() => supprimer(cat.id)} className="text-xs px-3 py-1 rounded-md"
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

export default AdminCategoriesTutoriels
