import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

function StatCard({ label, value, sousTitre, accent }) {
  return (
    <div className="rounded-xl p-5 border flex flex-col justify-between" style={{ background: '#2C2518', borderColor: '#4A3820', minHeight: '110px' }}>
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#FFFFFF' }}>{label}</p>
      <div>
        <p className="text-4xl font-semibold mt-2" style={{ color: accent || '#F0B429' }}>{value}</p>
        {sousTitre && <p className="text-xs mt-1" style={{ color: '#FFFFFF' }}>{sousTitre}</p>}
      </div>
    </div>
  )
}

function Admin() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    chargerStats()
  }, [])

  async function chargerStats() {
    const [
      { count: produits },
      { count: produitsActifs },
      { count: tutoriels },
      { count: commandes },
      { count: ventesValidees },
      { count: inscrits },
      { count: messagesNonLus },
      { count: visiteursUniques },
      { data: topProduits },
    ] = await Promise.all([
      supabase.from('produits').select('*', { count: 'exact', head: true }),
      supabase.from('produits').select('*', { count: 'exact', head: true }).eq('visible', true),
      supabase.from('tutoriels').select('*', { count: 'exact', head: true }).eq('visible', true),
      supabase.from('commandes').select('*', { count: 'exact', head: true }),
      supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('statut', 'confirmee'),
      supabase.from('profils').select('*', { count: 'exact', head: true }),
      supabase.from('messages_contact').select('*', { count: 'exact', head: true }).eq('lu', false),
      supabase.from('visites').select('visiteur_id', { count: 'exact', head: false }).then(res => ({
        count: new Set((res.data || []).map(r => r.visiteur_id)).size
      })),
      Promise.resolve({ data: [] }),
    ])

    setStats({
      produits: produits || 0,
      produitsActifs: produitsActifs || 0,
      tutoriels: tutoriels || 0,
      commandes: commandes || 0,
      ventesValidees: ventesValidees || 0,
      inscrits: inscrits || 0,
      messagesNonLus: messagesNonLus || 0,
      visiteursUniques: visiteursUniques || 0,
      topProduits: topProduits || [],
    })
  }

  if (!stats) return (
    <div className="flex items-center justify-center h-40">
      <p style={{ color: '#FFFFFF' }}>Chargement...</p>
    </div>
  )

  return (
    <div className="space-y-8">

      {/* Ligne 1 — trafic & membres */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#FFFFFF' }}>Audience</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Visiteurs uniques" value={stats.visiteursUniques} sousTitre="depuis l'ouverture" />
          <StatCard label="Inscrits" value={stats.inscrits} sousTitre="comptes créés" />
          <StatCard label="Produits en vente" value={stats.produitsActifs} sousTitre={`${stats.produits} au total`} />
          <StatCard label="Tutoriels publiés" value={stats.tutoriels} />
        </div>
      </div>

      {/* Ligne 2 — commandes & messages */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#FFFFFF' }}>Activité</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Commandes totales" value={stats.commandes} accent="#EDD98A" />
          <StatCard label="Ventes validées" value={stats.ventesValidees} accent="#6B8E4E" />
          <StatCard label="Messages non lus" value={stats.messagesNonLus} accent={stats.messagesNonLus > 0 ? '#B03A2E' : '#EDD98A'} />
        </div>
      </div>

      {/* Top produits par clics */}
      {stats.topProduits.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#FFFFFF' }}>Top produits consultés</p>
          <div className="rounded-xl border overflow-hidden" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            {stats.topProduits.map((p, i) => (
              <div key={p.nom} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0" style={{ borderColor: '#4A3820' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-5 text-center font-semibold" style={{ color: '#FFFFFF' }}>{i + 1}</span>
                  <span className="text-sm" style={{ color: '#EDD98A' }}>{p.nom}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: '#F0B429' }}>{p.clics || 0} clics</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default Admin
