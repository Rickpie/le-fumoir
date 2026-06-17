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

  const labelStyle = { color: '#7a4010' }
  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs mb-1 font-medium" style={labelStyle}>{label}</label>
      <button type="button" onClick={() => setOuvert(!ouvert)}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none text-left flex items-center justify-between"
        style={inputStyle}>
        <span>
          {selectionnes.length === 0 ? 'Aucun sélectionné' : `${selectionnes.length} sélectionné(s)`}
        </span>
        <span>{ouvert ? '▲' : '▼'}</span>
      </button>

      {ouvert && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border bg-white shadow-lg"
          style={{ borderColor: '#d6bfa0' }}>
          {options.length === 0 ? (
            <p className="text-xs p-3" style={{ color: '#a07050' }}>Aucune option disponible.</p>
          ) : options.map(opt => (
            <label key={opt.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-amber-50"
              style={{ color: '#3d1e06' }}>
              <input
                type="checkbox"
                checked={selectionnes.includes(opt.id)}
                onChange={() => onToggle(opt.id)}
              />
              {opt.nom} <span style={{ color: '#b06010' }}>(+{opt.prix_supplement}€)</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminProduits() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [epices, setEpices] = useState([])
  const [inserts, setInserts] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [produitEnEdition, setProduitEnEdition] = useState(null)

  const [form, setForm] = useState({
    nom: '', description: '', prix: '', photo_url: '', categorie_id: '',
    epicesSelectionnees: [], insertsSelectionnes: [],
  })

  useEffect(() => {
    chargerDonnees()
  }, [])

  async function chargerDonnees() {
    const { data: prods } = await supabase.from('produits').select('*, categories(nom)').order('nom')
    const { data: cats } = await supabase.from('categories').select('*').order('ordre', { nullsFirst: false })
    const { data: eps } = await supabase.from('epices').select('*').eq('visible', true).order('nom')
    const { data: ins } = await supabase.from('inserts').select('*').eq('visible', true).order('nom')
    setProduits(prods || [])
    setCategories(cats || [])
    setEpices(eps || [])
    setInserts(ins || [])
    setChargement(false)
  }

  function ouvrirNouveauProduit() {
    setProduitEnEdition(null)
    setForm({
      nom: '', description: '', prix: '', photo_url: '', categorie_id: '',
      epicesSelectionnees: epices.map(e => e.id),
      insertsSelectionnes: [],
    })
    setFormulaireOuvert(true)
  }

  async function ouvrirEdition(produit) {
    const { data: pe } = await supabase.from('produit_epices').select('epice_id').eq('produit_id', produit.id)
    const { data: pi } = await supabase.from('produit_inserts').select('insert_id').eq('produit_id', produit.id)
    setProduitEnEdition(produit)
    setForm({
      nom: produit.nom,
      description: produit.description || '',
      prix: produit.prix,
      photo_url: produit.photo_url || '',
      categorie_id: produit.categorie_id || '',
      epicesSelectionnees: (pe || []).map(e => e.epice_id),
      insertsSelectionnes: (pi || []).map(i => i.insert_id),
    })
    setFormulaireOuvert(true)
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
    const payload = {
      nom: form.nom,
      description: form.description,
      prix: parseFloat(form.prix) || 0,
      photo_url: form.photo_url,
      categorie_id: form.categorie_id || null,
    }

    let produitId = produitEnEdition?.id

    if (produitEnEdition) {
      await supabase.from('produits').update(payload).eq('id', produitId)
    } else {
      const { data } = await supabase.from('produits').insert(payload).select().single()
      produitId = data.id
    }

    await supabase.from('produit_epices').delete().eq('produit_id', produitId)
    await supabase.from('produit_inserts').delete().eq('produit_id', produitId)

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

    setFormulaireOuvert(false)
    chargerDonnees()
  }

  async function toggleVisibilite(produit) {
    await supabase.from('produits').update({ visible: !produit.visible }).eq('id', produit.id)
    chargerDonnees()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer définitivement ce produit ?')) return
    await supabase.from('produits').delete().eq('id', id)
    chargerDonnees()
  }

  if (chargement) return <p style={{ color: '#7a4010' }}>Chargement...</p>

  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }
  const labelStyle = { color: '#7a4010' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium" style={{ color: '#3d1e06' }}>🥩 Produits</h2>
        <button onClick={ouvrirNouveauProduit} className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
          + Nouveau produit
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={enregistrer} className="bg-white rounded-xl border p-4 mb-6 max-w-2xl flex flex-col gap-3"
          style={{ borderColor: '#d6bfa0' }}>
          <h3 className="font-medium" style={{ color: '#3d1e06' }}>
            {produitEnEdition ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Nom</label>
            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1 font-medium" style={labelStyle}>Prix de base (€)</label>
              <input type="number" step="0.01" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} required
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1 font-medium" style={labelStyle}>Catégorie</label>
              <select value={form.categorie_id} onChange={e => setForm({ ...form, categorie_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
                <option value="">— Choisir —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Photo</label>
            <UploadPhoto valeur={form.photo_url} onChange={url => setForm({ ...form, photo_url: url })} />
          </div>

          <SelectMultiple
            label="Épices proposées au client pour ce produit"
            options={epices}
            selectionnes={form.epicesSelectionnees}
            onToggle={toggleEpice}
          />

          <SelectMultiple
            label="Inserts proposés au client pour ce produit"
            options={inserts}
            selectionnes={form.insertsSelectionnes}
            onToggle={toggleInsert}
          />

          <div className="flex gap-2 mt-2">
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
              {produitEnEdition ? 'Enregistrer' : 'Créer le produit'}
            </button>
            <button type="button" onClick={() => setFormulaireOuvert(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#f5e2c0', color: '#7a4010' }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2 max-w-2xl">
        {produits.map(p => (
          <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-3 border"
            style={{ borderColor: '#d6bfa0', opacity: p.visible ? 1 : 0.5 }}>
            <div className="flex items-center gap-3">
              {p.photo_url && <img src={p.photo_url} alt="" className="w-10 h-10 object-cover rounded-md" />}
              <div>
                <span className="text-sm font-medium" style={{ color: '#3d1e06' }}>{p.nom}</span>
                <span className="text-xs ml-2" style={{ color: '#b06010' }}>{p.prix} €</span>
                {p.categories?.nom && (
                  <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: '#f5e2c0', color: '#7a4010' }}>
                    {p.categories.nom}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => ouvrirEdition(p)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#f5e2c0', color: '#7a4010' }}>
                Modifier
              </button>
              <button onClick={() => toggleVisibilite(p)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#f5e2c0', color: '#7a4010' }}>
                {p.visible ? 'Cacher' : 'Afficher'}
              </button>
              <button onClick={() => supprimer(p.id)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#fde8e8', color: '#c0392b' }}>
                Suppr.
              </button>
            </div>
          </div>
        ))}
        {produits.length === 0 && <p className="text-sm" style={{ color: '#a07050' }}>Aucun produit pour l'instant.</p>}
      </div>
    </div>
  )
}

export default AdminProduits