import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const ETOILES = [1, 2, 3, 4, 5]

function AdminAvis() {
  const [avis, setAvis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [filtre, setFiltre] = useState('all') // 'all' | 'en_attente' | 'approuve'

  useEffect(() => { charger() }, [])

  async function charger() {
    setChargement(true)
    const { data } = await supabase
      .from('avis')
      .select('*, profils:profil_id (prenom, nom), tutoriels:tutoriel_id (titre)')
      .order('cree_le', { ascending: false })
    setAvis(data || [])
    setChargement(false)
  }

  async function approuver(id) {
    await supabase.from('avis').update({ approuve: true }).eq('id', id)
    setAvis(prev => prev.map(a => a.id === id ? { ...a, approuve: true } : a))
  }

  async function rejeter(id) {
    if (!confirm('Supprimer cet avis ?')) return
    await supabase.from('avis').delete().eq('id', id)
    setAvis(prev => prev.filter(a => a.id !== id))
  }

  const avisFiltres = avis.filter(a => {
    if (filtre === 'en_attente') return !a.approuve
    if (filtre === 'approuve') return a.approuve
    return true
  })

  const enAttente = avis.filter(a => !a.approuve).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium" style={{ color: '#EDD98A' }}>Avis clients</h2>
        {enAttente > 0 && (
          <span className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{ background: '#B03A2E', color: '#fff' }}>
            {enAttente} en attente
          </span>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5">
        {[['all', 'Tous'], ['en_attente', 'En attente'], ['approuve', 'Approuvés']].map(([v, l]) => (
          <button key={v} onClick={() => setFiltre(v)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={filtre === v
              ? { background: '#F0B429', color: '#1E1912' }
              : { background: 'transparent', color: '#FFFFFF', border: '1px solid #4A3820' }}>
            {l}
          </button>
        ))}
      </div>

      {chargement ? (
        <p className="text-sm" style={{ color: '#FFFFFF' }}>Chargement...</p>
      ) : avisFiltres.length === 0 ? (
        <p className="text-sm" style={{ color: '#7A6A50' }}>Aucun avis dans cette catégorie.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {avisFiltres.map(a => (
            <div key={a.id} className="rounded-xl border p-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#EDD98A' }}>
                    {a.profils?.prenom || 'Anonyme'} {a.profils?.nom?.[0]}.
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#7A6A50' }}>
                    sur « {a.tutoriels?.titre || '—'} » · {new Date(a.cree_le).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {ETOILES.map(n => (
                    <span key={n} style={{ color: n <= a.note ? '#F0B429' : '#4A3820', fontSize: '14px' }}>★</span>
                  ))}
                </div>
              </div>
              {a.commentaire && (
                <p className="text-sm mb-3 italic" style={{ color: '#FFFFFF' }}>« {a.commentaire} »</p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={a.approuve
                    ? { background: 'rgba(107,142,78,0.2)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.3)' }
                    : { background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
                  {a.approuve ? 'Approuvé' : 'En attente'}
                </span>
                {!a.approuve && (
                  <button onClick={() => approuver(a.id)}
                    className="text-xs px-3 py-1 rounded-md"
                    style={{ background: 'rgba(107,142,78,0.2)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.3)' }}>
                    Approuver
                  </button>
                )}
                <button onClick={() => rejeter(a.id)}
                  className="text-xs px-3 py-1 rounded-md"
                  style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminAvis
