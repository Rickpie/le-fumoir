import { useNavigate } from 'react-router-dom'
import { usePanier } from '../context/PanierContext'

function Panier() {
  const { items, retirerDuPanier, modifierQuantite, total } = usePanier()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: '#FFFFFF' }}>
        <p className="text-4xl mb-3">🛍️</p>
        <p className="text-sm mb-4">Votre panier est vide.</p>
        <button onClick={() => navigate('/boutique')}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#F0B429', color: '#1E1912' }}>
          Voir la boutique
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#EDD98A' }}>Votre panier</h1>

      <div className="flex flex-col gap-3 mb-6">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border p-4 flex gap-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            {item.photo_url && (
              <img src={item.photo_url} alt={item.nom} className="w-20 h-20 object-cover rounded-lg" />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-sm" style={{ color: '#EDD98A' }}>{item.nom}</h3>
              <p className="text-xs mt-1" style={{ color: '#FFFFFF' }}>
                {item.mode_realisation === 'soi-meme' ? 'À faire soi-même' : 'Réalisé par l\'artisan'}
              </p>

              {item.epices.length > 0 && (
                <p className="text-xs mt-1" style={{ color: '#FFFFFF' }}>
                  Épices : {item.epices.map(e => e.nom).join(', ')}
                </p>
              )}

              {item.inserts.length > 0 && (
                <p className="text-xs mt-1" style={{ color: '#FFFFFF' }}>
                  Inserts : {item.inserts.map(i => i.nom).join(', ')}
                </p>
              )}

              <div className="flex items-center gap-3 mt-3">
                <button onClick={() => modifierQuantite(item.id, item.quantite - 1)}
                  className="w-7 h-7 rounded-lg font-medium text-sm" style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820' }}>−</button>
                <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>{item.quantite}</span>
                <button onClick={() => modifierQuantite(item.id, item.quantite + 1)}
                  className="w-7 h-7 rounded-lg font-medium text-sm" style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820' }}>+</button>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between">
              <span className="text-sm font-semibold" style={{ color: '#F0B429' }}>
                {(item.prix_unitaire * item.quantite).toFixed(2)} €
              </span>
              <button onClick={() => retirerDuPanier(item.id)}
                className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl mb-4" style={{ background: '#2C2518', border: '1px solid #4A3820' }}>
        <span className="text-lg font-semibold" style={{ color: '#EDD98A' }}>Total : {total.toFixed(2)} €</span>
        <button className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#F0B429', color: '#1E1912' }}>
          Passer la commande
        </button>
      </div>
    </div>
  )
}

export default Panier
