import { useEffect, useState } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePanier } from '../../context/PanierContext'
import { supabase } from '../../supabase'

const navItems = [
  { path: '/boutique', label: 'Boutique', icon: '🛒' },
  { path: '/tutoriels', label: 'Tutoriels', icon: '📖' },
  { path: '/calculatrice', label: 'Calculatrice', icon: '🧮' },
  { path: '/a-propos', label: 'À propos', icon: '🔥' },
  { path: '/faq', label: 'FAQ', icon: '❓' },
  { path: '/contact', label: 'Nous contacter', icon: '✉️' },
]

function Sidebar() {
  const { utilisateur, profil, seDeconnecter } = useAuth()
  const { nombreArticles } = usePanier()
  const navigate = useNavigate()
  const [notifAdmin, setNotifAdmin] = useState(0)
  const estAdmin = profil?.role === 'admin'

  useEffect(() => {
    if (!estAdmin) return
    chargerNotifs()
  }, [estAdmin])

  async function chargerNotifs() {
    const [{ count: msgs }, { count: cmds }] = await Promise.all([
      supabase.from('messages_contact').select('*', { count: 'exact', head: true }).eq('lu', false),
      supabase.from('commandes').select('*', { count: 'exact', head: true }).in('statut', ['en_attente', 'autorisee']),
    ])
    setNotifAdmin((msgs || 0) + (cmds || 0))
  }

  async function handleDeconnexion() {
    try {
      await seDeconnecter()
    } finally {
      navigate('/')
    }
  }

  return (
    <aside className="w-48 h-screen sticky top-0 flex flex-col border-r overflow-y-auto" style={{ background: '#2C2518', borderColor: '#4A3820' }}>

      {/* Logo */}
      <Link to="/" className="px-4 py-3 border-b flex justify-center shrink-0" style={{ borderColor: '#4A3820' }}>
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{ width: '90px', height: '90px' }}>
          <circle cx="200" cy="200" r="185" fill="#2C2518" stroke="#F0B429" strokeWidth="6" />
          <circle cx="200" cy="200" r="170" fill="none" stroke="#F0B429" strokeWidth="1.5" />
          <text x="200" y="190" textAnchor="middle" fontFamily="Georgia, serif" fontSize="92" fontWeight="700" fill="#F0B429">PC</text>
          <text x="100" y="265" fontFamily="Georgia, serif" fontSize="40" fontWeight="500" fill="#EDD98A">Le Fumo</text>
          <text x="266" y="265" fontFamily="Georgia, serif" fontSize="40" fontWeight="500" fill="#EDD98A">r</text>
          <rect x="260" y="247" width="4" height="18" rx="1.6" fill="#EDD98A" />
          <path d="M262 244 Q256 232 262 223 Q268 232 262 244 Z" fill="#FFFFFF" />
          <path d="M262 239 Q259 232 262 227 Q265 232 262 239 Z" fill="#F0B429" />
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
              (isActive ? 'border-yellow-500 bg-yellow-500/10' : 'border-transparent hover:bg-white/5')
            }
            style={({ isActive }) => ({ color: isActive ? '#F0B429' : '#FFFFFF' })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Lien Admin si admin */}
        {estAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-all border-l-2 ` +
              (isActive ? 'border-yellow-500 bg-yellow-500/10' : 'border-transparent hover:bg-white/5')
            }
            style={({ isActive }) => ({ color: isActive ? '#F0B429' : '#FFFFFF' })}
          >
            <span>⚙️</span>
            <span className="flex-1">Admin</span>
            {notifAdmin > 0 && (
              <span style={{
                fontSize: '0.65rem', padding: '1px 6px', borderRadius: '999px',
                background: '#B03A2E', color: '#fff', fontWeight: '700', lineHeight: 1.4,
              }}>
                {notifAdmin > 99 ? '99+' : notifAdmin}
              </span>
            )}
          </NavLink>
        )}
      </nav>

      {/* Bas de sidebar */}
      <div className="border-t flex flex-col mt-auto" style={{ borderColor: '#4A3820' }}>
        <NavLink
          to="/panier"
          className="flex items-center gap-3 px-4 py-2.5 text-sm border-l-2 border-transparent hover:bg-white/5 transition-all"
          style={{ color: '#FFFFFF' }}
        >
          <span>🛍️</span>
          <span>Panier</span>
          <span className="ml-auto text-xs font-medium rounded-full px-2 py-0.5" style={{ background: '#F0B429', color: '#1E1912' }}>{nombreArticles}</span>
        </NavLink>

        {utilisateur ? (
          <>
            <NavLink
              to="/profil"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-all border-l-2 ` +
                (isActive ? 'border-yellow-500 bg-yellow-500/10' : 'border-transparent hover:bg-white/5')
              }
              style={({ isActive }) => ({ color: isActive ? '#F0B429' : '#FFFFFF' })}
            >
              <span>👤</span>
              <span className="truncate">{profil?.prenom || 'Mon compte'}</span>
            </NavLink>
            <button
              onClick={handleDeconnexion}
              className="flex items-center gap-3 px-4 py-2.5 text-sm border-l-2 border-transparent hover:bg-white/5 transition-all text-left"
              style={{ color: '#FFFFFF' }}
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
              (isActive ? 'border-yellow-500 bg-yellow-500/10' : 'border-transparent hover:bg-white/5')
            }
            style={({ isActive }) => ({ color: isActive ? '#F0B429' : '#FFFFFF' })}
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
