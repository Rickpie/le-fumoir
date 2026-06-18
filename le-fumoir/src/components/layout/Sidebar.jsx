import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePanier } from '../../context/PanierContext'

const navItems = [
  { path: '/boutique', label: 'Boutique', icon: '🛒' },
  { path: '/tutoriels', label: 'Tutoriels', icon: '📖' },
  { path: '/calculatrice', label: 'Calculatrice', icon: '🧮' },
  { path: '/contact', label: 'Infos & Contact', icon: '✉️' },
]

function Sidebar() {
  const { utilisateur, profil, seDeconnecter } = useAuth()
  const { nombreArticles } = usePanier()
  const navigate = useNavigate()

  async function handleDeconnexion() {
    await seDeconnecter()
    navigate('/')
  }

  return (
    <aside className="w-48 min-h-screen flex flex-col" style={{ background: '#5a2e0e' }}>

      {/* Logo */}
      <Link to="/" className="px-4 py-5 border-b border-white/10 flex justify-center">
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{ width: '120px', height: '120px' }}>
          <circle cx="200" cy="200" r="185" fill="#fdf0d0" stroke="#1a1410" strokeWidth="6" />
          <circle cx="200" cy="200" r="170" fill="none" stroke="#1a1410" strokeWidth="1.5" />
          <text x="200" y="190" textAnchor="middle" fontFamily="Georgia, serif" fontSize="92" fontWeight="700" fill="#1a1410">PC</text>
          <text x="100" y="265" fontFamily="Georgia, serif" fontSize="40" fontWeight="500" fill="#1a1410">Le Fumo</text>
          <text x="266" y="265" fontFamily="Georgia, serif" fontSize="40" fontWeight="500" fill="#1a1410">r</text>
          <rect x="260" y="247" width="4" height="18" rx="1.6" fill="#1a1410" />
          <path d="M262 244 Q256 232 262 223 Q268 232 262 244 Z" fill="#c8784a" />
          <path d="M262 239 Q259 232 262 227 Q265 232 262 239 Z" fill="#f0a830" />
        </svg>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col mt-3 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-all border-l-2 ` +
              (isActive
                ? 'border-yellow-500 text-amber-100 bg-yellow-500/10'
                : 'border-transparent text-amber-300/70 hover:text-amber-100 hover:bg-white/5')
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Lien Admin si admin */}
        {profil?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-all border-l-2 ` +
              (isActive
                ? 'border-yellow-500 text-amber-100 bg-yellow-500/10'
                : 'border-transparent text-amber-300/70 hover:text-amber-100 hover:bg-white/5')
            }
          >
            <span>⚙️</span>
            <span>Admin</span>
          </NavLink>
        )}
      </nav>

      {/* Bas de sidebar */}
      <div className="border-t border-white/10 flex flex-col mt-auto">
        <NavLink
          to="/panier"
          className="flex items-center gap-3 px-4 py-2.5 text-sm border-l-2 border-transparent text-amber-300/70 hover:text-amber-100 hover:bg-white/5 transition-all"
        >
          <span>🛍️</span>
          <span>Panier</span>
          <span className="ml-auto text-xs bg-yellow-500 text-amber-900 font-medium rounded-full px-2 py-0.5">{nombreArticles}</span>
        </NavLink>

        {utilisateur ? (
          <>
            <NavLink
              to="/profil"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-all border-l-2 ` +
                (isActive
                  ? 'border-yellow-500 text-amber-100 bg-yellow-500/10'
                  : 'border-transparent text-amber-300/70 hover:text-amber-100 hover:bg-white/5')
              }
            >
              <span>👤</span>
              <span className="truncate">{profil?.prenom || 'Mon compte'}</span>
            </NavLink>
            <button
              onClick={handleDeconnexion}
              className="flex items-center gap-3 px-4 py-2.5 text-sm border-l-2 border-transparent text-amber-300/70 hover:text-amber-100 hover:bg-white/5 transition-all text-left"
            >
              <span>🚪</span>
              <span>Déconnexion</span>
            </button>
          </>
        ) : (
          <NavLink
            to="/connexion"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-all border-l-2 ` +
              (isActive
                ? 'border-yellow-500 text-amber-100 bg-yellow-500/10'
                : 'border-transparent text-amber-300/70 hover:text-amber-100 hover:bg-white/5')
            }
          >
            <span>👤</span>
            <span>Connexion</span>
          </NavLink>
        )}
      </div>

    </aside>
  )
}

export default Sidebar