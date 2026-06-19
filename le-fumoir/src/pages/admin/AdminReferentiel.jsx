import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const TODAY = new Date().toISOString().split('T')[0]

function avg(arr) { return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0 }

function AdminReferentiel() {
  const [onglet, setOnglet] = useState('viandes')

  // Data
  const [categories, setCategories] = useState([])
  const [morceaux, setMorceaux] = useState([])
  const [obsParMorceau, setObsParMorceau] = useState({})
  const [profils, setProfils] = useState([])
  const [fraisParProfil, setFraisParProfil] = useState({})
  const [configItems, setConfigItems] = useState([])
  const [configCalc, setConfigCalc] = useState({})
  const [chargement, setChargement] = useState(true)

  // Accordéons ouverts
  const [catOuverte, setCatOuverte] = useState(new Set())
  const [morceauOuvert, setMorceauOuvert] = useState(new Set())
  const [profilOuvert, setProfilOuvert] = useState(new Set())

  // Formulaires — catégories
  const [nouvelleCat, setNouvelleCat] = useState({ nom: '', ordre: '', est_viande: false })
  const [editCat, setEditCat] = useState(null)

  // Formulaires — morceaux
  const [nouveauMorceau, setNouveauMorceau] = useState({})
  const [showFormMorceau, setShowFormMorceau] = useState(new Set())
  const [editMorceau, setEditMorceau] = useState(null)

  // Formulaires — observations
  const [obsForm, setObsForm] = useState({})

  // Formulaires — profils
  const [nouveauProfil, setNouveauProfil] = useState({ nom: '' })
  const [editProfil, setEditProfil] = useState(null)

  // Formulaires — frais profil
  const [fraisForm, setFraisForm] = useState({})
  const [editFrais, setEditFrais] = useState({})

  useEffect(() => { chargerTout() }, [])

  async function chargerTout() {
    const [
      { data: cats },
      { data: morcs },
      { data: obs },
      { data: profs },
      { data: frais },
      { data: cfg },
    ] = await Promise.all([
      supabase.from('categories').select('*').order('ordre', { nullsFirst: false }).order('nom'),
      supabase.from('morceaux').select('*').order('nom'),
      supabase.from('observations_marche').select('*').order('date_observation', { ascending: false }),
      supabase.from('profils_preparation').select('*').order('nom'),
      supabase.from('frais_variables_profil').select('*').order('ordre'),
      supabase.from('config_calculateur').select('*'),
    ])

    setCategories(cats || [])
    const nextOrdre = Math.max(0, ...(cats || []).map(c => c.ordre || 0)) + 1
    setNouvelleCat(prev => ({ ...prev, ordre: prev.ordre || String(nextOrdre) }))
    setMorceaux(morcs || [])

    const om = {}
    ;(obs || []).forEach(o => { om[o.morceau_id] = [...(om[o.morceau_id] || []), o] })
    setObsParMorceau(om)

    setProfils(profs || [])

    const fp = {}
    ;(frais || []).forEach(f => { fp[f.profil_id] = [...(fp[f.profil_id] || []), f] })
    setFraisParProfil(fp)

    const cfgItems = cfg || []
    setConfigItems(cfgItems)
    const cfgMap = {}
    cfgItems.forEach(c => { cfgMap[c.cle] = parseFloat(c.valeur) || 0 })
    setConfigCalc(cfgMap)

    setChargement(false)
  }

  // ── CATÉGORIES ──────────────────────────────────────────────
  async function ajouterCategorie() {
    if (!nouvelleCat.nom.trim()) return
    const ordre = parseInt(nouvelleCat.ordre) || (Math.max(0, ...categories.map(c => c.ordre || 0)) + 1)
    const { data } = await supabase.from('categories')
      .insert({ nom: nouvelleCat.nom.trim(), ordre, est_viande: nouvelleCat.est_viande })
      .select().single()
    if (data) {
      const newCats = [...categories, data]
      setCategories(newCats.sort((a, b) => (a.ordre || 0) - (b.ordre || 0) || a.nom.localeCompare(b.nom, 'fr')))
      const nextOrdre = Math.max(0, ...newCats.map(c => c.ordre || 0)) + 1
      setNouvelleCat({ nom: '', ordre: String(nextOrdre), est_viande: false })
    }
  }

  async function sauvegarderCat() {
    if (!editCat?.nom?.trim()) return
    await supabase.from('categories').update({ nom: editCat.nom, ordre: editCat.ordre, est_viande: editCat.est_viande }).eq('id', editCat.id)
    setCategories(prev => prev.map(c => c.id === editCat.id ? { ...c, nom: editCat.nom, ordre: editCat.ordre, est_viande: editCat.est_viande } : c))
    setEditCat(null)
  }

  async function supprimerCat(id) {
    const nb = morceaux.filter(m => m.categorie_id === id).length
    if (nb > 0) { alert(`Cette catégorie contient ${nb} morceau(x). Supprimez-les d'abord.`); return }
    if (!confirm('Supprimer cette catégorie ?')) return
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  // ── MORCEAUX ────────────────────────────────────────────────
  async function ajouterMorceau(catId) {
    const f = nouveauMorceau[catId] || {}
    if (!f.nom?.trim()) return
    const { data } = await supabase.from('morceaux')
      .insert({
        nom: f.nom.trim(),
        categorie_id: catId,
        profil_id: f.profil_id || null,
        temps_prep_min: parseInt(f.temps_prep_min) || 0,
        actif: true,
      })
      .select().single()
    if (data) {
      setMorceaux(prev => [...prev, data])
      setNouveauMorceau(prev => ({ ...prev, [catId]: { nom: '', temps_prep_min: '', profil_id: '' } }))
      setShowFormMorceau(prev => { const n = new Set(prev); n.delete(catId); return n })
    }
  }

  async function sauvegarderMorceau() {
    if (!editMorceau?.nom?.trim()) return
    const payload = {
      nom: editMorceau.nom,
      profil_id: editMorceau.profil_id || null,
      temps_prep_min: parseInt(editMorceau.temps_prep_min) || 0,
      actif: editMorceau.actif !== false,
    }
    await supabase.from('morceaux').update(payload).eq('id', editMorceau.id)
    setMorceaux(prev => prev.map(m => m.id === editMorceau.id ? { ...m, ...payload } : m))
    setEditMorceau(null)
  }

  async function supprimerMorceau(id) {
    if (!confirm('Supprimer ce morceau et toutes ses observations ?')) return
    await supabase.from('morceaux').delete().eq('id', id)
    setMorceaux(prev => prev.filter(m => m.id !== id))
    setObsParMorceau(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  // ── OBSERVATIONS ────────────────────────────────────────────
  function handleObsChange(morceauId, field, value) {
    const cur = obsForm[morceauId] || { prix_kg: '', poids_g: '', prix_piece: '', magasin: '', date_observation: TODAY }
    const updated = { ...cur, [field]: value }
    const kg = parseFloat(updated.prix_kg)
    const g = parseInt(updated.poids_g)
    const p = parseFloat(updated.prix_piece)
    if ((field === 'prix_kg' || field === 'poids_g') && kg > 0 && g > 0) {
      updated.prix_piece = ((kg * g) / 1000).toFixed(2)
    } else if (field === 'prix_piece' && p > 0 && g > 0) {
      updated.prix_kg = ((p / g) * 1000).toFixed(2)
    }
    setObsForm(prev => ({ ...prev, [morceauId]: updated }))
  }

  async function ajouterObservation(morceauId) {
    const f = obsForm[morceauId] || {}
    if (!f.prix_kg && !f.prix_piece) return
    const payload = {
      morceau_id: morceauId,
      prix_kg: parseFloat(f.prix_kg) || null,
      poids_g: parseInt(f.poids_g) || null,
      prix_piece: parseFloat(f.prix_piece) || null,
      magasin: f.magasin || '',
      date_observation: f.date_observation || TODAY,
    }
    const { data } = await supabase.from('observations_marche').insert(payload).select().single()
    if (data) {
      setObsParMorceau(prev => ({ ...prev, [morceauId]: [data, ...(prev[morceauId] || [])] }))
      setObsForm(prev => ({ ...prev, [morceauId]: { prix_kg: '', poids_g: '', prix_piece: '', magasin: '', date_observation: TODAY } }))
    }
  }

  async function supprimerObservation(obsId, morceauId) {
    await supabase.from('observations_marche').delete().eq('id', obsId)
    setObsParMorceau(prev => ({ ...prev, [morceauId]: (prev[morceauId] || []).filter(o => o.id !== obsId) }))
  }

  // ── PROFILS ──────────────────────────────────────────────────
  async function ajouterProfil() {
    if (!nouveauProfil.nom.trim()) return
    const { data } = await supabase.from('profils_preparation')
      .insert({ nom: nouveauProfil.nom.trim() })
      .select().single()
    if (data) {
      setProfils(prev => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')))
      setNouveauProfil({ nom: '' })
    }
  }

  async function sauvegarderProfil() {
    if (!editProfil?.nom?.trim()) return
    await supabase.from('profils_preparation').update({ nom: editProfil.nom }).eq('id', editProfil.id)
    setProfils(prev => prev.map(p => p.id === editProfil.id ? { ...p, nom: editProfil.nom } : p))
    setEditProfil(null)
  }

  async function supprimerProfil(id) {
    const nb = morceaux.filter(m => m.profil_id === id).length
    if (nb > 0) { alert(`Ce profil est utilisé par ${nb} morceau(x). Retirez-le d'abord.`); return }
    if (!confirm('Supprimer ce profil et tous ses frais ?')) return
    await supabase.from('profils_preparation').delete().eq('id', id)
    setProfils(prev => prev.filter(p => p.id !== id))
    setFraisParProfil(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  // ── FRAIS PROFIL ────────────────────────────────────────────
  async function ajouterFrais(profilId) {
    const f = fraisForm[profilId] || {}
    if (!f.label?.trim() || !f.montant) return
    const { data } = await supabase.from('frais_variables_profil')
      .insert({
        profil_id: profilId,
        label: f.label.trim(),
        montant: parseFloat(f.montant),
        quantite: parseInt(f.quantite) || 1,
        type_calcul: f.type_calcul || 'fixe',
        ordre: (fraisParProfil[profilId]?.length || 0) + 1,
      })
      .select().single()
    if (data) {
      setFraisParProfil(prev => ({ ...prev, [profilId]: [...(prev[profilId] || []), data] }))
      setFraisForm(prev => ({ ...prev, [profilId]: { label: '', montant: '', quantite: '1', type_calcul: 'fixe' } }))
    }
  }

  async function sauvegarderFrais(fraisId) {
    const f = editFrais[fraisId]
    if (!f) return
    const payload = { label: f.label, montant: parseFloat(f.montant), quantite: parseInt(f.quantite) || 1, type_calcul: f.type_calcul || 'fixe' }
    await supabase.from('frais_variables_profil').update(payload).eq('id', fraisId)
    setFraisParProfil(prev => {
      const n = { ...prev }
      Object.keys(n).forEach(pid => {
        n[pid] = n[pid].map(x => x.id === fraisId ? { ...x, ...payload } : x)
      })
      return n
    })
    setEditFrais(prev => { const n = { ...prev }; delete n[fraisId]; return n })
  }

  async function supprimerFrais(fraisId, profilId) {
    await supabase.from('frais_variables_profil').delete().eq('id', fraisId)
    setFraisParProfil(prev => ({ ...prev, [profilId]: (prev[profilId] || []).filter(f => f.id !== fraisId) }))
  }

  // ── PRIX IDÉAL ───────────────────────────────────────────────
  function calculerPrixIdeal(m) {
    const obs = obsParMorceau[m.id] || []
    if (obs.length === 0 || !m.profil_id) return null

    const obsKg = obs.filter(o => o.prix_kg)
    const obsPoids = obs.filter(o => o.poids_g)
    if (obsKg.length === 0 || obsPoids.length === 0) return null

    const avgKg = avg(obsKg.map(o => parseFloat(o.prix_kg)))
    const avgPoids = avg(obsPoids.map(o => parseInt(o.poids_g)))
    const coutMatiere = (avgKg * avgPoids) / 1000

    const fraisProf = fraisParProfil[m.profil_id] || []
    const totalVariables = fraisProf.reduce((s, f) => {
      const montant = parseFloat(f.montant || 0) * (parseInt(f.quantite) || 1)
      return s + (f.type_calcul === 'poids' ? (avgPoids / 1000) * montant : montant)
    }, 0)

    const totalTournee = configItems.filter(c => c.type === 'tournee').reduce((s, c) => s + parseFloat(c.valeur || 0), 0)
    const fraisFixesPiece = totalTournee / 5
    const coutMain = ((m.temps_prep_min || 0) / 60) * (configCalc['taux_horaire'] || 0)
    const marge = configCalc['marge_defaut'] || 30

    const prixRevient = coutMatiere + totalVariables + fraisFixesPiece + coutMain
    return Math.ceil(prixRevient * (1 + marge / 100))
  }

  // ── HELPERS ──────────────────────────────────────────────────
  function toggle(setter, id) {
    setter(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }
  const inputSm = { ...inputStyle, fontSize: '0.8rem', padding: '4px 8px' }

  const catsSorted = [...categories].sort((a, b) => (a.ordre || 0) - (b.ordre || 0) || a.nom.localeCompare(b.nom, 'fr'))
  const viandeCats = catsSorted.filter(c => c.est_viande)
  const autreCats = catsSorted.filter(c => !c.est_viande)
  const profilsSorted = [...profils].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: '#EDD98A' }}>📋 Référentiel produits</h2>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'viandes', label: '🥩 Viandes & Morceaux' },
          { id: 'profils', label: '🔥 Profils de préparation' },
        ].map(t => (
          <button key={t.id} onClick={() => setOnglet(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={onglet === t.id
              ? { background: '#F0B429', color: '#1E1912' }
              : { background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════ ONGLET 1 : VIANDES & MORCEAUX ═══════════ */}
      {onglet === 'viandes' && (
        <div className="flex flex-col gap-3 max-w-3xl">

          {viandeCats.length === 0 && autreCats.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: '#7A6A50' }}>
              Aucune catégorie. Créez-en une ci-dessous (ex : Canard, Porc, Bœuf…)
            </p>
          )}

          {viandeCats.map(cat => {
            const morceauxCat = morceaux.filter(m => m.categorie_id === cat.id).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
            const isOpen = catOuverte.has(cat.id)

            return (
              <div key={cat.id} className="rounded-xl border" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
                {/* Header catégorie */}
                <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => toggle(setCatOuverte, cat.id)}>
                  {editCat?.id === cat.id ? (
                    <div className="flex-1 flex flex-wrap gap-2 items-center" onClick={e => e.stopPropagation()}>
                      <input value={editCat.nom} onChange={e => setEditCat(p => ({ ...p, nom: e.target.value }))}
                        className="flex-1 px-2 py-1 rounded border text-sm outline-none" style={inputStyle} placeholder="Nom" />
                      <div className="flex items-center gap-1">
                        <span className="text-xs shrink-0" style={{ color: '#7A6A50' }}>Ordre</span>
                        <input type="number" value={editCat.ordre} onChange={e => setEditCat(p => ({ ...p, ordre: e.target.value }))}
                          className="w-14 px-2 py-1 rounded border text-sm outline-none text-center" style={inputStyle} />
                      </div>
                      <button type="button"
                        onClick={() => setEditCat(p => ({ ...p, est_viande: !p.est_viande }))}
                        className="text-xs px-2 py-1 rounded font-medium"
                        style={editCat.est_viande
                          ? { background: 'rgba(107,142,78,0.25)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.5)' }
                          : { background: 'rgba(176,58,46,0.2)', color: '#E07060', border: '1px solid rgba(176,58,46,0.4)' }}>
                        🥩 Viande
                      </button>
                      <button onClick={sauvegarderCat} className="text-xs px-2 py-1 rounded" style={{ background: '#6B8E4E', color: '#fff' }}>✓</button>
                      <button onClick={() => setEditCat(null)} className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#7A6A50' }}>✕</button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: '#EDD98A' }}>{cat.nom}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1E1912', color: '#7A6A50', fontVariantNumeric: 'tabular-nums' }}>
                        #{cat.ordre ?? '—'}
                      </span>
                      {cat.est_viande && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(176,58,46,0.15)', color: '#E07060', border: '1px solid rgba(176,58,46,0.3)' }}>🥩</span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1E1912', color: '#7A6A50' }}>
                        {morceauxCat.length} morceau{morceauxCat.length !== 1 ? 'x' : ''}
                      </span>
                    </div>
                  )}
                  {editCat?.id !== cat.id && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setEditCat({ id: cat.id, nom: cat.nom, ordre: cat.ordre || 0, est_viande: cat.est_viande || false })}
                        className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#EDD98A' }}>✏️</button>
                      <button onClick={() => supprimerCat(cat.id)}
                        className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#B03A2E' }}>🗑️</button>
                    </div>
                  )}
                  <span style={{ color: '#7A6A50', fontSize: '0.7rem' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div className="border-t px-3 pb-3" style={{ borderColor: '#4A3820' }}>
                    <div className="flex flex-col gap-2 mt-3">

                      {morceauxCat.length === 0 && (
                        <p className="text-xs py-1" style={{ color: '#7A6A50' }}>Aucun morceau. Ajoutez-en un ci-dessous.</p>
                      )}

                      {morceauxCat.map(m => {
                        const obs = obsParMorceau[m.id] || []
                        const isMOpen = morceauOuvert.has(m.id)
                        const avgKg = avg(obs.filter(o => o.prix_kg).map(o => parseFloat(o.prix_kg)))
                        const avgPoids = avg(obs.filter(o => o.poids_g).map(o => parseInt(o.poids_g)))
                        const profilNom = profils.find(p => p.id === m.profil_id)?.nom
                        const prixIdeal = calculerPrixIdeal(m)

                        return (
                          <div key={m.id} className="rounded-lg border" style={{ background: '#1E1912', borderColor: '#3A2E1A' }}>
                            {/* Header morceau */}
                            <div className="flex items-center gap-2 p-2.5 cursor-pointer" onClick={() => toggle(setMorceauOuvert, m.id)}>
                              {editMorceau?.id === m.id ? (
                                <div className="flex-1 grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                                  <input value={editMorceau.nom} onChange={e => setEditMorceau(p => ({ ...p, nom: e.target.value }))}
                                    placeholder="Nom" className="px-2 py-1 rounded border text-xs outline-none col-span-2" style={inputStyle} />
                                  <select value={editMorceau.profil_id || ''} onChange={e => setEditMorceau(p => ({ ...p, profil_id: e.target.value }))}
                                    className="px-2 py-1 rounded border text-xs outline-none col-span-2" style={inputStyle}>
                                    <option value="">— Profil de préparation —</option>
                                    {profilsSorted.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                  </select>
                                  <div className="flex items-center gap-1">
                                    <input type="number" placeholder="Min prépa" value={editMorceau.temps_prep_min}
                                      onChange={e => setEditMorceau(p => ({ ...p, temps_prep_min: e.target.value }))}
                                      className="flex-1 px-2 py-1 rounded border text-xs outline-none" style={inputStyle} />
                                    <span className="text-xs shrink-0" style={{ color: '#7A6A50' }}>min</span>
                                  </div>
                                  <button type="button"
                                    onClick={() => setEditMorceau(p => ({ ...p, actif: !(p.actif !== false) }))}
                                    className="px-2 py-1 rounded text-xs font-medium"
                                    style={editMorceau.actif !== false
                                      ? { background: 'rgba(107,142,78,0.25)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.5)' }
                                      : { background: 'rgba(176,58,46,0.2)', color: '#E07060', border: '1px solid rgba(176,58,46,0.4)' }}>
                                    {editMorceau.actif !== false ? 'Actif' : 'Inactif'}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="text-sm font-medium" style={{ color: m.actif === false ? '#7A6A50' : '#EDD98A' }}>{m.nom}</span>
                                  {m.actif === false && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(176,58,46,0.15)', color: '#E07060', border: '1px solid rgba(176,58,46,0.3)' }}>désactivé</span>
                                  )}
                                  {profilNom && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
                                      🔥 {profilNom}
                                    </span>
                                  )}
                                  {obs.length > 0 && (
                                    <span className="text-xs" style={{ color: '#6B8E4E' }}>
                                      {obs.length} obs · {avgKg.toFixed(2)} €/kg · {Math.round(avgPoids)}g
                                    </span>
                                  )}
                                  {prixIdeal && (
                                    <span className="text-xs font-semibold" style={{ color: '#F0B429' }}>→ {prixIdeal} €</span>
                                  )}
                                </div>
                              )}
                              {editMorceau?.id === m.id ? (
                                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                  <button onClick={sauvegarderMorceau} className="text-xs px-2 py-1 rounded" style={{ background: '#6B8E4E', color: '#fff' }}>✓</button>
                                  <button onClick={() => setEditMorceau(null)} className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#7A6A50' }}>✕</button>
                                </div>
                              ) : (
                                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => setEditMorceau({ id: m.id, nom: m.nom, profil_id: m.profil_id || '', temps_prep_min: m.temps_prep_min || '', actif: m.actif !== false })}
                                    className="text-xs px-2 py-1 rounded" style={{ background: '#2C2518', color: '#EDD98A' }}>✏️</button>
                                  <button onClick={() => supprimerMorceau(m.id)}
                                    className="text-xs px-2 py-1 rounded" style={{ background: '#2C2518', color: '#B03A2E' }}>🗑️</button>
                                </div>
                              )}
                              <span style={{ color: '#7A6A50', fontSize: '0.7rem' }}>{isMOpen ? '▲' : '▼'}</span>
                            </div>

                            {/* Détail morceau : observations */}
                            {isMOpen && (
                              <div className="border-t px-3 pb-3" style={{ borderColor: '#3A2E1A' }}>
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                    <p className="text-xs font-semibold" style={{ color: '#F0B429' }}>Relevés de marché</p>
                                    {prixIdeal ? (
                                      <div className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: 'rgba(240,180,41,0.12)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.25)' }}>
                                        Prix idéal estimé : <strong>{prixIdeal} €</strong>
                                      </div>
                                    ) : obs.length > 0 && !m.profil_id ? (
                                      <p className="text-xs" style={{ color: '#7A6A50' }}>⚠️ Assigne un profil pour voir le prix idéal</p>
                                    ) : null}
                                  </div>

                                  {obs.length > 0 ? (
                                    <table className="w-full text-xs mb-3" style={{ borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ color: '#7A6A50' }}>
                                          <th className="text-left pb-1 pr-2">Date</th>
                                          <th className="text-left pb-1 pr-2">Magasin</th>
                                          <th className="text-right pb-1 pr-2">€/kg</th>
                                          <th className="text-right pb-1 pr-2">Poids</th>
                                          <th className="text-right pb-1 pr-2">€/pièce</th>
                                          <th></th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {obs.map(o => (
                                          <tr key={o.id} style={{ borderTop: '1px solid #2C2518' }}>
                                            <td className="py-1 pr-2" style={{ color: '#FFFFFF' }}>{o.date_observation}</td>
                                            <td className="py-1 pr-2" style={{ color: '#FFFFFF' }}>{o.magasin || '—'}</td>
                                            <td className="py-1 pr-2 text-right" style={{ color: '#EDD98A' }}>{o.prix_kg ? `${parseFloat(o.prix_kg).toFixed(2)} €` : '—'}</td>
                                            <td className="py-1 pr-2 text-right" style={{ color: '#EDD98A' }}>{o.poids_g ? `${o.poids_g} g` : '—'}</td>
                                            <td className="py-1 pr-2 text-right" style={{ color: '#F0B429' }}>{o.prix_piece ? `${parseFloat(o.prix_piece).toFixed(2)} €` : '—'}</td>
                                            <td>
                                              <button onClick={() => supprimerObservation(o.id, m.id)} style={{ color: '#B03A2E', fontSize: '0.75rem' }}>✕</button>
                                            </td>
                                          </tr>
                                        ))}
                                        {obs.length > 1 && (
                                          <tr style={{ borderTop: '1px solid #3A2E1A' }}>
                                            <td colSpan={2} className="py-1 font-semibold" style={{ color: '#FFFFFF' }}>Moyennes ({obs.length})</td>
                                            <td className="py-1 text-right font-semibold" style={{ color: '#F0B429' }}>{avgKg.toFixed(2)} €/kg</td>
                                            <td className="py-1 text-right font-semibold" style={{ color: '#F0B429' }}>{Math.round(avgPoids)} g</td>
                                            <td className="py-1 text-right font-semibold" style={{ color: '#F0B429' }}>{((avgKg * avgPoids) / 1000).toFixed(2)} €</td>
                                            <td></td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p className="text-xs mb-3" style={{ color: '#7A6A50' }}>Aucun relevé. Ajoutez vos prix après votre passage en magasin.</p>
                                  )}

                                  {/* Formulaire ajout observation */}
                                  <div className="flex gap-2 flex-wrap">
                                    <input type="date" value={obsForm[m.id]?.date_observation || TODAY}
                                      onChange={e => handleObsChange(m.id, 'date_observation', e.target.value)}
                                      className="px-2 py-1 rounded border text-xs outline-none" style={{ ...inputSm, width: '130px' }} />
                                    <input placeholder="Magasin" value={obsForm[m.id]?.magasin || ''}
                                      onChange={e => handleObsChange(m.id, 'magasin', e.target.value)}
                                      className="px-2 py-1 rounded border text-xs outline-none" style={{ ...inputSm, width: '110px' }} />
                                    <div className="flex items-center gap-1">
                                      <input type="number" step="0.01" placeholder="€/kg"
                                        value={obsForm[m.id]?.prix_kg || ''}
                                        onChange={e => handleObsChange(m.id, 'prix_kg', e.target.value)}
                                        className="px-2 py-1 rounded border text-xs outline-none text-right" style={{ ...inputSm, width: '70px' }} />
                                      <span className="text-xs" style={{ color: '#7A6A50' }}>€/kg</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <input type="number" placeholder="Poids"
                                        value={obsForm[m.id]?.poids_g || ''}
                                        onChange={e => handleObsChange(m.id, 'poids_g', e.target.value)}
                                        className="px-2 py-1 rounded border text-xs outline-none text-right" style={{ ...inputSm, width: '65px' }} />
                                      <span className="text-xs" style={{ color: '#7A6A50' }}>g</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <input type="number" step="0.01" placeholder="€/pièce"
                                        value={obsForm[m.id]?.prix_piece || ''}
                                        onChange={e => handleObsChange(m.id, 'prix_piece', e.target.value)}
                                        className="px-2 py-1 rounded border text-xs outline-none text-right" style={{ ...inputSm, width: '70px' }} />
                                      <span className="text-xs" style={{ color: '#7A6A50' }}>€</span>
                                    </div>
                                    <button onClick={() => ajouterObservation(m.id)}
                                      className="px-3 py-1 rounded text-xs font-medium" style={{ background: '#F0B429', color: '#1E1912' }}>
                                      + Relever
                                    </button>
                                  </div>
                                  <p className="text-xs mt-1" style={{ color: '#7A6A50' }}>
                                    Astuce : entrez 2 champs sur 3 (€/kg + poids ou €/pièce + poids) et le 3ème se calcule.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Ajouter un morceau */}
                    {showFormMorceau.has(cat.id) ? (
                      <div className="mt-3 p-3 rounded-lg border" style={{ background: '#1E1912', borderColor: '#3A2E1A' }}>
                        <p className="text-xs font-medium mb-2" style={{ color: '#F0B429' }}>Nouveau morceau dans {cat.nom}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Nom (ex : Magret de canard)"
                            value={nouveauMorceau[cat.id]?.nom || ''}
                            onChange={e => setNouveauMorceau(p => ({ ...p, [cat.id]: { ...p[cat.id], nom: e.target.value } }))}
                            className="px-2 py-1.5 rounded border text-sm outline-none col-span-2" style={inputStyle} />
                          <select value={nouveauMorceau[cat.id]?.profil_id || ''}
                            onChange={e => setNouveauMorceau(p => ({ ...p, [cat.id]: { ...p[cat.id], profil_id: e.target.value } }))}
                            className="px-2 py-1.5 rounded border text-xs outline-none col-span-2" style={inputStyle}>
                            <option value="">— Profil de préparation (optionnel) —</option>
                            {profilsSorted.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                          </select>
                          <div className="flex items-center gap-1">
                            <input type="number" placeholder="Temps prépa"
                              value={nouveauMorceau[cat.id]?.temps_prep_min || ''}
                              onChange={e => setNouveauMorceau(p => ({ ...p, [cat.id]: { ...p[cat.id], temps_prep_min: e.target.value } }))}
                              className="flex-1 px-2 py-1.5 rounded border text-xs outline-none" style={inputStyle} />
                            <span className="text-xs shrink-0" style={{ color: '#7A6A50' }}>min</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => ajouterMorceau(cat.id)}
                            className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: '#F0B429', color: '#1E1912' }}>
                            Créer le morceau
                          </button>
                          <button onClick={() => setShowFormMorceau(prev => { const n = new Set(prev); n.delete(cat.id); return n })}
                            className="px-3 py-1.5 rounded text-xs" style={{ background: '#3A2E1A', color: '#FFFFFF' }}>
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowFormMorceau(prev => { const n = new Set(prev); n.add(cat.id); return n })}
                        className="mt-3 text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ background: '#1E1912', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
                        + Ajouter un morceau
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {autreCats.length > 0 && (
            <div className="pt-3 mt-1 border-t" style={{ borderColor: '#4A3820' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#7A6A50' }}>Catégories boutique (sans morceaux)</p>
              <div className="flex flex-col gap-1.5">
                {autreCats.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#2C2518', border: '1px solid #4A3820' }}>
                    {editCat?.id === cat.id ? (
                      <div className="flex-1 flex flex-wrap gap-2 items-center" onClick={e => e.stopPropagation()}>
                        <input value={editCat.nom} onChange={e => setEditCat(p => ({ ...p, nom: e.target.value }))}
                          className="flex-1 px-2 py-1 rounded border text-sm outline-none" style={inputStyle} placeholder="Nom" />
                        <div className="flex items-center gap-1">
                          <span className="text-xs shrink-0" style={{ color: '#7A6A50' }}>Ordre</span>
                          <input type="number" value={editCat.ordre} onChange={e => setEditCat(p => ({ ...p, ordre: e.target.value }))}
                            className="w-14 px-2 py-1 rounded border text-sm outline-none text-center" style={inputStyle} />
                        </div>
                        <button type="button"
                          onClick={() => setEditCat(p => ({ ...p, est_viande: !p.est_viande }))}
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={editCat.est_viande
                            ? { background: 'rgba(107,142,78,0.25)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.5)' }
                            : { background: 'rgba(176,58,46,0.2)', color: '#E07060', border: '1px solid rgba(176,58,46,0.4)' }}>
                          🥩 Viande
                        </button>
                        <button onClick={sauvegarderCat} className="text-xs px-2 py-1 rounded" style={{ background: '#6B8E4E', color: '#fff' }}>✓</button>
                        <button onClick={() => setEditCat(null)} className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#7A6A50' }}>✕</button>
                      </div>
                    ) : (
                      <span className="flex-1 text-sm font-medium" style={{ color: '#EDD98A' }}>{cat.nom}</span>
                    )}
                    {editCat?.id !== cat.id && (
                      <div className="flex gap-1">
                        <button onClick={() => setEditCat({ id: cat.id, nom: cat.nom, ordre: cat.ordre || 0, est_viande: false })}
                          className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#EDD98A' }}>✏️</button>
                        <button onClick={() => supprimerCat(cat.id)}
                          className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#B03A2E' }}>🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nouvelle catégorie */}
          <div className="flex gap-2 items-end mt-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: '#FFFFFF' }}>Nouvelle catégorie (Canard, Porc, Bœuf…)</label>
              <input placeholder="Nom"
                value={nouvelleCat.nom}
                onChange={e => setNouvelleCat(p => ({ ...p, nom: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && ajouterCategorie()}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>
            <div style={{ width: '80px' }}>
              <label className="block text-xs mb-1" style={{ color: '#FFFFFF' }}>Ordre</label>
              <input type="number" placeholder="1"
                value={nouvelleCat.ordre}
                onChange={e => setNouvelleCat(p => ({ ...p, ordre: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none text-center" style={inputStyle} />
            </div>
            <button type="button"
              onClick={() => setNouvelleCat(p => ({ ...p, est_viande: !p.est_viande }))}
              className="text-xs px-2 py-2 rounded-lg font-medium shrink-0"
              style={nouvelleCat.est_viande
                ? { background: 'rgba(107,142,78,0.25)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.5)' }
                : { background: 'rgba(176,58,46,0.2)', color: '#E07060', border: '1px solid rgba(176,58,46,0.4)' }}>
              🥩 Viande
            </button>
            <button onClick={ajouterCategorie}
              className="px-4 py-2 rounded-lg text-sm font-medium shrink-0" style={{ background: '#F0B429', color: '#1E1912' }}>
              + Catégorie
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ ONGLET 2 : PROFILS DE PRÉPARATION ═══════════ */}
      {onglet === 'profils' && (
        <div className="flex flex-col gap-3 max-w-2xl">
          <p className="text-xs mb-2" style={{ color: '#7A6A50' }}>
            Un profil regroupe les frais variables d'un type de préparation (sel, épices, traitement…). Chaque morceau y est associé.
          </p>

          {profilsSorted.map(profil => {
            const frais = (fraisParProfil[profil.id] || []).sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
            const isOpen = profilOuvert.has(profil.id)
            const nbMorceaux = morceaux.filter(m => m.profil_id === profil.id).length
            const totalFixe = frais.filter(f => f.type_calcul !== 'poids').reduce((s, f) => s + parseFloat(f.montant || 0) * (parseInt(f.quantite) || 1), 0)
            const nbFraisPoids = frais.filter(f => f.type_calcul === 'poids').length

            return (
              <div key={profil.id} className="rounded-xl border" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
                <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => toggle(setProfilOuvert, profil.id)}>
                  {editProfil?.id === profil.id ? (
                    <div className="flex-1 flex gap-2" onClick={e => e.stopPropagation()}>
                      <input value={editProfil.nom} onChange={e => setEditProfil(p => ({ ...p, nom: e.target.value }))}
                        className="flex-1 px-2 py-1 rounded border text-sm outline-none" style={inputStyle} />
                      <button onClick={sauvegarderProfil} className="text-xs px-2 py-1 rounded" style={{ background: '#6B8E4E', color: '#fff' }}>✓</button>
                      <button onClick={() => setEditProfil(null)} className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#7A6A50' }}>✕</button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: '#EDD98A' }}>🔥 {profil.nom}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1E1912', color: '#7A6A50' }}>
                        {frais.length} poste{frais.length !== 1 ? 's' : ''} · {totalFixe.toFixed(2)} €/pièce{nbFraisPoids > 0 ? ' +var.' : ''} · {nbMorceaux} morceau{nbMorceaux !== 1 ? 'x' : ''}
                      </span>
                    </div>
                  )}
                  {editProfil?.id !== profil.id && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setEditProfil({ id: profil.id, nom: profil.nom })}
                        className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#EDD98A' }}>✏️</button>
                      <button onClick={() => supprimerProfil(profil.id)}
                        className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#B03A2E' }}>🗑️</button>
                    </div>
                  )}
                  <span style={{ color: '#7A6A50', fontSize: '0.7rem' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div className="border-t px-3 pb-3" style={{ borderColor: '#4A3820' }}>
                    <div className="flex flex-col gap-2 mt-3">
                      {frais.length === 0 && (
                        <p className="text-xs" style={{ color: '#7A6A50' }}>Aucun frais. Ajoutez-en ci-dessous.</p>
                      )}
                      {frais.map(f => (
                        <div key={f.id} className="flex items-center gap-2">
                          {editFrais[f.id] ? (
                            <>
                              <input value={editFrais[f.id].label}
                                onChange={e => setEditFrais(p => ({ ...p, [f.id]: { ...p[f.id], label: e.target.value } }))}
                                className="flex-1 px-2 py-1 rounded border text-xs outline-none" style={inputStyle} />
                              <input type="number" step="0.01" value={editFrais[f.id].montant}
                                onChange={e => setEditFrais(p => ({ ...p, [f.id]: { ...p[f.id], montant: e.target.value } }))}
                                className="w-16 px-2 py-1 rounded border text-xs outline-none text-right" style={inputStyle} />
                              <div className="flex items-center gap-1">
                                <span className="text-xs shrink-0" style={{ color: '#7A6A50' }}>×</span>
                                <input type="number" min="1" value={editFrais[f.id].quantite || '1'}
                                  onChange={e => setEditFrais(p => ({ ...p, [f.id]: { ...p[f.id], quantite: e.target.value } }))}
                                  className="w-10 px-1 py-1 rounded border text-xs outline-none text-center" style={inputStyle} />
                              </div>
                              <select value={editFrais[f.id].type_calcul || 'fixe'}
                                onChange={e => setEditFrais(p => ({ ...p, [f.id]: { ...p[f.id], type_calcul: e.target.value } }))}
                                className="px-1 py-1 rounded border text-xs outline-none" style={inputStyle}>
                                <option value="fixe">€/pièce</option>
                                <option value="poids">€/kg</option>
                              </select>
                              <button onClick={() => sauvegarderFrais(f.id)} className="text-xs px-2 py-1 rounded" style={{ background: '#6B8E4E', color: '#fff' }}>✓</button>
                              <button onClick={() => setEditFrais(p => { const n = { ...p }; delete n[f.id]; return n })} className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#7A6A50' }}>✕</button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-xs" style={{ color: '#FFFFFF' }}>{f.label}</span>
                              <span className="text-xs font-medium" style={{ color: '#F0B429' }}>
                                {(parseInt(f.quantite) || 1) > 1
                                  ? <>{parseFloat(f.montant).toFixed(2)} × {parseInt(f.quantite)} = {(parseFloat(f.montant) * parseInt(f.quantite)).toFixed(2)} {f.type_calcul === 'poids' ? '€/kg' : '€/pièce'}</>
                                  : <>{parseFloat(f.montant).toFixed(2)} {f.type_calcul === 'poids' ? '€/kg' : '€/pièce'}</>
                                }
                              </span>
                              <button onClick={() => setEditFrais(p => ({ ...p, [f.id]: { label: f.label, montant: f.montant, quantite: String(f.quantite || 1), type_calcul: f.type_calcul || 'fixe' } }))}
                                className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#3A2E1A', color: '#EDD98A' }}>✏️</button>
                              <button onClick={() => supprimerFrais(f.id, profil.id)}
                                className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#3A2E1A', color: '#B03A2E' }}>✕</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    {frais.length > 0 && (
                      <div className="flex justify-between items-center pt-2 mt-1 border-t" style={{ borderColor: '#4A3820' }}>
                        <span className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>Total frais variables</span>
                        <span className="text-sm font-bold" style={{ color: '#F0B429' }}>
                          {totalFixe.toFixed(2)} €/pièce{nbFraisPoids > 0 ? ` + ${nbFraisPoids} frais €/kg` : ''}
                        </span>
                      </div>
                    )}

                    {/* Ajouter un frais */}
                    <div className="flex gap-2 mt-3 pt-2 border-t flex-wrap" style={{ borderColor: '#4A3820' }}>
                      <input placeholder="Libellé (ex : Sel de salaison)"
                        value={fraisForm[profil.id]?.label || ''}
                        onChange={e => setFraisForm(p => ({ ...p, [profil.id]: { ...p[profil.id], label: e.target.value } }))}
                        className="flex-1 px-2 py-1.5 rounded border text-xs outline-none" style={inputStyle} />
                      <input type="number" step="0.01" placeholder="€ unit."
                        value={fraisForm[profil.id]?.montant || ''}
                        onChange={e => setFraisForm(p => ({ ...p, [profil.id]: { ...p[profil.id], montant: e.target.value } }))}
                        className="w-16 px-2 py-1.5 rounded border text-xs outline-none text-right" style={inputStyle} />
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={{ color: '#7A6A50' }}>×</span>
                        <input type="number" min="1" placeholder="1"
                          value={fraisForm[profil.id]?.quantite || ''}
                          onChange={e => setFraisForm(p => ({ ...p, [profil.id]: { ...p[profil.id], quantite: e.target.value } }))}
                          className="w-10 px-1 py-1.5 rounded border text-xs outline-none text-center" style={inputStyle} />
                      </div>
                      <select value={fraisForm[profil.id]?.type_calcul || 'fixe'}
                        onChange={e => setFraisForm(p => ({ ...p, [profil.id]: { ...p[profil.id], type_calcul: e.target.value } }))}
                        className="px-1 py-1.5 rounded border text-xs outline-none" style={inputStyle}>
                        <option value="fixe">€/pièce</option>
                        <option value="poids">€/kg</option>
                      </select>
                      <button onClick={() => ajouterFrais(profil.id)}
                        className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: '#F0B429', color: '#1E1912' }}>
                        + Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Nouveau profil */}
          <div className="flex gap-2 mt-2">
            <input placeholder="Nom du profil (ex : Viande saumurée au miel…)"
              value={nouveauProfil.nom}
              onChange={e => setNouveauProfil({ nom: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && ajouterProfil()}
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            <button onClick={ajouterProfil}
              className="px-4 py-2 rounded-lg text-sm font-medium shrink-0" style={{ background: '#F0B429', color: '#1E1912' }}>
              + Profil
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReferentiel
