import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'

const STATUTS = [
  { valeur: 'expediee', label: 'Expédiée',  couleur: '#4A90D9', bg: '#4A90D918' },
  { valeur: 'annulee',  label: 'Annulée',   couleur: '#B03A2E', bg: '#B03A2E18' },
]

function getStatut(valeur) {
  return STATUTS.find(s => s.valeur === valeur) || { label: valeur, couleur: '#FFFFFF', bg: '#FFFFFF10' }
}

function initiales(profil) {
  if (!profil) return '?'
  return ((profil.prenom || '')[0] + (profil.nom || '')[0]).toUpperCase() || '?'
}

function AdminCommandesHistorique() {
  const navigate = useNavigate()
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('')
  const [recherche, setRecherche] = useState('')
  const [ouvertes, setOuvertes] = useState({})

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data: rows } = await supabase
      .from('commandes')
      .select('*')
      .in('statut', ['expediee', 'annulee'])
      .order('created_at', { ascending: false })
    if (!rows) { setChargement(false); return }

    const profilIds = [...new Set(rows.map(r => r.profil_id).filter(Boolean))]
    let profilsMap = {}
    if (profilIds.length > 0) {
      const { data: profils } = await supabase.from('profils').select('id, prenom, nom, email').in('id', profilIds)
      ;(profils || []).forEach(p => { profilsMap[p.id] = p })
    }
    setCommandes(rows.map(r => ({ ...r, profils: profilsMap[r.profil_id] || null })))
    setChargement(false)
  }

  async function supprimer(id) {
    if (!confirm('⛔ Supprimer définitivement cette commande de l\'historique ?')) return
    await supabase.from('commandes').delete().eq('id', id)
    setCommandes(prev => prev.filter(c => c.id !== id))
  }

  async function reactiver(id) {
    await supabase.from('commandes').update({ statut: 'en_attente' }).eq('id', id)
    setCommandes(prev => prev.filter(c => c.id !== id))
  }

  const terme = recherche.toLowerCase().trim()
  const commandesFiltrees = commandes.filter(c => {
    const matchStatut = !filtreStatut || c.statut === filtreStatut
    const nomClient = `${c.profils?.prenom || ''} ${c.profils?.nom || ''}`.toLowerCase()
    const idCourt = c.id.slice(0, 8).toLowerCase()
    const matchTexte = !terme || nomClient.includes(terme) || idCourt.includes(terme)
    return matchStatut && matchTexte
  })

  const caRealise = commandes.filter(c => c.statut === 'expediee').reduce((s, c) => s + (parseFloat(c.total) || 0), 0)
  const nbExpediees = commandes.filter(c => c.statut === 'expediee').length

  if (chargement) return <div className="flex items-center justify-center h-48"><p style={{ color: '#7A6A50', fontSize: '0.875rem' }}>Chargement…</p></div>

  return (
    <div className="flex flex-col gap-6">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'CA réalisé', valeur: `${caRealise.toFixed(2)} €`, sous: `${nbExpediees} commande${nbExpediees > 1 ? 's' : ''} expédiée${nbExpediees > 1 ? 's' : ''}`, couleur: '#6B8E4E' },
          { label: 'Total historique', valeur: commandes.length, sous: 'commandes terminées', couleur: '#EDD98A' },
        ].map(({ label, valeur, sous, couleur }) => (
          <div key={label} className="rounded-xl p-4 border relative overflow-hidden" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, background: couleur, borderRadius: '12px 0 0 12px' }} />
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 ml-1" style={{ color: '#7A6A50' }}>{label}</p>
            <p className="text-3xl font-bold ml-1" style={{ color: couleur }}>{valeur}</p>
            <p className="text-xs mt-1 ml-1" style={{ color: '#7A6A50' }}>{sous}</p>
          </div>
        ))}
      </div>

      {/* Recherche + Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input type="text" placeholder="Rechercher par nom ou numéro de commande..."
            value={recherche} onChange={e => setRecherche(e.target.value)}
            className="w-full px-3 py-2 pl-8 rounded-lg border text-sm outline-none"
            style={{ background: '#2C2518', borderColor: '#4A3820', color: '#EDD98A' }} />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#7A6A50' }}>🔍</span>
          {recherche && (
            <button onClick={() => setRecherche('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#7A6A50' }}>✕</button>
          )}
        </div>
        <div className="flex gap-2">
          {[['', 'Tout'], ['expediee', 'Expédiées'], ['annulee', 'Annulées']].map(([v, l]) => (
            <button key={v} onClick={() => setFiltreStatut(v)}
              className="text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap"
              style={filtreStatut === v ? { background: '#F0B429', color: '#1E1912' } : { background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {commandesFiltrees.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#7A6A50' }}>
          <p className="text-4xl mb-3">{terme ? '🔍' : '📭'}</p>
          <p className="text-sm">{terme ? `Aucun résultat pour « ${recherche} »` : 'Aucune commande dans l\'historique.'}</p>
          {terme && <button onClick={() => setRecherche('')} className="mt-2 text-xs underline" style={{ color: '#F0B429' }}>Effacer la recherche</button>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {commandesFiltrees.map(c => {
            const s = getStatut(c.statut)
            const ouvert = !!ouvertes[c.id]
            const nbLignes = (c.lignes || []).reduce((sum, l) => sum + (l.quantite || 1), 0)

            return (
              <div key={c.id} className="rounded-xl border overflow-hidden"
                style={{ background: '#2C2518', borderColor: ouvert ? s.couleur + '80' : '#4A3820', transition: 'border-color 0.2s' }}>
                <div style={{ height: 3, background: s.couleur }} />
                <button onClick={() => setOuvertes(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-all">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: s.couleur + '22', color: s.couleur, border: `1px solid ${s.couleur}44` }}>
                    {initiales(c.profils)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: '#EDD98A' }}>
                        {c.profils ? `${c.profils.prenom || ''} ${c.profils.nom || ''}`.trim() || 'Client' : 'Client anonyme'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: s.bg, color: s.couleur, border: `1px solid ${s.couleur}33` }}>{s.label}</span>
                      {nbLignes > 0 && <span className="text-xs" style={{ color: '#7A6A50' }}>{nbLignes} produit{nbLignes > 1 ? 's' : ''}</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#7A6A50' }}>#{c.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-base font-bold" style={{ color: '#F0B429' }}>{c.total != null ? `${parseFloat(c.total).toFixed(2)} €` : '—'}</p>
                    <p className="text-xs" style={{ color: '#7A6A50' }}>{new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span style={{ color: '#7A6A50', fontSize: '0.65rem', marginLeft: 4 }}>{ouvert ? '▲' : '▼'}</span>
                </button>

                {ouvert && (
                  <div className="border-t px-4 pt-4 pb-5 flex flex-col gap-4" style={{ borderColor: '#4A3820' }}>
                    {c.lignes?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#7A6A50' }}>Produits commandés</p>
                        <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#4A3820' }}>
                          {c.lignes.map((l, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0"
                              style={{ borderColor: '#4A3820', background: i % 2 === 0 ? '#1E1912' : '#2C2518' }}>
                              <span className="flex-1 text-sm font-medium" style={{ color: '#EDD98A' }}>{l.nom || '—'}</span>
                              <span className="text-xs font-medium px-2" style={{ color: '#FFFFFF' }}>× {l.quantite || 1}</span>
                              <span className="text-sm font-semibold" style={{ color: '#F0B429', minWidth: 60, textAlign: 'right' }}>
                                {l.prix_unitaire != null ? `${parseFloat(l.prix_unitaire).toFixed(2)} €` : ''}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-end px-3 py-2.5" style={{ background: '#1a1610', borderTop: '1px solid #4A3820' }}>
                            <span className="text-sm font-bold" style={{ color: '#F0B429' }}>Total : {parseFloat(c.total || 0).toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {c.adresse_livraison && (
                      <div className="rounded-lg px-3 py-2" style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#7A6A50' }}>Adresse de livraison</p>
                        <p className="text-sm" style={{ color: '#EDD98A' }}>{c.adresse_livraison}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap pt-1" style={{ borderTop: '1px solid #4A3820' }}>
                      <button onClick={() => navigate(`/admin/facture/${c.id}`)} className="text-sm px-3 py-1.5 rounded-lg font-medium"
                        style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820' }}>📄 Facture</button>
                      {c.statut === 'annulee' && (
                        <>
                          <button onClick={() => reactiver(c.id)} className="text-sm px-3 py-1.5 rounded-lg font-medium"
                            style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820' }}>↺ Réactiver</button>
                          <button onClick={() => supprimer(c.id)} className="text-sm px-3 py-1.5 rounded-lg font-medium"
                            style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.5)' }}>🗑️ Supprimer</button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminCommandesHistorique
