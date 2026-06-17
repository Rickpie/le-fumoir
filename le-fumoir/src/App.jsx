import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import RouteProtegee from './components/RouteProtegee'
import AdminCategories from './pages/admin/AdminCategories'
import Accueil from './pages/Accueil'
import Boutique from './pages/Boutique'
import Tutoriels from './pages/Tutoriels'
import Contact from './pages/Contact'
import Connexion from './pages/Connexion'
import Inscription from './pages/Inscription'
import Admin from './pages/Admin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOptions from './pages/admin/AdminOptions'
import AdminProduits from './pages/admin/AdminProduits'
import AdminTutoriels from './pages/admin/AdminTutoriels'
import AdminPacks from './pages/admin/AdminPacks'



function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Accueil />} />
        <Route path="boutique" element={<Boutique />} />
        <Route path="tutoriels" element={<Tutoriels />} />
        <Route path="contact" element={<Contact />} />
        <Route path="connexion" element={<Connexion />} />
        <Route path="inscription" element={<Inscription />} />

        <Route
          path="admin"
          element={
            <RouteProtegee>
              <AdminLayout />
            </RouteProtegee>
          }
        >
          <Route index element={<Admin />} />
          <Route path="options" element={<AdminOptions />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="produits" element={<AdminProduits />} />
          <Route path="tutoriels" element={<AdminTutoriels />} />
          <Route path="packs" element={<AdminPacks />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App