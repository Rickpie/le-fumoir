import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'

const STATUTS = {
  en_attente:    { label: 'En attente de traitement', couleur: '#EDD98A', info: 'Votre commande a bien été reçue et sera traitée prochainement.' },
  confirmee:     { label: 'Confirmée',                couleur: '#F0B429', info: 'Votre commande est confirmée et va être préparée.' },
  en_preparation:{ label: 'En préparation',           couleur: '#6B8E4E', info: 'Votre commande est en cours de préparation.' },
  expediee:      { label: 'Expédiée',                 couleur: '#4A90D9', info: 'Votre commande est en route !' },
  annulee:       { label: 'Annulée',                  couleur: '#B03A2E', info: 'Cette commande a été annulée.' },
}

function badgeStatut(statut) {
  const s = STATUTS[statut] || { label: statut, couleur: '#FFFFFF' }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.couleur + '22', color: s.couleur, border: `1px solid ${s.couleur}44` }}>
      {s.label}
    </span>
  )
}

function Profil() {
  const { profil, utilisateur, seDeconnecter } = useAuth()
  const navigate = useNavigate()

  // Infos profil
  const [prenom, setPrenom] = useState(profil?.prenom || '')
  const [nom, setNom] = useState(profil?.nom || '')
  const [adresse, setAdresse] = useState(profil?.adresse || '')
  const [codePostal, setCodePostal] = useState(profil?.code_postal || '')
  const [telephone, setTelephone] = useState(profil?.telephone || '')
  const [enregistrement, setEnregistrement] = useState(false)
  const [succes, setSucces] = useState(false)

  // Changement mot de passe
  const [mdpActuel, setMdpActuel] = useState('')
  const [mdpNouveau, setMdpNouveau] = useState('')
  const [mdpConfirm, setMdpConfirm] = useState('')
  const [visibleMdp, setVisibleMdp] = useState(false)
  const [mdpChargement, setMdpChargement] = useState(false)
  const [mdpSucces, setMdpSucces] = useState('')
  const [mdpErreur, setMdpErreur] = useState('')

  // Suppression compte
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)

  // Commandes
  const [commandes, setCommandes] = useState([])
  const [commandeOuverte, setCommandeOuverte] = useState(null)
  const [chargementCommandes, setChargementCommandes] = useState(true)

  useEffect(() => {
    if (utilisateur?.id) chargerCommandes()
  }, [utilisateur])

  async function chargerCommandes() {
    const { data } = await supabase
      .from('commandes').select('*')
      .eq('profil_id', utilisateur.id)
      .order('created_at', { ascending: false })
    setCommandes(data || [])
    setChargementCommandes(false)
  }

  async function enregistrer(e) {
    e.preventDefault()
    setEnregistrement(true)
    setSucces(false)
    await supabase.from('profils').update({ prenom, nom, adresse, code_postal: codePostal, telephone }).eq('id', utilisateur.id)
    setEnregistrement(false)
    setSucces(true)
    setTimeout(() => setSucces(false), 3000)
  }

  async function changerMotDePasse(e) {
    e.preventDefault()
    setMdpErreur('')
    setMdpSucces('')
    if (mdpNouveau.length < 6) { setMdpErreur('Le mot de passe doit faire au moins 6 caractères.'); return }
    if (mdpNouveau !== mdpConfirm) { setMdpErreur('Les mots de passe ne correspondent pas.'); return }
    setMdpChargement(true)
    // Vérifier l'ancien mot de passe en se reconnectant
    const { error: errVerif } = await supabase.auth.signInWithPassword({ email: utilisateur.email, password: mdpActuel })
    if (errVerif) { setMdpErreur('Mot de passe actuel incorrect.'); setMdpChargement(false); return }
    const { error } = await supabase.auth.updateUser({ password: mdpNouveau })
    if (error) { setMdpErreur('Erreur lors du changement : ' + error.message) }
    else { setMdpSucces('Mot de passe modifié avec succès.'); setMdpActuel(''); setMdpNouveau(''); setMdpConfirm('') }
    setMdpChargement(false)
  }

  async function supprimerCompte() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) return
    if (!confirm('Dernière confirmation : toutes vos données seront effacées.')) return
    setSuppressionEnCours(true)
    const { error } = await supabase.functions.invoke('supprimer-compte')
    if (error) {
      alert('Erreur lors de la suppression. Veuillez contacter le support.')
      setSuppressionEnCours(false)
      return
    }
    await seDeconnecter()
    navigate('/')
  }

  const labelStyle = { color: '#FFFFFF' }
  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">

      {/* Infos personnelles */}
      <div>
        <h1 className="text-2xl font-medium mb-4" style={{ color: '#EDD98A' }}>Mon profil</h1>
        <form onSubmit={enregistrer} className="rounded-xl border p-4 flex flex-col gap-3"
          style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Email</label>
            <input value={utilisateur?.email || ''} disabled
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none opacity-50" style={inputStyle} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1 font-medium" style={labelStyle}>Prénom</label>
              <input value={prenom} onChange={e => setPrenom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1 font-medium" style={labelStyle}>Nom</label>
              <input value={nom} onChange={e => setNom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Adresse de livraison</label>
            <input value={adresse} onChange={e => setAdresse(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1 font-medium" style={labelStyle}>Code postal</label>
              <input value={codePostal} onChange={e => setCodePostal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1 font-medium" style={labelStyle}>Téléphone</label>
              <input value={telephone} onChange={e => setTelephone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          {succes && <p className="text-xs" style={{ color: '#6B8E4E' }}>✓ Profil mis à jour</p>}
          <button type="submit" disabled={enregistrement}
            className="px-4 py-2 rounded-lg text-sm font-semibold self-start transition-opacity"
            style={{ background: '#F0B429', color: '#1E1912', opacity: enregistrement ? 0.6 : 1 }}>
            {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* Changer le mot de passe */}
      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: '#EDD98A' }}>Changer le mot de passe</h2>
        <form onSubmit={changerMotDePasse} className="rounded-xl border p-4 flex flex-col gap-3"
          style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          {[
            { label: 'Mot de passe actuel', val: mdpActuel, set: setMdpActuel },
            { label: 'Nouveau mot de passe', val: mdpNouveau, set: setMdpNouveau },
            { label: 'Confirmer le nouveau mot de passe', val: mdpConfirm, set: setMdpConfirm },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-xs mb-1 font-medium" style={labelStyle}>{label}</label>
              <div className="relative">
                <input type={visibleMdp ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)} required
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none pr-20" style={inputStyle} />
                <button type="button" onClick={() => setVisibleMdp(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: '#7A6A50', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {visibleMdp ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>
          ))}
          {mdpErreur && <p className="text-xs" style={{ color: '#B03A2E' }}>{mdpErreur}</p>}
          {mdpSucces && <p className="text-xs" style={{ color: '#6B8E4E' }}>✓ {mdpSucces}</p>}
          <button type="submit" disabled={mdpChargement}
            className="px-4 py-2 rounded-lg text-sm font-semibold self-start transition-opacity"
            style={{ background: '#2C2518', color: '#EDD98A', border: '1px solid #4A3820', opacity: mdpChargement ? 0.6 : 1 }}>
            {mdpChargement ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>

      {/* Mes achats tutoriels */}
      <div>
        <h2 className="text-lg font-medium mb-2" style={{ color: '#EDD98A' }}>Mes tutoriels achetés</h2>
        <TutorielsAchetes utilisateurId={utilisateur?.id} />
      </div>

      {/* Historique des commandes */}
      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: '#EDD98A' }}>Mes commandes</h2>
        {chargementCommandes ? (
          <p className="text-sm" style={{ color: '#FFFFFF' }}>Chargement...</p>
        ) : commandes.length === 0 ? (
          <div className="rounded-xl border p-6 text-center" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <p className="text-3xl mb-2">🛍️</p>
            <p className="text-sm" style={{ color: '#FFFFFF' }}>Vous n'avez pas encore de commande.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {commandes.map(c => {
              const s = STATUTS[c.statut] || { label: c.statut, couleur: '#FFFFFF', info: '' }
              const ouvert = commandeOuverte === c.id
              return (
                <div key={c.id} className="rounded-xl border overflow-hidden"
                  style={{ background: '#2C2518', borderColor: ouvert ? '#F0B429' : '#4A3820' }}>
                  <div style={{ height: 3, background: s.couleur }} />
                  <button onClick={() => setCommandeOuverte(ouvert ? null : c.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>
                        {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {badgeStatut(c.statut)}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: '#F0B429' }}>
                        {c.total != null ? `${parseFloat(c.total).toFixed(2)} €` : '—'}
                      </span>
                      <span style={{ color: '#FFFFFF', fontSize: '0.7rem' }}>{ouvert ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {ouvert && (
                    <div className="border-t px-4 py-4 flex flex-col gap-3" style={{ borderColor: '#4A3820' }}>
                      <p className="text-xs rounded-lg px-3 py-2" style={{ background: s.couleur + '15', color: s.couleur, border: `1px solid ${s.couleur}33` }}>
                        {s.info}
                      </p>
                      {c.lignes && c.lignes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#7A6A50' }}>
                            Produits commandés
                          </p>
                          <div className="flex flex-col gap-1">
                            {c.lignes.map((l, i) => (
                              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                                style={{ borderColor: '#4A3820' }}>
                                <div>
                                  <span style={{ color: '#EDD98A' }}>{l.nom}</span>
                                  {l.mode_realisation === 'soi-meme' && (
                                    <span className="text-xs ml-2" style={{ color: '#7A6A50' }}>· À sécher soi-même</span>
                                  )}
                                  {l.epices?.length > 0 && (
                                    <span className="text-xs ml-2" style={{ color: '#7A6A50' }}>
                                      · {l.epices.map(e => e.nom).join(', ')}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <span style={{ color: '#FFFFFF' }}>× {l.quantite ?? 1}</span>
                                  <span style={{ color: '#F0B429' }}>
                                    {l.prix_unitaire != null ? `${parseFloat(l.prix_unitaire).toFixed(2)} €` : ''}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {c.adresse_livraison && (
                        <p className="text-xs" style={{ color: '#7A6A50' }}>
                          Livraison : {c.adresse_livraison}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* Zone danger — Suppression du compte */}
      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: '#B03A2E' }}>Zone danger</h2>
        <div className="rounded-xl border p-4" style={{ background: 'rgba(176,58,46,0.08)', borderColor: 'rgba(176,58,46,0.3)' }}>
          <p className="text-sm mb-3" style={{ color: '#FFFFFF' }}>
            La suppression de votre compte est <strong>irréversible</strong>. Toutes vos données (profil, historique de commandes, accès aux tutoriels) seront définitivement effacées.
          </p>
          <button onClick={supprimerCompte} disabled={suppressionEnCours}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
            style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.4)', opacity: suppressionEnCours ? 0.6 : 1 }}>
            {suppressionEnCours ? 'Suppression...' : 'Supprimer mon compte'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TutorielsAchetes({ utilisateurId }) {
  const [achats, setAchats] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!utilisateurId) { setChargement(false); return }
    supabase
      .from('tutoriel_achats')
      .select('id, statut, created_at, tutoriel_id, pack_id, tutoriels:tutoriel_id (titre), packs:pack_id (titre)')
      .eq('profil_id', utilisateurId)
      .eq('statut', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setAchats(data || []); setChargement(false) })
  }, [utilisateurId])

  if (chargement) return <p className="text-sm" style={{ color: '#FFFFFF' }}>Chargement...</p>
  if (achats.length === 0) return (
    <div className="rounded-xl border p-4 text-center" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
      <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucun tutoriel acheté pour l'instant.</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      {achats.map(a => (
        <div key={a.id} className="rounded-lg border px-4 py-3 flex items-center gap-3"
          style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <span style={{ color: '#6B8E4E', fontSize: '1.1rem' }}>✓</span>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: '#EDD98A' }}>
              {a.tutoriels?.titre || a.packs?.titre || 'Produit supprimé'}
            </p>
            <p className="text-xs" style={{ color: '#7A6A50' }}>
              {a.pack_id ? 'Pack' : 'Tutoriel'} — acheté le {new Date(a.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Profil
