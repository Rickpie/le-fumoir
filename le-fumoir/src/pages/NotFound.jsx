import { useNavigate } from 'react-router-dom'

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="max-w-lg mx-auto text-center py-24">
      <p className="text-8xl font-bold mb-4" style={{ color: '#4A3820' }}>404</p>
      <h1 className="text-2xl font-medium mb-3" style={{ color: '#EDD98A' }}>Page introuvable</h1>
      <p className="text-sm mb-8" style={{ color: '#FFFFFF' }}>
        Cette page n'existe pas ou a été déplacée.
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }}>
          ← Retour
        </button>
        <button onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#F0B429', color: '#1E1912' }}>
          Accueil
        </button>
      </div>
    </div>
  )
}

export default NotFound
