import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabase'
import UploadPhoto from '../../components/UploadPhoto'
import SelectMultiple from '../../components/SelectMultiple'

function AdminProduits() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [epices, setEpices] = useState([])
  const [inserts, setInserts] = useState([])
  const [chargement, setChargement] = useState(true)
  const [produitEnEdition, setProduitEnEdition] = useState(null)

  const [form, setForm] = useState({
    nom: '', description: '', prix: '', photo_url: '', categorie_id: '', morceau_id: '',
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

    // Auto-ouvrir l'édition si ?edit=ID dans l'URL (venant de la boutique)
    const editId = searchParams.get('edit')
    if (editId && prods) {
      const produit = prods.find(p => p.id === editId)
      if (produit) ouvrirEdition(produit, eps, ins)
    }
  }

  async function ouvrirEdition(produit, eps, ins) {
    const { data: pe } = await supabase.from('produit_epices').select('epice_id').eq('produit_id', produit.id)
    const { data: pi } = await supabase.from('produit_inserts').select('insert_id').eq('produit_id', produit.id)
    setProduitEnEdition(produit)
    setForm({
      nom: produit.nom,
      description: produit.description || '',
      prix: produit.prix,
      photo_url: produit.photo_url || '',
      categorie_id: produit.categorie_id || '',
      morceau_id: produit.morceau_id || '',
      epicesSelectionnees: (pe || []).map(e => e.epice_id),
      insertsSelectionnes: (pi || []).map(i => i.insert_id),
    })
    setSearchParams({})
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
      morceau_id: form.morceau_id || null,
    }

    const produitId = produitEnEdition.id
    await supabase.from('produits').update(payload).eq('id', produitId)

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

    setProduitEnEdition(null)
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

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }
  const labelStyle = { color: '#FFFFFF' }

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: '#EDD98A' }}>🥩 Ventes en cours</h2>

      {/* Formulaire d'édition inline */}
      {produitEnEdition && (
        <form onSubmit={enregistrer} className="rounded-xl border p-4 mb-6 max-w-2xl flex flex-col gap-3"
          style={{ background: '#2C2518', borderColor: '#F0B429' }}>
          <h3 className="font-medium text-sm" style={{ color: '#F0B429' }}>
            ✏️ Modifier — {produitEnEdition.nom}
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
              <label className="block text-xs mb-1 font-medium" style={labelStyle}>Prix (€)</label>
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
            label="Épices proposées"
            options={epices}
            selectionnes={form.epicesSelectionnees}
            onToggle={toggleEpice}
          />

          <SelectMultiple
            label="Inserts proposés"
            options={inserts}
            selectionnes={form.insertsSelectionnes}
            onToggle={toggleInsert}
          />

          <div className="flex gap-2 mt-1">
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#F0B429', color: '#1E1912' }}>
              Enregistrer
            </button>
            <button type="button" onClick={() => setProduitEnEdition(null)}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2 max-w-2xl">
        {produits.map(p => (
          <div key={p.id} className="flex items-center justify-between rounded-lg p-3 border"
            style={{ background: '#2C2518', borderColor: '#4A3820', opacity: p.visible ? 1 : 0.5 }}>
            <div className="flex items-center gap-3">
              {p.photo_url && <img src={p.photo_url} alt="" className="w-10 h-10 object-cover rounded-md" />}
              <div>
                <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>{p.nom}</span>
                <span className="text-xs ml-2" style={{ color: '#F0B429' }}>{p.prix} €</span>
                {p.categories?.nom && (
                  <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429' }}>
                    {p.categories.nom}
                  </span>
                )}
                {!p.visible && <span className="text-xs ml-2" style={{ color: '#FFFFFF' }}>— masqué</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => ouvrirEdition(p, epices, inserts)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                Modifier
              </button>
              <button onClick={() => toggleVisibilite(p)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                {p.visible ? 'Cacher' : 'Afficher'}
              </button>
              <button onClick={() => supprimer(p.id)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                Suppr.
              </button>
            </div>
          </div>
        ))}
        {produits.length === 0 && <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucun produit pour l'instant.</p>}
      </div>
    </div>
  )
}

export default AdminProduits
