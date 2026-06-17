import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

function Admin() {
  const [stats, setStats] = useState({
    nbrProduits: 0,
    nbrCommandes: 0,
    nbrTutoriels: 0,
    ventesValidees: 0,
  })

  useEffect(() => {
    chargerStats()
  }, [])

  async function chargerStats() {
    const { count: nbrProduits } = await supabase
      .from('produits')
      .select('*', { count: 'exact', head: true })

    const { count: nbrCommandes } = await supabase
      .from('commandes')
      .select('*', { count: 'exact', head: true })

    const { count: nbrTutoriels } = await supabase
      .from('tutoriels')
      .select('*', { count: 'exact', head: true })

    const { count: ventesValidees } = await supabase
      .from('commandes')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'payee')

    setStats({
      nbrProduits: nbrProduits || 0,
      nbrCommandes: nbrCommandes || 0,
      nbrTutoriels: nbrTutoriels || 0,
      ventesValidees: ventesValidees || 0,
    })
  }

  const cards = [
    { label: 'Produits en boutique', value: stats.nbrProduits, icon: '🥩' },
    { label: 'Commandes totales', value: stats.nbrCommandes, icon: '📦' },
    { label: 'Ventes validées', value: stats.ventesValidees, icon: '💰' },
    { label: 'Tutoriels publiés', value: stats.nbrTutoriels, icon: '📖' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-xl p-4 border" style={{ borderColor: '#d6bfa0' }}>
          <div className="text-2xl mb-2">{card.icon}</div>
          <div className="text-2xl font-medium" style={{ color: '#3d1e06' }}>{card.value}</div>
          <div className="text-xs mt-1" style={{ color: '#7a4010' }}>{card.label}</div>
        </div>
      ))}
    </div>
  )
}

export default Admin