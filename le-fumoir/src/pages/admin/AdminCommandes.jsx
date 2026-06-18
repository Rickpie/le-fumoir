import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'

const STATUTS = [
  { valeur: 'en_attente', label: 'En attente', couleur: '#EDD98A' },
  { valeur: 'confirmee', label: 'Confirmée', couleur: '#F0B429' },
  { valeur: 'en_preparation', label: 'En préparation', couleur: '#FFFFFF' },
  { valeur: 'expediee', label: 'Expédiée', couleur: '#6B8E4E' },
  { valeur: 'payee', label: 'Payée', couleur: '#6B8E4E' },
  { valeur: 'annulee', label: 'Annulée', couleur: '#B03A2E' },
]

function badgeStatut(statut) {
  const s = STATUTS.find(s => s.valeur === statut) || { label: statut, couleur: '#FFFFFF' }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.couleur + '22', color: s.couleur, border: `1px solid ${s.couleur}44` }}>
      {s.label}
    </span>
  )
}

function AdminCommandes() {
  const navigate = useNavigate()
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('')
  const [commandeOuverte, setCommandeOuverte] = useState(null)

  useEffect(() => {
    chargerCommandes()
  }, [])

  async function chargerCommandes() {
    const { data } = await supabase
      .from('commandes')
      .select('*, profils(prenom, nom, email)')
      .order('created_at', { ascending: false })
    setCommandes(data || [])
    setChargement(false)
  }

  async function changerStatut(id, statut) {
    await supabase.from('commandes').update({ statut }).eq('id', id)
    setCommandes(prev => prev.map(c => c.id === id ? { ...c, statut } : c))
    if (commandeOuverte?.id === id) setCommandeOuverte(prev => ({ ...prev, statut }))
  }

  const commandesFiltrees = filtreStatut
    ? commandes.filter(c => c.statut === filtreStatut)
    : commandes

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const ca = commandes
    .filter(c => c.statut === 'payee')
    .reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0)

  const caEnCours = commandes
    .filter(c => ['en_attente', 'confirmee', 'en_preparation', 'expediee'].includes(c.statut))
    .reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0)

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: '#EDD98A' }}>📦 Commandes</h2>

      {/* Stats CA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl p-4 border" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: '#FFFFFF' }}>Chiffre d'affaires</p>
          <p className="text-2xl font-semibold" style={{ color: '#6B8E4E' }}>{ca.toFixed(2)} €</p>
          <p className="text-xs mt-0.5" style={{ color: '#FFFFFF' }}>commandes payées</p>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: '#FFFFFF' }}>En cours</p>
          <p className="text-2xl font-semibold" style={{ color: '#F0B429' }}>{caEnCours.toFixed(2)} €</p>
          <p className="text-xs mt-0.5" style={{ color: '#FFFFFF' }}>à valider / expédier</p>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: '#FFFFFF' }}>Total commandes</p>
          <p className="text-2xl font-semibold" style={{ color: '#EDD98A' }}>{commandes.length}</p>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: '#FFFFFF' }}>Payées</p>
          <p className="text-2xl font-semibold" style={{ color: '#EDD98A' }}>{commandes.filter(c => c.statut === 'payee').length}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setFiltreStatut('')}
          className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={filtreStatut === '' ? { background: '#F0B429', color: '#1E1912' } : { background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }}>
          Tout ({commandes.length})
        </button>
        {STATUTS.map(s => {
          const nb = commandes.filter(c => c.statut === s.valeur).length
          if (nb === 0) return null
          return (
            <button key={s.valeur} onClick={() => setFiltreStatut(s.valeur)}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={filtreStatut === s.valeur
                ? { background: s.couleur, color: '#1E1912' }
                : { background: '#2C2518', color: s.couleur, border: `1px solid ${s.couleur}44` }}>
              {s.label} ({nb})
            </button>
          )
        })}
      </div>

      {commandesFiltrees.length === 0 ? (
        <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucune commande.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {commandesFiltrees.map(c => (
            <div key={c.id} className="rounded-xl border overflow-hidden"
              style={{ background: '#2C2518', borderColor: commandeOuverte?.id === c.id ? '#F0B429' : '#4A3820' }}>

              {/* En-tête ligne */}
              <button onClick={() => setCommandeOuverte(commandeOuverte?.id === c.id ? null : c)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>
                      {c.profils?.prenom} {c.profils?.nom}
                    </span>
                    <span className="text-xs ml-2" style={{ color: '#FFFFFF' }}>{c.profils?.email}</span>
                  </div>
                  {badgeStatut(c.statut)}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: '#F0B429' }}>
                    {c.total != null ? `${c.total} €` : '—'}
                  </span>
                  <span className="text-xs" style={{ color: '#FFFFFF' }}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <span style={{ color: '#FFFFFF' }}>{commandeOuverte?.id === c.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Détail commande */}
              {commandeOuverte?.id === c.id && (
                <div className="border-t px-4 py-4 flex flex-col gap-4" style={{ borderColor: '#4A3820' }}>

                  {/* Lignes produits */}
                  {c.lignes && c.lignes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#FFFFFF' }}>Produits commandés</p>
                      <div className="flex flex-col gap-1">
                        {c.lignes.map((l, i) => (
                          <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-b-0" style={{ borderColor: '#4A3820' }}>
                            <span style={{ color: '#EDD98A' }}>{l.nom || l.produit_id}</span>
                            <span style={{ color: '#FFFFFF' }}>× {l.quantite || 1}</span>
                            <span style={{ color: '#F0B429' }}>{l.prix_unitaire != null ? `${l.prix_unitaire} €` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {c.notes && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#FFFFFF' }}>Notes</p>
                      <p className="text-sm" style={{ color: '#EDD98A' }}>{c.notes}</p>
                    </div>
                  )}

                  {/* Facture */}
                  <div>
                    <button
                      onClick={() => navigate(`/admin/facture/${c.id}`)}
                      className="text-sm px-4 py-2 rounded-lg font-medium"
                      style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820' }}>
                      📄 Voir / Créer la facture
                    </button>
                  </div>

                  {/* Changer statut */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#FFFFFF' }}>Changer le statut</p>
                    <div className="flex gap-2 flex-wrap">
                      {STATUTS.map(s => (
                        <button key={s.valeur} onClick={() => changerStatut(c.id, s.valeur)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                          style={c.statut === s.valeur
                            ? { background: s.couleur, color: '#1E1912' }
                            : { background: '#1E1912', color: s.couleur, border: `1px solid ${s.couleur}44` }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminCommandes
