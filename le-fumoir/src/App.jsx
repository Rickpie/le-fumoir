import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Accueil from './pages/Accueil'
import Boutique from './pages/Boutique'
import Tutoriels from './pages/Tutoriels'
import Contact from './pages/Contact'
import Admin from './pages/Admin'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Accueil />} />
        <Route path="boutique" element={<Boutique />} />
        <Route path="tutoriels" element={<Tutoriels />} />
        <Route path="contact" element={<Contact />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}

export default App