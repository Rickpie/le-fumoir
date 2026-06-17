import { NavLink, Outlet } from 'react-router-dom'

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/produits', label: 'Produits', icon: '🥩' },
  { path: '/admin/categories', label: 'Catégories', icon: '🏷️' },
  { path: '/admin/options', label: 'Épices & Inserts', icon: '🧂' },
  { path: '/admin/tutoriels', label: 'Tutoriels', icon: '📖' },
  { path: '/admin/commandes', label: 'Commandes', icon: '📦' },
]

function AdminLayout() {
  return (
    <div>
      <h1 className="text-2xl font-medium mb-4" style={{ color: '#3d1e06' }}>Panel Admin</h1>

      <div className="flex gap-2 flex-wrap mb-6 border-b pb-4" style={{ borderColor: '#d6bfa0' }}>
        {adminNav.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ` +
              (isActive ? '' : 'hover:opacity-80')
            }
            style={({ isActive }) => isActive
              ? { background: '#5a2e0e', color: '#fdf0d0' }
              : { background: '#f5e2c0', color: '#7a4010' }
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}

export default AdminLayout