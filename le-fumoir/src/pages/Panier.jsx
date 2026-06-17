import { useNavigate } from 'react-router-dom'
import { usePanier } from '../context/PanierContext'

function Panier() {
  const { items, retirerDuPanier, modifierQuantite, total } = usePanier()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: '#7a4010' }}>
        <p className="text-4xl mb-3">🛍️</p>
        <p className="text-sm mb-4">Votre panier est vide.</p>
        <button onClick={() => navigate('/boutique')}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
          Voir la boutique
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#3d1e06' }}>Votre panier</h1>

      <div className="flex flex-col gap-3 mb-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border p-4 flex gap-4" style={{ borderColor: '#d6bfa0' }}>
            {item.photo_url && (
              <img src={item.photo_url} alt={item.nom} className="w-20 h-20 object-cover rounded-lg" />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-sm" style={{ color: '#3d1e06' }}>{item.nom}</h3>
              <p className="text-xs mt-1" style={{ color: '#a07050' }}>
                {item.mode_realisation === 'soi-meme' ? 'À faire soi-même' : 'Réalisé par l\'artisan'}
              </p>

              {item.epices.length > 0 && (
                <p className="text-xs mt-1" style={{ color: '#7a4010' }}>
                  Épices : {item.epices.map(e => e.nom).join(', ')}
                </p>
              )}

              {item.inserts.length > 0 && (
                <p className="text-xs mt-1" style={{ color: '#7a4010' }}>
                  Inserts : {item.inserts.map(i => i.nom).join(', ')}
                </p>
              )}

              <div className="flex items-center gap-3 mt-3">
                <button onClick={() => modifierQuantite(item.id, item.quantite - 1)}
                  className="w-7 h-7 rounded-lg font-medium text-sm" style={{ background: '#f5e2c0', color: '#7a4010' }}>−</button>
                <span className="text-sm font-medium" style={{ color: '#3d1e06' }}>{item.quantite}</span>
                <button onClick={() => modifierQuantite(item.id, item.quantite + 1)}
                  className="w-7 h-7 rounded-lg font-medium text-sm" style={{ background: '#f5e2c0', color: '#7a4010' }}>+</button>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between">
              <span className="text-sm font-medium" style={{ color: '#b06010' }}>
                {(item.prix_unitaire * item.quantite).toFixed(2)} €
              </span>
              <button onClick={() => retirerDuPanier(item.id)}
                className="text-xs px-2 py-1 rounded-md" style={{ background: '#fde8e8', color: '#c0392b' }}>
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl mb-4" style={{ background: '#f5e2c0' }}>
        <span className="text-lg font-medium" style={{ color: '#3d1e06' }}>Total : {total.toFixed(2)} €</span>
        <button className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
          Passer la commande
        </button>
      </div>
    </div>
  )
}

export default Panier