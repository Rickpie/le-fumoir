import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import UploadPhoto from '../../components/UploadPhoto'
import SelectMultiple from '../../components/SelectMultiple'

function fourchettePoids(g) {
  if (!g || g <= 0) return null
  const step = g < 200 ? 50 : 100
  const bas = Math.floor(g / step) * step
  const haut = bas + step
  if (bas >= 1000) return `${(bas / 1000).toFixed(1)}–${(haut / 1000).toFixed(1)}kg`
  return `${bas}–${haut}g`
}

function AdminMiseEnVente() {
  const [categories, setCategories] = useState([])
  const [epices, setEpices] = useState([])
  const [inserts, setInserts] = useState([])
  const [morceaux, setMorceaux] = useState([])
  const [obsParMorceau, setObsParMorceau] = useState({})
  const [configCalc, setConfigCalc] = useState({})
  const [configItems, setConfigItems] = useState([])
  const [fraisParProfil, setFraisParProfil] = useState({})
  const [chargement, setChargement] = useState(true)
  const [succes, setSucces] = useState(false)
  const [prixSuggere, setPrixSuggere] = useState(null)

  const [form, setForm] = useState({
    nom: '', description: '', prix: '', photo_url: '', categorie_id: '',
    epicesSelectionnees: [], insertsSelectionnes: [], morceau_id: '',
  })

  useEffect(() => { chargerDonnees() }, [])

  async function chargerDonnees() {
    const [
      { data: cats },
      { data: eps },
      { data: ins },
      { data: morcs },
      { data: obs },
      { data: cfg },
      { data: frais },
    ] = await Promise.all([
      supabase.from('categories').select('*').order('ordre', { nullsFirst: false }).order('nom'),
      supabase.from('epices').select('*').eq('visible', true).order('nom'),
      supabase.from('inserts').select('*').eq('visible', true).order('nom'),
      supabase.from('morceaux').select('*').eq('actif', true).order('nom'),
      supabase.from('observations_marche').select('morceau_id, prix_kg, poids_g'),
      supabase.from('config_calculateur').select('*'),
      supabase.from('frais_variables_profil').select('*'),
    ])

    setCategories(cats || [])
    setEpices(eps || [])
    setInserts(ins || [])
    setMorceaux(morcs || [])
    setForm(f => ({ ...f, epicesSelectionnees: (eps || []).map(e => e.id) }))

    const om = {}
    ;(obs || []).forEach(o => { om[o.morceau_id] = [...(om[o.morceau_id] || []), o] })
    setObsParMorceau(om)

    const cfgItems = cfg || []
    setConfigItems(cfgItems)
    const cfgMap = {}
    cfgItems.forEach(c => { cfgMap[c.cle] = parseFloat(c.valeur) || 0 })
    setConfigCalc(cfgMap)

    const fp = {}
    ;(frais || []).forEach(f => { fp[f.profil_id] = [...(fp[f.profil_id] || []), f] })
    setFraisParProfil(fp)

    setChargement(false)
  }

  function calculerPrixSuggere(morceauId, morceauxList) {
    const m = morceauxList.find(x => x.id === morceauId)
    if (!m) { setPrixSuggere(null); return }

    const obs = obsParMorceau[morceauId] || []
    const obsKg = obs.filter(o => o.prix_kg)
    const obsPoids = obs.filter(o => o.poids_g)

    const avgPrixKg = obsKg.length > 0 ? obsKg.reduce((s, o) => s + parseFloat(o.prix_kg), 0) / obsKg.length : 0
    const avgPoidsG = obsPoids.length > 0 ? obsPoids.reduce((s, o) => s + parseInt(o.poids_g), 0) / obsPoids.length : 0
    const coutMatiere = (avgPrixKg * avgPoidsG) / 1000

    const fraisVariables = fraisParProfil[m.profil_id] || []
    const totalVariables = fraisVariables.reduce((s, f) => {
      const montant = parseFloat(f.montant || 0)
      return s + (f.type_calcul === 'poids' ? (avgPoidsG / 1000) * montant : montant)
    }, 0)

    const totalTournee = configItems.filter(c => c.type === 'tournee').reduce((s, c) => s + parseFloat(c.valeur || 0), 0)
    const nbPieces = configCalc['nb_pieces_tournee'] || 5
    const fraisFixesPiece = nbPieces > 0 ? totalTournee / nbPieces : 0
    const coutMain = ((m.temps_prep_min || 0) / 60) * (configCalc['taux_horaire'] || 0)
    const marge = configCalc['marge_defaut'] || 30

    const prixRevient = coutMatiere + fraisFixesPiece + totalVariables + coutMain
    const prix = Math.ceil(prixRevient * (1 + marge / 100))
    const poids = Math.round(avgPoidsG) || 0
    setPrixSuggere({ prix, poids, prixRevient, marge, avgPrixKg, avgPoidsG })
  }

  function selectionnerCategorie(catId) {
    setForm(f => ({ ...f, categorie_id: catId, morceau_id: '' }))
    setPrixSuggere(null)
  }

  function selectionnerMorceau(morceauId) {
    setForm(f => ({ ...f, morceau_id: morceauId }))
    if (morceauId) calculerPrixSuggere(morceauId, morceaux)
    else setPrixSuggere(null)
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
      morceau_id: form.morceau_id || null,
      visible: true,
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
      morceau_id: '',
    })
    setPrixSuggere(null)
    setTimeout(() => setSucces(false), 3000)
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }
  const labelStyle = { color: '#FFFFFF' }

  const morceauxPourCat = form.categorie_id
    ? morceaux.filter(m => m.categorie_id === form.categorie_id).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    : []

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
            placeholder="ex : Poitrine de porc fumée"
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3} placeholder="Décrivez le produit…"
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        {/* Catégorie → Morceau */}
        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>
            Catégorie *
            {!form.categorie_id && <span className="ml-1 text-xs" style={{ color: '#B03A2E' }}>obligatoire</span>}
          </label>
          <select value={form.categorie_id} onChange={e => selectionnerCategorie(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ ...inputStyle, borderColor: !form.categorie_id ? '#B03A2E' : '#4A3820' }}>
            <option value="">— Choisir une catégorie —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>

        {/* Sous-catégorie / morceau */}
        {morceauxPourCat.length > 0 && (
          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>
              Morceau <span style={{ color: '#7A6A50' }}>(sélectionnez pour obtenir un prix suggéré)</span>
            </label>
            <select value={form.morceau_id} onChange={e => selectionnerMorceau(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
              <option value="">— Choisir —</option>
              {morceauxPourCat.map(m => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>

            {prixSuggere && (
              <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: '#7A6A50' }}>
                      Prix de revient {prixSuggere.prixRevient.toFixed(2)} € + marge {prixSuggere.marge}%
                    </p>
                    <p className="text-lg font-bold" style={{ color: '#F0B429' }}>{prixSuggere.prix} €</p>
                  </div>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, prix: prixSuggere.prix }))}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: '#F0B429', color: '#1E1912' }}>
                    Utiliser ce prix →
                  </button>
                </div>
                <div className="flex gap-4 text-xs pt-2 border-t" style={{ borderColor: 'rgba(240,180,41,0.2)', color: '#7A6A50' }}>
                  {prixSuggere.avgPrixKg > 0 && (
                    <span>Prix marché : <strong style={{ color: '#EDD98A' }}>{prixSuggere.avgPrixKg.toFixed(2)} €/kg</strong></span>
                  )}
                  {prixSuggere.poids > 0 && (
                    <span>Poids estimé : <strong style={{ color: '#EDD98A' }}>{fourchettePoids(prixSuggere.poids)}</strong></span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Prix de base (€) *</label>
          <input type="number" step="0.01" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
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
