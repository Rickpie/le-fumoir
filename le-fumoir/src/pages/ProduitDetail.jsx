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

  const [modeRealisation, setModeRealisation] = useState('artisan')
  const [epicesChoisies, setEpicesChoisies] = useState([])
  const [insertsChoisis, setInsertsChoisis] = useState([])
  const [quantite, setQuantite] = useState(1)
  const [ajoute, setAjoute] = useState(false)

  useEffect(() => {
    chargerProduit()
  }, [id])

  async function chargerProduit() {
    const { data: p } = await supabase.from('produits').select('*, categories(nom)').eq('id', id).single()
    const { data: pe } = await supabase.from('produit_epices').select('epice_id, epices:epice_id (id, nom, prix_supplement, visible)').eq('produit_id', id)
    const { data: pi } = await supabase.from('produit_inserts').select('insert_id, inserts:insert_id (id, nom, prix_supplement, visible)').eq('produit_id', id)

    setProduit(p)
    setEpices((pe || []).map(x => x.epices).filter(e => e?.visible))
    setInserts((pi || []).map(x => x.inserts).filter(i => i?.visible))
    setChargement(false)
  }

  function toggleEpice(epice) {
    setEpicesChoisies(prev =>
      prev.find(e => e.id === epice.id) ? prev.filter(e => e.id !== epice.id) : [...prev, epice]
    )
  }

  function toggleInsert(insert) {
    setInsertsChoisis(prev =>
      prev.find(i => i.id === insert.id) ? prev.filter(i => i.id !== insert.id) : [...prev, insert]
    )
  }

  const prixSupplements = [...epicesChoisies, ...insertsChoisis].reduce((sum, x) => sum + (parseFloat(x.prix_supplement) || 0), 0)
  const prixUnitaire = produit ? parseFloat(produit.prix) + prixSupplements : 0
  const prixTotal = prixUnitaire * quantite

  function handleAjouterPanier() {
    ajouterAuPanier({
      id: `${produit.id}_${Date.now()}`,
      produit_id: produit.id,
      nom: produit.nom,
      photo_url: produit.photo_url,
      prix_unitaire: prixUnitaire,
      quantite,
      mode_realisation: modeRealisation,
      epices: epicesChoisies,
      inserts: insertsChoisis,
    })
    setAjoute(true)
    setTimeout(() => navigate('/panier'), 800)
  }

  if (chargement) return (
    <div className="flex items-center justify-center h-40">
      <p style={{ color: '#7a4010' }}>Chargement...</p>
    </div>
  )

  if (!produit) return (
    <div className="text-center py-16" style={{ color: '#7a4010' }}>
      <p className="text-sm">Produit introuvable.</p>
    </div>
  )

  const labelStyle = { color: '#7a4010' }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/boutique')}
        className="text-sm mb-6 flex items-center gap-1"
        style={{ color: '#7a4010' }}>
        ← Retour à la boutique
      </button>

      <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8" style={{ borderColor: '#d6bfa0' }}>
        {produit.photo_url && (
          <img src={produit.photo_url} alt={produit.nom}
            className="w-full h-56 object-cover rounded-xl mb-6" />
        )}

        {produit.categories?.nom && (
          <span className="inline-block text-xs mb-3 px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#f5e2c0', color: '#7a4010' }}>
            {produit.categories.nom}
          </span>
        )}

        <h1 className="text-2xl font-medium mb-2" style={{ color: '#3d1e06' }}>{produit.nom}</h1>
        {produit.description && (
          <p className="text-sm mb-6" style={{ color: '#7a4010' }}>{produit.description}</p>
        )}

        <div className="border-t mb-6" style={{ borderColor: '#d6bfa0' }} />

        {/* Mode de réalisation */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: '#3d1e06' }}>Mode de réalisation</label>
          <div className="flex gap-2">
            <button onClick={() => setModeRealisation('soi-meme')}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-left"
              style={modeRealisation === 'soi-meme' ? { background: '#5a2e0e', color: '#fdf0d0' } : { background: '#f5e2c0', color: '#7a4010' }}>
              À faire soi-même
            </button>
            <button onClick={() => setModeRealisation('artisan')}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-left"
              style={modeRealisation === 'artisan' ? { background: '#5a2e0e', color: '#fdf0d0' } : { background: '#f5e2c0', color: '#7a4010' }}>
              Réalisé par l'artisan (délai 4-8 sem.)
            </button>
          </div>
        </div>

        {/* Épices */}
        {epices.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#3d1e06' }}>Épices (optionnel)</label>
            <div className="flex flex-wrap gap-2">
              {epices.map(ep => (
                <button key={ep.id} onClick={() => toggleEpice(ep)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={epicesChoisies.find(e => e.id === ep.id) ? { background: '#5a2e0e', color: '#fdf0d0' } : { background: '#f5e2c0', color: '#7a4010' }}>
                  {ep.nom} (+{ep.prix_supplement}€)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inserts */}
        {inserts.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#3d1e06' }}>Inserts (optionnel)</label>
            <div className="flex flex-wrap gap-2">
              {inserts.map(ins => (
                <button key={ins.id} onClick={() => toggleInsert(ins)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={insertsChoisis.find(i => i.id === ins.id) ? { background: '#5a2e0e', color: '#fdf0d0' } : { background: '#f5e2c0', color: '#7a4010' }}>
                  {ins.nom} (+{ins.prix_supplement}€)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantité */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: '#3d1e06' }}>Quantité</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantite(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg font-medium" style={{ background: '#f5e2c0', color: '#7a4010' }}>−</button>
            <span className="text-sm font-medium" style={{ color: '#3d1e06' }}>{quantite}</span>
            <button onClick={() => setQuantite(q => q + 1)}
              className="w-8 h-8 rounded-lg font-medium" style={{ background: '#f5e2c0', color: '#7a4010' }}>+</button>
          </div>
        </div>

        <div className="border-t mb-6" style={{ borderColor: '#d6bfa0' }} />

        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#f5e2c0' }}>
          <span className="text-lg font-medium" style={{ color: '#3d1e06' }}>{prixTotal.toFixed(2)} €</span>
          <button onClick={handleAjouterPanier}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: ajoute ? '#3B6D11' : '#5a2e0e', color: '#fdf0d0' }}>
            {ajoute ? '✓ Ajouté au panier' : 'Ajouter au panier'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProduitDetail