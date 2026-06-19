import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePanier } from '../context/PanierContext'

function PaiementSucces() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { viderPanier } = usePanier()

  useEffect(() => {
    if (!searchParams.get('session_id')) {
      navigate('/', { replace: true })
      return
    }
    viderPanier()
  }, [])

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-2xl font-semibold mb-3" style={{ color: '#EDD98A' }}>
        Paiement confirmé !
      </h1>
      <p className="text-base mb-2" style={{ color: '#FFFFFF' }}>
        Merci pour votre commande. Vous allez recevoir un email de confirmation.
      </p>
      <p className="text-sm mb-8" style={{ color: '#FFFFFF', opacity: 0.7 }}>
        Si vous avez commandé un produit "à sécher soi-même", le guide de séchage vous sera envoyé par email.
      </p>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate('/boutique')}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: '#F0B429', color: '#1E1912' }}>
          Retour à la boutique
        </button>
        <button
          onClick={() => navigate('/profil')}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }}>
          Mes commandes
        </button>
      </div>
    </div>
  )
}

export default PaiementSucces
