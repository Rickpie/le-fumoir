import { Routes, Route } from 'react-router-dom'
import { useVisiteur } from './hooks/useVisiteur'
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
import AdminMiseEnVente from './pages/admin/AdminMiseEnVente'
import AdminCommandes from './pages/admin/AdminCommandes'
import AdminTutoriels from './pages/admin/AdminTutoriels'
import AdminPacks from './pages/admin/AdminPacks'
import AdminFichiers from './pages/admin/AdminFichiers'
import ProduitDetail from './pages/ProduitDetail'
import Panier from './pages/Panier'
import AdminContact from './pages/admin/AdminContact'
import MotDePasseOublie from './pages/MotDePasseOublie'
import ReinitialiserMotDePasse from './pages/ReinitialiserMotDePasse'
import Profil from './pages/Profil'
import AdminMessages from './pages/admin/AdminMessages'
import AdminAccueil from './pages/admin/AdminAccueil'
import AdminDocSechage from './pages/admin/AdminDocSechage'
import AdminFacture from './pages/admin/AdminFacture'
import AdminParametresFacturation from './pages/admin/AdminParametresFacturation'
import Calculatrice from './pages/Calculatrice'


function App() {
  useVisiteur()
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Accueil />} />
        <Route path="boutique" element={<Boutique />} />
        <Route path="tutoriels" element={<Tutoriels />} />
        <Route path="contact" element={<Contact />} />
        <Route path="connexion" element={<Connexion />} />
        <Route path="inscription" element={<Inscription />} />
        <Route path="produit/:id" element={<ProduitDetail />} />
        <Route path="panier" element={<Panier />} />
        <Route path="mot-de-passe-oublie" element={<MotDePasseOublie />} />
        <Route path="reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
        <Route path="profil" element={<Profil />} />
        <Route path="calculatrice" element={<Calculatrice />} />
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
          <Route path="mise-en-vente" element={<AdminMiseEnVente />} />
          <Route path="produits" element={<AdminProduits />} />
          <Route path="commandes" element={<AdminCommandes />} />
          <Route path="tutoriels" element={<AdminTutoriels />} />
          <Route path="packs" element={<AdminPacks />} />
          <Route path="fichiers" element={<AdminFichiers />} />
          <Route path="accueil" element={<AdminAccueil />} />
          <Route path="doc-sechage" element={<AdminDocSechage />} />
          <Route path="facture/:commandeId" element={<AdminFacture />} />
          <Route path="parametres-facturation" element={<AdminParametresFacturation />} />
          <Route path="contact" element={<AdminContact />} />
          <Route path="messages" element={<AdminMessages />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App