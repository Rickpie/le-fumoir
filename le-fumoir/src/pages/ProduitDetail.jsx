import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { usePanier } from '../context/PanierContext'

function ProduitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ajouterAuPanier } = usePanier()

  const [produit, setProduit] = useState(null)
  const [epices, setEpices] = useState([])
  const [inserts, setInserts] = useState([])
  const [chargement, setChargement] = useState(true)

  const [modeSechage, setModeSechage] = useState('soi-meme')
  const [epicesSlots, setEpicesSlots] = useState([''])
  const [insertsChoisis, setInsertsChoisis] = useState([])
  const [quantite, setQuantite] = useState(1)
  const [ajoute, setAjoute] = useState(false)

  useEffect(() => {
    chargerProduit()
  }, [id])

  async function chargerProduit() {
    const { data: p } = await supabase
      .from('produits')
      .select('*, categories(nom, delai_preparation, cout_preparation)')
      .eq('id', id)
      .single()
    const { data: pe } = await supabase
      .from('produit_epices')
      .select('epice_id, epices:epice_id (id, nom, prix_supplement, visible)')
      .eq('produit_id', id)
    const { data: pi } = await supabase
      .from('produit_inserts')
      .select('insert_id, inserts:insert_id (id, nom, prix_supplement, visible)')
      .eq('produit_id', id)

    setProduit(p)
    setEpices((pe || []).map(x => x.epices).filter(e => e?.visible))
    setInserts((pi || []).map(x => x.inserts).filter(i => i?.visible))
    setChargement(false)
  }

  function changerEpiceSlot(index, epiceId) {
    setEpicesSlots(prev => prev.map((s, i) => i === index ? epiceId : s))
  }

  function ajouterSlotEpice() {
    setEpicesSlots(prev => [...prev, ''])
  }

  function retirerSlotEpice(index) {
    setEpicesSlots(prev => {
      if (prev.length === 1) return ['']
      return prev.filter((_, i) => i !== index)
    })
  }

  function toggleInsert(insert) {
    setInsertsChoisis(prev =>
      prev.find(i => i.id === insert.id) ? prev.filter(i => i.id !== insert.id) : [...prev, insert]
    )
  }

  const epicesSelectionnees = epicesSlots.filter(s => s !== '')
  const nbEpices = epicesSelectionnees.length
  const supplementEpices = Math.max(0, nbEpices - 1) * 0.20

  const supplementInserts = insertsChoisis.reduce((sum, x) => sum + (parseFloat(x.prix_supplement) || 0), 0)

  const coutPreparation = modeSechage === 'artisan'
    ? parseFloat(produit?.categories?.cout_preparation || 0)
    : 0

  const prixBase = produit ? parseFloat(produit.prix) : 0
  const prixUnitaire = prixBase + supplementEpices + supplementInserts + coutPreparation
  const prixTotal = prixUnitaire * quantite

  const delai = produit?.categories?.delai_preparation
  const coutPreparationCategorie = parseFloat(produit?.categories?.cout_preparation || 0)

  function handleAjouterPanier() {
    const epicesChoisies = epicesSelectionnees
      .map(id => epices.find(e => e.id === id))
      .filter(Boolean)

    ajouterAuPanier({
      id: `${produit.id}_${Date.now()}`,
      produit_id: produit.id,
      nom: produit.nom,
      photo_url: produit.photo_url,
      prix_unitaire: prixUnitaire,
      quantite,
      mode_sechage: modeSechage,
      epices: epicesChoisies,
      inserts: insertsChoisis,
    })
    setAjoute(true)
    setTimeout(() => navigate('/panier'), 800)
  }

  if (chargement) return (
    <div className="flex items-center justify-center h-40">
      <p style={{ color: '#FFFFFF' }}>Chargement...</p>
    </div>
  )

  if (!produit) return (
    <div className="text-center py-16" style={{ color: '#FFFFFF' }}>
      <p className="text-sm">Produit introuvable.</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/boutique')}
        className="text-sm mb-6 flex items-center gap-1"
        style={{ color: '#FFFFFF' }}>
        ← Retour à la boutique
      </button>

      <div className="rounded-2xl border p-6 sm:p-8" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
        {produit.photo_url && (
          <img src={produit.photo_url} alt={produit.nom}
            className="w-full h-56 object-cover rounded-xl mb-6" />
        )}

        {produit.categories?.nom && (
          <span className="inline-block text-xs mb-3 px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
            {produit.categories.nom}
          </span>
        )}

        <h1 className="text-2xl font-medium mb-2" style={{ color: '#EDD98A' }}>{produit.nom}</h1>
        {produit.description && (
          <p className="text-sm mb-6" style={{ color: '#FFFFFF' }}>{produit.description}</p>
        )}

        <div className="border-t mb-6" style={{ borderColor: '#4A3820' }} />

        {/* Mode de séchage */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: '#EDD98A' }}>Mode de séchage souhaité</label>
          <div className="flex flex-col gap-2">
            <button onClick={() => setModeSechage('soi-meme')}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left"
              style={modeSechage === 'soi-meme'
                ? { background: '#F0B429', color: '#1E1912' }
                : { background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
              À faire sécher soi-même
            </button>
            <button onClick={() => setModeSechage('artisan')}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left flex items-center justify-between"
              style={modeSechage === 'artisan'
                ? { background: '#F0B429', color: '#1E1912' }
                : { background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
              <span>
                Réalisé avant l'envoi
                {delai && <span className="ml-1 text-xs opacity-75">— délai : {delai}</span>}
              </span>
              {coutPreparationCategorie > 0 && (
                <span className="text-xs font-semibold ml-2"
                  style={{ color: modeSechage === 'artisan' ? '#1E1912' : '#F0B429' }}>
                  +{coutPreparationCategorie.toFixed(2)} €
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Épices */}
        {epices.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: '#EDD98A' }}>Épices</label>
              <span className="text-xs" style={{ color: '#FFFFFF' }}>
                1ère gratuite · +0,20€ par épice supplémentaire
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {epicesSlots.map((slotId, index) => {
                const nbRempliesAvant = epicesSlots.slice(0, index).filter(s => s !== '').length
                const estGratuit = nbRempliesAvant === 0
                return (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={slotId}
                      onChange={e => changerEpiceSlot(index, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ background: '#1E1912', borderColor: '#4A3820', color: slotId ? '#EDD98A' : '#FFFFFF' }}
                    >
                      <option value="">— Choisir une épice —</option>
                      {epices.map(ep => (
                        <option key={ep.id} value={ep.id}>{ep.nom}</option>
                      ))}
                    </select>

                    <span className="text-xs w-16 text-right shrink-0"
                      style={{ color: estGratuit ? '#6B8E4E' : '#F0B429' }}>
                      {estGratuit ? 'Gratuit' : '+0,20 €'}
                    </span>

                    <button onClick={() => retirerSlotEpice(index)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-sm shrink-0"
                      style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>

            <button onClick={ajouterSlotEpice}
              className="mt-2 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: '#1E1912', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
              + Ajouter une épice (+0,20€)
            </button>
          </div>
        )}

        {/* Inserts */}
        {inserts.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#EDD98A' }}>Inserts (optionnel)</label>
            <div className="flex flex-wrap gap-2">
              {inserts.map(ins => (
                <button key={ins.id} onClick={() => toggleInsert(ins)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={insertsChoisis.find(i => i.id === ins.id)
                    ? { background: '#F0B429', color: '#1E1912' }
                    : { background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                  {ins.nom} (+{ins.prix_supplement}€)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantité */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: '#EDD98A' }}>Quantité</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantite(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg font-medium"
              style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820' }}>−</button>
            <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>{quantite}</span>
            <button onClick={() => setQuantite(q => q + 1)}
              className="w-8 h-8 rounded-lg font-medium"
              style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820' }}>+</button>
          </div>
        </div>

        <div className="border-t mb-4" style={{ borderColor: '#4A3820' }} />

        {/* Détail prix */}
        {(supplementEpices > 0 || supplementInserts > 0 || coutPreparation > 0) && (
          <div className="mb-4 flex flex-col gap-1">
            <div className="flex justify-between text-xs" style={{ color: '#FFFFFF' }}>
              <span>Prix de base</span>
              <span>{prixBase.toFixed(2)} €</span>
            </div>
            {nbEpices > 1 && (
              <div className="flex justify-between text-xs" style={{ color: '#FFFFFF' }}>
                <span>{nbEpices - 1} épice{nbEpices > 2 ? 's' : ''} supplémentaire{nbEpices > 2 ? 's' : ''}</span>
                <span>+{supplementEpices.toFixed(2)} €</span>
              </div>
            )}
            {supplementInserts > 0 && (
              <div className="flex justify-between text-xs" style={{ color: '#FFFFFF' }}>
                <span>Inserts</span>
                <span>+{supplementInserts.toFixed(2)} €</span>
              </div>
            )}
            {coutPreparation > 0 && (
              <div className="flex justify-between text-xs" style={{ color: '#FFFFFF' }}>
                <span>Préparation avant envoi</span>
                <span>+{coutPreparation.toFixed(2)} €</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#FFFFFF' }}>
              {quantite > 1 ? `${quantite} × ${prixUnitaire.toFixed(2)} €` : 'Total'}
            </p>
            <span className="text-lg font-semibold" style={{ color: '#F0B429' }}>{prixTotal.toFixed(2)} €</span>
          </div>
          <button onClick={handleAjouterPanier}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: ajoute ? '#6B8E4E' : '#F0B429', color: '#1E1912' }}>
            {ajoute ? '✓ Ajouté au panier' : 'Ajouter au panier'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProduitDetail
