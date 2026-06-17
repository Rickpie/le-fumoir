import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

function RouteProtegee({ children }) {
  const { utilisateur, profil, chargement } = useAuth()

  if (chargement) {
    return (
      <div className="flex items-center justify-center h-40">
        <p style={{ color: '#7a4010' }}>Chargement...</p>
      </div>
    )
  }

  if (!utilisateur || profil?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default RouteProtegee