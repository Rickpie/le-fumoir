import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'

function PaiementAnnule() {
  const navigate = useNavigate()

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <SEO titre="Paiement annulé — PC Le Fumoir" noindex />
      <div className="text-6xl mb-6">↩️</div>
      <h1 className="text-2xl font-semibold mb-3" style={{ color: '#EDD98A' }}>
        Paiement annulé
      </h1>
      <p className="text-base mb-8" style={{ color: '#FFFFFF' }}>
        Votre panier a été conservé. Vous pouvez reprendre votre commande quand vous voulez.
      </p>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate('/panier')}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: '#F0B429', color: '#1E1912' }}>
          Retourner au panier
        </button>
        <button
          onClick={() => navigate('/boutique')}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }}>
          Continuer mes achats
        </button>
      </div>
    </div>
  )
}

export default PaiementAnnule
