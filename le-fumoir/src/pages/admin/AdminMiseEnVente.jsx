import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../supabase'
import UploadPhoto from '../../components/UploadPhoto'

function SelectMultiple({ label, options, selectionnes, onToggle }) {
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
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none text-left flex items-center justify-between"
        style={inputStyle}>
        <span>
          {selectionnes.length === 0 ? 'Aucun sélectionné' : `${selectionnes.length} sélectionné(s)`}
        </span>
        <span style={{ color: '#FFFFFF' }}>{ouvert ? '▲' : '▼'}</span>
      </button>

      {ouvert && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border shadow-lg"
          style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          {options.length === 0 ? (
            <p className="text-xs p-3" style={{ color: '#FFFFFF' }}>Aucune option disponible.</p>
          ) : options.map(opt => (
            <label key={opt.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-white/5"
              style={{ color: '#EDD98A' }}>
              <input type="checkbox" checked={selectionnes.includes(opt.id)} onChange={() => onToggle(opt.id)} />
              {opt.nom} <span style={{ color: '#F0B429' }}>(+{opt.prix_supplement}€)</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminMiseEnVente() {
  const [categories, setCategories] = useState([])
  const [epices, setEpices] = useState([])
  const [inserts, setInserts] = useState([])
  const [chargement, setChargement] = useState(true)
  const [succes, setSucces] = useState(false)

  const [form, setForm] = useState({
    nom: '', description: '', prix: '', photo_url: '', categorie_id: '',
    epicesSelectionnees: [], insertsSelectionnes: [],
  })

  useEffect(() => {
    chargerDonnees()
  }, [])

  async function chargerDonnees() {
    const { data: cats } = await supabase.from('categories').select('*').order('ordre', { nullsFirst: false })
    const { data: eps } = await supabase.from('epices').select('*').eq('visible', true).order('nom')
    const { data: ins } = await supabase.from('inserts').select('*').eq('visible', true).order('nom')
    setCategories(cats || [])
    setEpices(eps || [])
    setInserts(ins || [])
    setForm(f => ({ ...f, epicesSelectionnees: (eps || []).map(e => e.id) }))
    setChargement(false)
  }

  function toggleEpice(id) {
    setForm(f => ({
      ...f,
      epicesSelectionnees: f.epicesSelectionnees.includes(id)
        ? f.epicesSelectionnees.filter(e => e !== id)
        : [...f.epicesSelectionnees, id]
    }))
  }

  function toggleInsert(id) {
    setForm(f => ({
      ...f,
      insertsSelectionnes: f.insertsSelectionnes.includes(id)
        ? f.insertsSelectionnes.filter(i => i !== id)
        : [...f.insertsSelectionnes, id]
    }))
  }

  async function enregistrer(e) {
    e.preventDefault()
    if (!form.categorie_id) {
      alert('Veuillez sélectionner une catégorie avant de publier.')
      return
    }
    const payload = {
      nom: form.nom,
      description: form.description,
      prix: parseFloat(form.prix) || 0,
      photo_url: form.photo_url,
      categorie_id: form.categorie_id,
    }

    const { data } = await supabase.from('produits').insert(payload).select().single()
    const produitId = data.id

    if (form.epicesSelectionnees.length > 0) {
      await supabase.from('produit_epices').insert(
        form.epicesSelectionnees.map(epice_id => ({ produit_id: produitId, epice_id }))
      )
    }
    if (form.insertsSelectionnes.length > 0) {
      await supabase.from('produit_inserts').insert(
        form.insertsSelectionnes.map(insert_id => ({ produit_id: produitId, insert_id }))
      )
    }

    setSucces(true)
    setForm({
      nom: '', description: '', prix: '', photo_url: '', categorie_id: '',
      epicesSelectionnees: epices.map(e => e.id),
      insertsSelectionnes: [],
    })
    setTimeout(() => setSucces(false), 3000)
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }
  const labelStyle = { color: '#FFFFFF' }

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: '#EDD98A' }}>🆕 Mettre un produit en vente</h2>

      {succes && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(107,142,78,0.15)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.3)' }}>
          ✓ Produit créé et mis en vente avec succès.
        </div>
      )}

      <form onSubmit={enregistrer} className="rounded-xl border p-5 max-w-2xl flex flex-col gap-4"
        style={{ background: '#2C2518', borderColor: '#4A3820' }}>

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Nom du produit *</label>
          <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required
            placeholder="ex: Poitrine de porc fumée"
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3} placeholder="Décrivez le produit..."
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Prix de base (€) *</label>
            <input type="number" step="0.01" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>
              Catégorie *
              {!form.categorie_id && <span className="ml-1 text-xs" style={{ color: '#B03A2E' }}>obligatoire</span>}
            </label>
            <select value={form.categorie_id} onChange={e => setForm({ ...form, categorie_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ ...inputStyle, borderColor: !form.categorie_id ? '#B03A2E' : '#4A3820' }}>
              <option value="">— Choisir une catégorie —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Photo</label>
          <UploadPhoto valeur={form.photo_url} onChange={url => setForm({ ...form, photo_url: url })} />
        </div>

        <SelectMultiple
          label="Épices proposées au client (toutes cochées par défaut)"
          options={epices}
          selectionnes={form.epicesSelectionnees}
          onToggle={toggleEpice}
        />

        <SelectMultiple
          label="Inserts proposés au client (aucun coché par défaut)"
          options={inserts}
          selectionnes={form.insertsSelectionnes}
          onToggle={toggleInsert}
        />

        <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold self-start"
          style={{ background: '#F0B429', color: '#1E1912' }}>
          Mettre en vente
        </button>
      </form>
    </div>
  )
}

export default AdminMiseEnVente
