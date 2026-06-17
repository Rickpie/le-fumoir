import { createContext, useContext, useState } from 'react'

const PanierContext = createContext()

export function PanierProvider({ children }) {
  const [items, setItems] = useState([])

  function ajouterAuPanier(item) {
    // item = { id unique, produit_id, nom, prix_unitaire, quantite, epices: [], inserts: [], mode_realisation }
    setItems(prev => [...prev, item])
  }

  function retirerDuPanier(idItem) {
    setItems(prev => prev.filter(i => i.id !== idItem))
  }

  function viderPanier() {
    setItems([])
  }

  function modifierQuantite(idItem, quantite) {
    setItems(prev => prev.map(i => i.id === idItem ? { ...i, quantite: Math.max(1, quantite) } : i))
  }

  const total = items.reduce((sum, item) => sum + item.prix_unitaire * item.quantite, 0)
  const nombreArticles = items.reduce((sum, item) => sum + item.quantite, 0)

  return (
    <PanierContext.Provider value={{ items, ajouterAuPanier, retirerDuPanier, viderPanier, modifierQuantite, total, nombreArticles }}>
      {children}
    </PanierContext.Provider>
  )
}

export function usePanier() {
  return useContext(PanierContext)
}