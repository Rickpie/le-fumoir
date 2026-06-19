import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../../supabase'

const adminNav = [
  {
    groupe: null,
    items: [
      { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
      { path: '/admin/messages', label: 'Messages', icon: '📬', badge: true },
    ],
  },
  {
    groupe: 'Boutique',
    items: [
      { path: '/admin/mise-en-vente', label: 'Nouveau produit', icon: '🆕' },
      { path: '/admin/produits', label: 'Produits en vente', icon: '🥩' },
      { path: '/admin/commandes', label: 'Commandes actives', icon: '📦' },
      { path: '/admin/historique-commandes', label: 'Historique', icon: '📋' },
      { path: '/admin/factures', label: 'Factures', icon: '🧾' },
    ],
  },
  {
    groupe: 'Tutoriels',
    items: [
      { path: '/admin/tutoriels', label: 'Gérer les tutoriels', icon: '📖' },
      { path: '/admin/fichiers', label: 'Fichiers à vendre', icon: '📄' },
      { path: '/admin/doc-sechage', label: 'Guide séchage', icon: '🌡️' },
    ],
  },
  {
    groupe: 'Configuration ventes',
    items: [
      { path: '/admin/categories-tutoriels', label: 'Catégories tutoriels', icon: '🏷️' },
      { path: '/admin/options', label: 'Épices & Inserts', icon: '🧂' },
      { path: '/admin/packs', label: 'Packs', icon: '🎁' },
      { path: '/admin/parametres-facturation', label: 'Modèle de facture', icon: '📝' },
    ],
  },
  {
    groupe: 'Contenu du site',
    items: [
      { path: '/admin/accueil', label: "Page d'accueil", icon: '🏠' },
      { path: '/admin/faq', label: 'FAQ', icon: '❓' },
      { path: '/admin/contact', label: 'Page contact', icon: '✉️' },
    ],
  },
  {
    groupe: 'Communauté',
    items: [
      { path: '/admin/clients', label: 'Clients', icon: '👥' },
      { path: '/admin/avis', label: 'Avis clients', icon: '⭐' },
      { path: '/admin/promos', label: 'Codes promo', icon: '🎟️' },
    ],
  },
  {
    groupe: 'Tarification',
    items: [
      { path: '/admin/calculateur', label: 'Calculatrice', icon: '🧮' },
      { path: '/admin/referentiel', label: 'Référentiel', icon: '📊' },
      { path: '/admin/calculateur-config', label: 'Config frais', icon: '⚙️' },
    ],
  },
]

function AdminLayout() {
  const [messagesNonLus, setMessagesNonLus] = useState(0)
  const [sidebarOuverte, setSidebarOuverte] = useState(false)

  useEffect(() => { chargerCompteur() }, [])

  async function chargerCompteur() {
    const { count } = await supabase
      .from('messages_contact')
      .select('*', { count: 'exact', head: true })
      .eq('lu', false)
    setMessagesNonLus(count || 0)
  }

  const lienStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    textDecoration: 'none',
    transition: 'background 0.15s',
    background: isActive ? '#F0B429' : 'transparent',
    color: isActive ? '#1E1912' : '#FFFFFF',
  })

  return (
    <div>
      {/* Titre + bouton menu mobile */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-medium" style={{ color: '#EDD98A' }}>Panel Admin</h1>
        <button
          className="sm:hidden px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }}
          onClick={() => setSidebarOuverte(v => !v)}
        >
          {sidebarOuverte ? '✕ Fermer' : '☰ Menu'}
        </button>
      </div>

      <div className="flex gap-0" style={{ minHeight: '70vh' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: '210px',
            minWidth: '210px',
            background: '#1a1610',
            borderRight: '1px solid #4A3820',
            borderRadius: '1rem 0 0 1rem',
            padding: '1rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
          className={sidebarOuverte ? '' : 'hidden sm:flex'}
        >
          {adminNav.map((section, si) => (
            <div key={si} style={{ marginBottom: section.groupe ? '4px' : '0' }}>
              {section.groupe && (
                <p style={{
                  fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#7A6A50', padding: '12px 14px 4px', margin: 0,
                }}>
                  {section.groupe}
                </p>
              )}
              {!section.groupe && si > 0 && (
                <div style={{ height: '1px', background: '#4A3820', margin: '8px 4px' }} />
              )}
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  style={({ isActive }) => lienStyle(isActive)}
                  onClick={() => setSidebarOuverte(false)}
                >
                  <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && messagesNonLus > 0 && (
                    <span style={{
                      fontSize: '0.7rem', padding: '1px 7px', borderRadius: '999px',
                      background: '#B03A2E', color: '#fff', fontWeight: '600',
                    }}>
                      {messagesNonLus}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </aside>

        {/* Contenu */}
        <main style={{
          flex: 1, minWidth: 0, padding: '1.5rem 1.75rem',
          background: '#1E1912', borderRadius: '0 1rem 1rem 0',
          border: '1px solid #4A3820', borderLeft: 'none',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
