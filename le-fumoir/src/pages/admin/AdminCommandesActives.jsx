import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'

const STATUTS = [
  { valeur: 'en_attente',     label: 'En attente',     couleur: '#EDD98A', bg: '#EDD98A18' },
  { valeur: 'autorisee',      label: 'Autorisée',      couleur: '#A78BFA', bg: '#A78BFA18' },
  { valeur: 'confirmee',      label: 'Confirmée',      couleur: '#F0B429', bg: '#F0B42918' },
  { valeur: 'en_preparation', label: 'En préparation', couleur: '#6B8E4E', bg: '#6B8E4E18' },
]

const ETAPES = ['confirmee', 'en_preparation', 'expediee']
const STATUTS_ACTIFS = ['en_attente', 'autorisee', 'confirmee', 'en_preparation']

function getStatut(valeur) {
  const tous = [...STATUTS, { valeur: 'expediee', label: 'Expédiée', couleur: '#4A90D9', bg: '#4A90D918' }]
  return tous.find(s => s.valeur === valeur) || { label: valeur, couleur: '#FFFFFF', bg: '#FFFFFF10' }
}

function initiales(profil) {
  if (!profil) return '?'
  return ((profil.prenom || '')[0] + (profil.nom || '')[0]).toUpperCase() || '?'
}

function Stepper({ statut, onChanger }) {
  const etapeActuelle = ETAPES.indexOf(statut)
  return (
    <div className="flex items-center gap-0">
      {ETAPES.map((e, i) => {
        const s = getStatut(e)
        const fait = i < etapeActuelle
        const actuel = i === etapeActuelle
        return (
          <div key={e} className="flex items-center" style={{ flex: i < ETAPES.length - 1 ? 1 : 'none' }}>
            <button onClick={() => onChanger(e)} title={s.label}
              style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                border: (actuel || fait) ? `2px solid ${s.couleur}` : '2px solid #4A3820',
                background: actuel ? s.couleur : fait ? s.couleur + '40' : '#1E1912',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {fait ? <span style={{ color: s.couleur, fontSize: '0.75rem', fontWeight: 700 }}>✓</span>
                : actuel ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1E1912', display: 'block' }} />
                : <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4A3820', display: 'block' }} />}
            </button>
            <div style={{ fontSize: '0.6rem', position: 'absolute', marginTop: 38, width: 60, textAlign: 'center', marginLeft: -14,
              color: actuel ? s.couleur : fait ? s.couleur + 'AA' : '#7A6A50', fontWeight: actuel ? 600 : 400 }}>
              {s.label}
            </div>
            {i < ETAPES.length - 1 && (
              <div style={{ flex: 1, height: 2, background: fait ? getStatut(ETAPES[i]).couleur + '60' : '#4A3820', margin: '0 2px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ModalConfirmRemboursement({ commande, onConfirmer, onAnnuler, enCours }) {
  const [saisie, setSaisie] = useState('')
  const estRemboursement = commande?.statut !== 'autorisee'
  const valide = saisie === 'CONFIRMER'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl border p-6 max-w-md w-full flex flex-col gap-4"
        style={{ background: '#1E1912', borderColor: '#B03A2E' }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <p className="text-base font-bold" style={{ color: '#B03A2E' }}>
              {estRemboursement ? 'Remboursement irréversible' : 'Annulation sans frais'}
            </p>
            <p className="text-xs" style={{ color: '#7A6A50' }}>Cette action ne peut pas être annulée</p>
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'rgba(176,58,46,0.1)', border: '1px solid rgba(176,58,46,0.3)' }}>
          {estRemboursement ? (
            <p className="text-sm" style={{ color: '#FFFFFF' }}>
              Tu vas rembourser <strong style={{ color: '#F0B429' }}>{parseFloat(commande.total || 0).toFixed(2)} €</strong> sur la carte du client.
              Le montant apparaîtra sous <strong>5 à 10 jours ouvrés</strong>.
            </p>
          ) : (
            <p className="text-sm" style={{ color: '#FFFFFF' }}>
              Tu vas annuler l'autorisation de <strong style={{ color: '#F0B429' }}>{parseFloat(commande.total || 0).toFixed(2)} €</strong>.
              La carte du client <strong>ne sera pas débitée</strong>.
            </p>
          )}
        </div>
        <div>
          <p className="text-xs mb-2" style={{ color: '#FFFFFF' }}>Tape <strong style={{ color: '#F0B429' }}>CONFIRMER</strong> pour valider :</p>
          <input value={saisie} onChange={e => setSaisie(e.target.value.toUpperCase())} placeholder="CONFIRMER"
            autoFocus className="w-full px-3 py-2 rounded-lg border text-sm outline-none font-mono tracking-widest"
            style={{ background: '#2C2518', borderColor: valide ? '#6B8E4E' : '#4A3820', color: '#EDD98A' }} />
        </div>
        <div className="flex gap-3">
          <button onClick={onAnnuler} disabled={enCours}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }}>Annuler</button>
          <button onClick={onConfirmer} disabled={!valide || enCours}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity"
            style={{ background: valide ? '#B03A2E' : '#4A3820', color: '#fff', opacity: enCours ? 0.6 : 1, cursor: valide && !enCours ? 'pointer' : 'not-allowed' }}>
            {enCours ? 'Traitement...' : estRemboursement ? '💳 Rembourser' : '✗ Annuler sans frais'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminCommandesActives() {
  const navigate = useNavigate()
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('')
  const [ouvertes, setOuvertes] = useState({})
  const [modalRemboursement, setModalRemboursement] = useState(null)
  const [remboursementEnCours, setRemboursementEnCours] = useState(false)

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data: rows } = await supabase
      .from('commandes')
      .select('*')
      .in('statut', STATUTS_ACTIFS)
      .order('created_at', { ascending: false })
    if (!rows) { setChargement(false); return }

    const profilIds = [...new Set(rows.map(r => r.profil_id).filter(Boolean))]
    let profilsMap = {}
    if (profilIds.length > 0) {
      const { data: profils } = await supabase.from('profils').select('id, prenom, nom').in('id', profilIds)
      ;(profils || []).forEach(p => { profilsMap[p.id] = p })
    }
    setCommandes(rows.map(r => ({ ...r, profils: profilsMap[r.profil_id] || null })))
    setChargement(false)
  }

  async function changerStatut(id, statut) {
    await supabase.from('commandes').update({ statut }).eq('id', id)
    if (statut === 'expediee') {
      setCommandes(prev => prev.filter(c => c.id !== id))
    } else {
      setCommandes(prev => prev.map(c => c.id === id ? { ...c, statut } : c))
    }
  }

  async function encaisser(id) {
    if (!confirm('Valider et encaisser le paiement de cette commande ?')) return
    const { error } = await supabase.functions.invoke('capturer-paiement', { body: { commandeId: id } })
    if (error) { alert('Erreur : ' + error.message); return }
    setCommandes(prev => prev.map(c => c.id === id ? { ...c, statut: 'confirmee' } : c))
  }

  async function confirmerRemboursement() {
    if (!modalRemboursement) return
    setRemboursementEnCours(true)
    const { error } = await supabase.functions.invoke('rembourser-commande', { body: { commandeId: modalRemboursement.id } })
    setRemboursementEnCours(false)
    setModalRemboursement(null)
    if (error) { alert('Erreur : ' + error.message); return }
    setCommandes(prev => prev.filter(c => c.id !== modalRemboursement.id))
  }

  async function supprimer(id) {
    if (!confirm('⛔ ATTENTION — Supprimer définitivement cette commande ?\n\nCette action est irréversible. Elle ne remboursera pas le client.')) return
    await supabase.from('commandes').delete().eq('id', id)
    setCommandes(prev => prev.filter(c => c.id !== id))
  }

  const commandesFiltrees = filtreStatut ? commandes.filter(c => c.statut === filtreStatut) : commandes
  const caPotentiel = commandes.reduce((s, c) => s + (parseFloat(c.total) || 0), 0)

  if (chargement) return <div className="flex items-center justify-center h-48"><p style={{ color: '#7A6A50', fontSize: '0.875rem' }}>Chargement…</p></div>

  return (
    <div className="flex flex-col gap-6">
      {modalRemboursement && (
        <ModalConfirmRemboursement commande={modalRemboursement}
          onConfirmer={confirmerRemboursement} onAnnuler={() => setModalRemboursement(null)} enCours={remboursementEnCours} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'CA potentiel', valeur: `${caPotentiel.toFixed(2)} €`, sous: `${commandes.length} commande${commandes.length > 1 ? 's' : ''} active${commandes.length > 1 ? 's' : ''}`, couleur: '#F0B429' },
          { label: 'À préparer', valeur: commandes.filter(c => c.statut === 'en_preparation').length, sous: 'en cours de préparation', couleur: '#6B8E4E' },
        ].map(({ label, valeur, sous, couleur }) => (
          <div key={label} className="rounded-xl p-4 border relative overflow-hidden" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, background: couleur, borderRadius: '12px 0 0 12px' }} />
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 ml-1" style={{ color: '#7A6A50' }}>{label}</p>
            <p className="text-3xl font-bold ml-1" style={{ color: couleur }}>{valeur}</p>
            <p className="text-xs mt-1 ml-1" style={{ color: '#7A6A50' }}>{sous}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
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
              style={filtreStatut === s.valeur ? { background: s.couleur, color: '#1E1912' } : { background: '#2C2518', color: s.couleur, border: `1px solid ${s.couleur}44` }}>
              {s.label} ({nb})
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {commandesFiltrees.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#7A6A50' }}>
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm">Aucune commande active en ce moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {commandesFiltrees.map(c => {
            const s = getStatut(c.statut)
            const ouvert = !!ouvertes[c.id]
            const nbLignes = (c.lignes || []).reduce((sum, l) => sum + (l.quantite || 1), 0)
            const prochaine = ETAPES[ETAPES.indexOf(c.statut) + 1]
            const prochaineS = prochaine ? getStatut(prochaine) : null

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
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-base font-bold" style={{ color: '#F0B429' }}>{c.total != null ? `${parseFloat(c.total).toFixed(2)} €` : '—'}</p>
                    <p className="text-xs" style={{ color: '#7A6A50' }}>{new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <span style={{ color: '#7A6A50', fontSize: '0.65rem', marginLeft: 4 }}>{ouvert ? '▲' : '▼'}</span>
                </button>

                {ouvert && (
                  <div className="border-t px-4 pt-4 pb-5 flex flex-col gap-5" style={{ borderColor: '#4A3820' }}>
                    {c.lignes?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#7A6A50' }}>Produits commandés</p>
                        <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#4A3820' }}>
                          {c.lignes.map((l, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0"
                              style={{ borderColor: '#4A3820', background: i % 2 === 0 ? '#1E1912' : '#2C2518' }}>
                              <span className="flex-1 text-sm font-medium" style={{ color: '#EDD98A' }}>
                                {l.nom || '—'}
                                {l.mode_realisation === 'soi-meme' && <span className="ml-2 text-xs font-normal" style={{ color: '#7A6A50' }}>· à faire soi-même</span>}
                                {l.epices?.length > 0 && <span className="ml-2 text-xs font-normal" style={{ color: '#7A6A50' }}>· {l.epices.map(e => e.nom).join(', ')}</span>}
                              </span>
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

                    {c.notes && (
                      <div className="rounded-lg px-3 py-2" style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#7A6A50' }}>Note client</p>
                        <p className="text-sm" style={{ color: '#EDD98A' }}>{c.notes}</p>
                      </div>
                    )}

                    {c.adresse_livraison && (
                      <div className="rounded-lg px-3 py-2" style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#7A6A50' }}>Adresse de livraison</p>
                        <p className="text-sm" style={{ color: '#EDD98A' }}>{c.adresse_livraison}</p>
                      </div>
                    )}

                    {c.statut === 'autorisee' && (
                      <div className="rounded-xl p-4 flex flex-col gap-3"
                        style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)' }}>
                        <p className="text-sm font-semibold" style={{ color: '#A78BFA' }}>⏳ Paiement pré-autorisé — carte non encore débitée</p>
                        <p className="text-xs" style={{ color: '#FFFFFF' }}>Valide pour encaisser, ou annule si tu ne peux pas honorer la commande (aucun débit).</p>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => encaisser(c.id)} className="text-sm px-4 py-2 rounded-lg font-semibold"
                            style={{ background: '#6B8E4E', color: '#fff' }}>✅ Valider & Encaisser</button>
                          <button onClick={() => setModalRemboursement(c)} className="text-sm px-4 py-2 rounded-lg font-semibold"
                            style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>✗ Annuler sans frais</button>
                        </div>
                      </div>
                    )}

                    {['confirmee', 'en_preparation', 'expediee'].includes(c.statut) && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#7A6A50' }}>Avancement</p>
                        <div className="relative" style={{ paddingBottom: 24 }}>
                          <Stepper statut={c.statut} onChanger={(val) => changerStatut(c.id, val)} />
                        </div>
                        {prochaineS && (
                          <button onClick={() => changerStatut(c.id, prochaine)} className="mt-2 text-sm px-4 py-2 rounded-lg font-semibold"
                            style={{ background: prochaineS.couleur, color: '#1E1912' }}>
                            → {prochaine === 'expediee' ? 'Marquer comme expédiée (→ Historique)' : `Passer à : ${prochaineS.label}`}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap pt-1" style={{ borderTop: '1px solid #4A3820' }}>
                      <button onClick={() => navigate(`/admin/facture/${c.id}`)} className="text-sm px-3 py-1.5 rounded-lg font-medium"
                        style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820' }}>📄 Facture</button>
                      {['confirmee', 'en_preparation'].includes(c.statut) && (
                        <button onClick={() => setModalRemboursement(c)} className="text-sm px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: 'rgba(176,58,46,0.1)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>💳 Rembourser</button>
                      )}
                      {c.statut === 'en_attente' && (
                        <button onClick={() => supprimer(c.id)} className="text-sm px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.5)' }}>🗑️ Supprimer</button>
                      )}
                      <span className="text-xs ml-auto" style={{ color: '#7A6A50' }}>#{c.id.slice(0, 8).toUpperCase()}</span>
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

export default AdminCommandesActives
