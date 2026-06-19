import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../supabase'

function Ligne({ label, valeur, color, bold }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm" style={{ color: '#FFFFFF' }}>{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold' : ''}`} style={{ color: color || '#EDD98A' }}>
        {valeur}
      </span>
    </div>
  )
}

function AdminCalculateur() {
  const [config, setConfig] = useState({})
  const [totalTourneeConfig, setTotalTourneeConfig] = useState(0)
  const [categories, setCategories] = useState([])
  const [profils, setProfils] = useState([])
  const [fraisParProfil, setFraisParProfil] = useState({})
  const [morceaux, setMorceaux] = useState([])
  const [avgPrixKgMap, setAvgPrixKgMap] = useState({})
  const [avgPoidsMap, setAvgPoidsMap] = useState({})
  const [nbObsMap, setNbObsMap] = useState({})
  const [chargement, setChargement] = useState(true)

  // Sélection
  const [selectedId, setSelectedId] = useState('')
  const [modeAmi, setModeAmi] = useState(false)
  const [nbPieces, setNbPieces] = useState(5)
  const [margeOverride, setMargeOverride] = useState('')

  // Overrides prix/kg et poids
  const [prixKgOverride, setPrixKgOverride] = useState('')
  const [poidsOverride, setPoidsOverride] = useState('')

  useEffect(() => { chargerTout() }, [])

  async function chargerTout() {
    const [
      { data: cfg },
      { data: cats },
      { data: profs },
      { data: frais },
      { data: morcs },
      { data: obs },
    ] = await Promise.all([
      supabase.from('config_calculateur').select('*'),
      supabase.from('categories').select('*').order('ordre', { nullsFirst: false }).order('nom'),
      supabase.from('profils_preparation').select('*').order('nom'),
      supabase.from('frais_variables_profil').select('*'),
      supabase.from('morceaux').select('*').eq('actif', true).order('nom'),
      supabase.from('observations_marche').select('morceau_id, prix_kg, poids_g'),
    ])

    const cfgItems = cfg || []
    const cfgMap = {}
    cfgItems.forEach(c => { cfgMap[c.cle] = parseFloat(c.valeur) || 0 })
    setConfig(cfgMap)
    setTotalTourneeConfig(cfgItems.filter(c => c.type === 'tournee').reduce((s, c) => s + parseFloat(c.valeur || 0), 0))
    if (cfgMap['nb_pieces_tournee']) setNbPieces(Math.round(cfgMap['nb_pieces_tournee']))

    setCategories(cats || [])
    setProfils(profs || [])

    const fp = {}
    ;(frais || []).forEach(f => { fp[f.profil_id] = [...(fp[f.profil_id] || []), f] })
    setFraisParProfil(fp)

    setMorceaux(morcs || [])

    const prixSums = {}, prixCounts = {}, poidsSums = {}, poidsCounts = {}
    ;(obs || []).forEach(o => {
      if (o.prix_kg) {
        prixSums[o.morceau_id] = (prixSums[o.morceau_id] || 0) + parseFloat(o.prix_kg)
        prixCounts[o.morceau_id] = (prixCounts[o.morceau_id] || 0) + 1
      }
      if (o.poids_g) {
        poidsSums[o.morceau_id] = (poidsSums[o.morceau_id] || 0) + parseInt(o.poids_g)
        poidsCounts[o.morceau_id] = (poidsCounts[o.morceau_id] || 0) + 1
      }
    })
    const avgPrix = {}, avgPoids = {}, nbObs = {}
    Object.keys(prixSums).forEach(id => { avgPrix[id] = prixSums[id] / prixCounts[id]; nbObs[id] = prixCounts[id] })
    Object.keys(poidsSums).forEach(id => { avgPoids[id] = poidsSums[id] / poidsCounts[id] })
    setAvgPrixKgMap(avgPrix)
    setAvgPoidsMap(avgPoids)
    setNbObsMap(nbObs)

    setChargement(false)
  }

  // ── Calcul ─────────────────────────────────────────────────
  const morceau = morceaux.find(m => m.id === selectedId)
  const fraisVariables = fraisParProfil[morceau?.profil_id] || []

  const calcul = useMemo(() => {
    if (!morceau) return null

    const cfg = (k) => config[k] || 0
    const fraisFixesPiece = nbPieces > 0 ? totalTourneeConfig / nbPieces : 0

    const avgPrix = avgPrixKgMap[selectedId] || 0
    const avgPoids = avgPoidsMap[selectedId] || 0
    const prixKgEffectif = prixKgOverride !== '' ? parseFloat(prixKgOverride) : avgPrix
    const poidsEffectif = poidsOverride !== '' ? parseFloat(poidsOverride) : avgPoids
    const coutMatiere = (prixKgEffectif * poidsEffectif) / 1000

    const totalVariables = fraisVariables.reduce((s, f) => {
      const montant = parseFloat(f.montant || 0)
      return s + (f.type_calcul === 'poids' ? (poidsEffectif / 1000) * montant : montant)
    }, 0)

    const tauxH = modeAmi ? cfg('taux_horaire_ami') : cfg('taux_horaire')
    const marge = margeOverride !== '' ? parseFloat(margeOverride) : cfg('marge_defaut')
    const coutMain = ((morceau.temps_prep_min || 0) / 60) * tauxH

    const prixRevient = coutMatiere + fraisFixesPiece + totalVariables + coutMain
    const prixConseille = Math.ceil(prixRevient * (1 + (marge || 0) / 100))

    return {
      coutMatiere,
      fraisFixesPiece,
      totalFixesTournee: totalTourneeConfig,
      totalVariables,
      coutMain,
      tauxH,
      marge,
      prixRevient,
      prixConseille,
      avgPrix,
      avgPoids,
      prixKgEffectif,
      poidsEffectif,
    }
  }, [morceau, selectedId, modeAmi, nbPieces, margeOverride, prixKgOverride, poidsOverride,
      fraisVariables, avgPrixKgMap, avgPoidsMap, config, totalTourneeConfig])

  function selectionnerMorceau(id) {
    setSelectedId(id)
    setPrixKgOverride('')
    setPoidsOverride('')
  }

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  // Grouper les morceaux par catégorie animal
  const morceauxParCat = {}
  morceaux.forEach(m => {
    const catNom = categories.find(c => c.id === m.categorie_id)?.nom || 'Sans catégorie'
    if (!morceauxParCat[catNom]) morceauxParCat[catNom] = []
    morceauxParCat[catNom].push(m)
  })

  const profilNom = profils.find(p => p.id === morceau?.profil_id)?.nom

  return (
    <div>
      <h2 className="text-lg font-medium mb-1" style={{ color: '#EDD98A' }}>🧮 Calculatrice de prix</h2>
      <p className="text-sm mb-5" style={{ color: '#FFFFFF' }}>Calcul instantané du prix de revient et du prix de vente conseillé.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">

        {/* ── Paramètres ── */}
        <div className="flex flex-col gap-4">

          {/* Mode */}
          <div className="rounded-xl border p-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: '#F0B429' }}>Paramètres</p>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setModeAmi(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={!modeAmi ? { background: '#F0B429', color: '#1E1912' } : { background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                Prix normal
              </button>
              <button onClick={() => setModeAmi(true)}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={modeAmi ? { background: '#6B8E4E', color: '#fff' } : { background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                Prix ami 🤝
              </button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: '#FFFFFF' }}>Pièces dans la tournée</label>
                <input type="number" min="1" value={nbPieces} onChange={e => setNbPieces(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: '#FFFFFF' }}>Marge (%)</label>
                <input type="number" min="0" max="200" placeholder={config.marge_defaut || '30'}
                  value={margeOverride}
                  onChange={e => setMargeOverride(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Sélecteur produit */}
          <div className="rounded-xl border p-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#F0B429' }}>Morceau</label>
            <select value={selectedId} onChange={e => selectionnerMorceau(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
              <option value="">— Sélectionner un morceau —</option>
              {Object.entries(morceauxParCat).map(([catNom, items]) => (
                <optgroup key={catNom} label={catNom}>
                  {items.map(m => (
                    <option key={m.id} value={m.id}>{m.nom}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {morceau && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {profilNom && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
                    🔥 {profilNom}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1E1912', color: '#7A6A50' }}>
                  ⏱ {morceau.temps_prep_min || 0} min
                </span>
                {nbObsMap[selectedId] && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1E1912', color: '#6B8E4E' }}>
                    {nbObsMap[selectedId]} observation{nbObsMap[selectedId] > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Overrides matière */}
          {morceau && (
            <div className="rounded-xl border p-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: '#F0B429' }}>Matière première</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs mb-1" style={{ color: '#FFFFFF' }}>
                    Prix/kg
                    {calcul?.avgPrix > 0 && <span className="ml-1" style={{ color: '#7A6A50' }}>(moy : {calcul.avgPrix.toFixed(2)} €)</span>}
                  </label>
                  <input type="number" step="0.01" placeholder={calcul?.avgPrix.toFixed(2) || '0.00'}
                    value={prixKgOverride}
                    onChange={e => setPrixKgOverride(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs mb-1" style={{ color: '#FFFFFF' }}>
                    Poids (g)
                    {calcul?.avgPoids > 0 && <span className="ml-1" style={{ color: '#7A6A50' }}>(moy : {Math.round(calcul.avgPoids)}g)</span>}
                  </label>
                  <input type="number" placeholder={Math.round(calcul?.avgPoids || 0)}
                    value={poidsOverride}
                    onChange={e => setPoidsOverride(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
                </div>
              </div>
              {!avgPrixKgMap[selectedId] && !avgPoidsMap[selectedId] && (
                <p className="text-xs mt-2" style={{ color: '#B03A2E' }}>
                  ⚠ Aucune observation de marché. Entrez les valeurs manuellement ou ajoutez des relevés dans le Référentiel.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Résultat ── */}
        <div>
          {!morceau ? (
            <div className="rounded-xl border p-8 text-center" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
              <p className="text-3xl mb-3">🧮</p>
              <p className="text-sm" style={{ color: '#7A6A50' }}>Sélectionnez un morceau pour voir le calcul.</p>
            </div>
          ) : calcul ? (
            <div className="rounded-xl border p-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#F0B429' }}>{morceau.nom}</p>
              {modeAmi && <p className="text-xs mb-3 px-2 py-1 rounded" style={{ background: 'rgba(107,142,78,0.15)', color: '#6B8E4E' }}>🤝 Mode prix ami — taux horaire {calcul.tauxH} €/h</p>}

              {/* Matière */}
              <div className="mb-3 pb-3 border-b" style={{ borderColor: '#4A3820' }}>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#7A6A50' }}>Matière première</p>
                <Ligne label="Prix/kg × poids" valeur={`${calcul.prixKgEffectif.toFixed(2)} € × ${Math.round(calcul.poidsEffectif)}g`} />
                <Ligne label="Coût matière" valeur={`${calcul.coutMatiere.toFixed(2)} €`} color="#F0B429" bold />
              </div>

              {/* Frais fixes */}
              <div className="mb-3 pb-3 border-b" style={{ borderColor: '#4A3820' }}>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#7A6A50' }}>Frais fixes de tournée</p>
                <Ligne label={`${calcul.totalFixesTournee.toFixed(2)} € ÷ ${nbPieces} pièce${nbPieces > 1 ? 's' : ''}`} valeur={`${calcul.fraisFixesPiece.toFixed(2)} €`} />
              </div>

              {/* Frais variables profil */}
              {fraisVariables.length > 0 && (
                <div className="mb-3 pb-3 border-b" style={{ borderColor: '#4A3820' }}>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#7A6A50' }}>
                    Frais variables {profilNom ? `— ${profilNom}` : ''}
                  </p>
                  {fraisVariables.map(f => {
                    const montant = parseFloat(f.montant || 0)
                    const cout = f.type_calcul === 'poids' ? (calcul.poidsEffectif / 1000) * montant : montant
                    const detail = f.type_calcul === 'poids'
                      ? `${Math.round(calcul.poidsEffectif)}g × ${montant.toFixed(2)} €/kg`
                      : 'fixe'
                    return (
                      <div key={f.id} className="flex justify-between items-center py-0.5">
                        <span className="text-sm" style={{ color: '#FFFFFF' }}>{f.label}</span>
                        <div className="text-right">
                          <span className="text-xs mr-2" style={{ color: '#7A6A50' }}>{detail}</span>
                          <span className="text-sm" style={{ color: '#EDD98A' }}>{cout.toFixed(2)} €</span>
                        </div>
                      </div>
                    )
                  })}
                  <Ligne label="Total" valeur={`${calcul.totalVariables.toFixed(2)} €`} bold />
                </div>
              )}

              {!profilNom && (
                <div className="mb-3 pb-3 border-b" style={{ borderColor: '#4A3820' }}>
                  <p className="text-xs" style={{ color: '#7A6A50' }}>⚠️ Aucun profil de préparation assigné à ce morceau. Les frais variables ne sont pas inclus.</p>
                </div>
              )}

              {/* Main d'oeuvre */}
              <div className="mb-3 pb-3 border-b" style={{ borderColor: '#4A3820' }}>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#7A6A50' }}>Main d'œuvre</p>
                <Ligne label={`${morceau.temps_prep_min || 0} min × ${calcul.tauxH} €/h`} valeur={`${calcul.coutMain.toFixed(2)} €`} />
              </div>

              {/* Totaux */}
              <div className="rounded-lg p-3 mt-2" style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>Prix de revient</span>
                  <span className="text-base font-semibold" style={{ color: '#EDD98A' }}>{calcul.prixRevient.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center mb-3 text-xs" style={{ color: '#7A6A50' }}>
                  <span>Marge {calcul.marge}% appliquée</span>
                  <span>+ {(calcul.prixConseille - calcul.prixRevient).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: '#4A3820' }}>
                  <span className="text-base font-semibold" style={{ color: '#FFFFFF' }}>Prix conseillé</span>
                  <span className="text-2xl font-bold" style={{ color: '#F0B429' }}>{calcul.prixConseille} €</span>
                </div>
                </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AdminCalculateur
