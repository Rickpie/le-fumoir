import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

const CARD_STYLE = {
  background: '#2C2518',
  border: '1px solid #4A3820',
  borderTop: '2px solid rgba(240,180,41,0.5)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
}

function CarteTutoriel({ tuto, onOuvrir, estAdmin, onModifier, onSupprimer, accesOk }) {
  const achete = accesOk && !tuto.gratuit && !estAdmin

  return (
    <div
      onClick={() => onOuvrir(tuto)}
      className="rounded-xl cursor-pointer flex flex-col overflow-hidden relative"
      style={CARD_STYLE}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px #F0B429' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {estAdmin && (
        <div className="absolute top-2 right-2 z-10 flex gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={e => onModifier(e, tuto)} className="text-xs px-2 py-1 rounded-md font-medium"
            style={{ background: 'rgba(240,180,41,0.9)', color: '#1E1912' }}>✏️</button>
          <button onClick={e => onSupprimer(e, tuto.id)} className="text-xs px-2 py-1 rounded-md font-medium"
            style={{ background: 'rgba(176,58,46,0.9)', color: '#fff' }}>🗑️</button>
        </div>
      )}
      <div className="relative overflow-hidden" style={{ height: '200px' }}>
        {tuto.photo_url
          ? <img src={tuto.photo_url} alt={tuto.titre} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: '#3A2E1A' }}>📖</div>
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 30%, rgba(28,22,14,0.75) 100%)' }} />
        <span className="absolute bottom-2 left-3 text-xs px-2 py-0.5 rounded-full font-medium"
          style={tuto.gratuit
            ? { background: 'rgba(107,142,78,0.85)', color: '#fff', backdropFilter: 'blur(4px)' }
            : achete
              ? { background: 'rgba(107,142,78,0.9)', color: '#fff', backdropFilter: 'blur(4px)' }
              : { background: 'rgba(240,180,41,0.9)', color: '#1E1912', backdropFilter: 'blur(4px)' }}>
          {tuto.gratuit ? 'Gratuit' : achete ? '✓ Acheté' : `${tuto.prix} €`}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-sm mb-1 leading-snug" style={{ color: '#EDD98A' }}>{tuto.titre}</h3>
        {tuto.sous_titre && <p className="text-xs line-clamp-2 flex-1" style={{ color: '#FFFFFF' }}>{tuto.sous_titre}</p>}
        <div className="mt-3 pt-3 flex items-center justify-end" style={{ borderTop: '1px solid #4A3820' }}>
          <span className="text-xs font-medium" style={{ color: achete ? '#6B8E4E' : '#F0B429' }}>
            {tuto.gratuit || achete ? 'Lire →' : 'Voir le tutoriel →'}
          </span>
        </div>
      </div>
    </div>
  )
}

function Tutoriels() {
  const [tutoriels, setTutoriels] = useState([])
  const [packs, setPacks] = useState([])
  const [achats, setAchats] = useState([]) // tutoriel_ids achetés par l'utilisateur
  const [tutoSelectionne, setTutoSelectionne] = useState(null)
  const [packSelectionne, setPackSelectionne] = useState(null)
  const [contenuPack, setContenuPack] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [achatEnCours, setAchatEnCours] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profil, utilisateur } = useAuth()
  const estAdmin = profil?.role === 'admin'

  useEffect(() => {
    chargerDonnees()
    if (searchParams.get('achat') === 'succes') {
      window.history.replaceState({}, '', '/tutoriels')
    }
  }, [])

  useEffect(() => {
    if (utilisateur?.id) chargerAchats()
    else setAchats([])
  }, [utilisateur?.id])

  async function chargerDonnees() {
    const [{ data: tutos }, { data: pks }] = await Promise.all([
      supabase.from('tutoriels')
        .select('id, titre, sous_titre, gratuit, prix, photo_url, visible, ordre, created_at')
        .eq('visible', true)
        .order('gratuit', { ascending: false })
        .order('ordre', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase.from('packs')
        .select('*')
        .eq('visible', true)
        .order('created_at', { ascending: false }),
    ])
    setTutoriels(tutos || [])
    setPacks(pks || [])
    setChargement(false)
  }

  async function chargerAchats() {
    const { data } = await supabase
      .from('tutoriel_achats')
      .select('tutoriel_id, pack_id')
      .eq('profil_id', utilisateur.id)
      .eq('statut', 'active')
    setAchats(data || [])
  }

  function aAcces(tuto) {
    if (tuto.gratuit || estAdmin) return true
    return achats.some(a => a.tutoriel_id === tuto.id)
  }

  async function ouvrirTuto(tuto) {
    // Fire and forget — le builder Supabase ne rejette jamais, pas besoin de .catch()
    supabase.rpc('incrementer_clics_tutoriel', { tutoriel_id: tuto.id })

    if (tuto.gratuit || estAdmin || aAcces(tuto)) {
      setTutoSelectionne({ ...tuto, contenu: null }) // Affiche la vue immédiatement
      const { data } = await supabase.from('tutoriels').select('contenu, pdf_url').eq('id', tuto.id).single()
      setTutoSelectionne(prev => prev?.id === tuto.id ? { ...prev, contenu: data?.contenu, pdf_url: data?.pdf_url } : prev)
    } else {
      setTutoSelectionne({ ...tuto, contenu: null })
    }
  }

  async function acheterTutoriel(tutoId) {
    if (!utilisateur) { navigate('/connexion'); return }
    setAchatEnCours(true)
    const { data, error } = await supabase.functions.invoke('creer-session-tutoriel', {
      body: { tutorielId: tutoId, siteUrl: window.location.origin },
    })
    if (error || !data?.url) {
      alert('Erreur lors de la création du paiement. Veuillez réessayer.')
      setAchatEnCours(false)
      return
    }
    window.location.href = data.url
  }

  async function acheterPack(packId) {
    if (!utilisateur) { navigate('/connexion'); return }
    setAchatEnCours(true)
    const { data, error } = await supabase.functions.invoke('creer-session-tutoriel', {
      body: { packId, siteUrl: window.location.origin },
    })
    if (error || !data?.url) {
      alert('Erreur lors de la création du paiement. Veuillez réessayer.')
      setAchatEnCours(false)
      return
    }
    window.location.href = data.url
  }

  function modifierTuto(e, tuto) {
    e.stopPropagation()
    navigate(`/admin/tutoriels?edit=${tuto.id}`)
  }

  async function supprimerTuto(e, tutoId) {
    e.stopPropagation()
    if (!confirm('Supprimer définitivement ce tutoriel ?')) return
    await supabase.from('tutoriels').delete().eq('id', tutoId)
    chargerDonnees()
  }

  async function ouvrirPack(pack) {
    const [{ data: pt }, { data: pp }, { data: pf }] = await Promise.all([
      supabase.from('pack_tutoriels').select('tutoriel_id, tutoriels:tutoriel_id (titre, prix)').eq('pack_id', pack.id),
      supabase.from('pack_produits').select('produit_id, produits:produit_id (nom, prix)').eq('pack_id', pack.id),
      supabase.from('pack_fichiers').select('fichier_id, fichiers_telechargeables:fichier_id (nom, prix, fichier_url)').eq('pack_id', pack.id),
    ])
    const tutos = (pt || []).map(x => x.tutoriels).filter(Boolean)
    const prods = (pp || []).map(x => x.produits).filter(Boolean)
    const fichs = (pf || []).map(x => x.fichiers_telechargeables).filter(Boolean)
    const totalSepare = [...tutos, ...prods, ...fichs].reduce((sum, item) => sum + (parseFloat(item.prix) || 0), 0)
    setContenuPack({ tutoriels: tutos, produits: prods, fichiers: fichs, totalSepare })
    setPackSelectionne(pack)
  }

  if (chargement) return (
    <div className="flex items-center justify-center h-40">
      <p style={{ color: '#FFFFFF' }}>Chargement...</p>
    </div>
  )

  // Notif achat réussi
  const achatSucces = searchParams.get('achat') === 'succes'

  // VUE DÉTAIL PACK
  if (packSelectionne) {
    const packAchete = achats.some(a => a.pack_id === packSelectionne.id)
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { setPackSelectionne(null); setContenuPack(null) }}
            className="text-sm flex items-center gap-1" style={{ color: '#FFFFFF' }}>
            ← Retour aux tutoriels
          </button>
          {estAdmin && (
            <div className="flex gap-2">
              <button onClick={() => navigate(`/admin/packs?edit=${packSelectionne.id}`)}
                className="text-xs px-3 py-1.5 rounded-md font-medium"
                style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
                ✏️ Modifier
              </button>
              <button onClick={async () => {
                if (!confirm('Supprimer ce pack définitivement ?')) return
                await supabase.from('packs').delete().eq('id', packSelectionne.id)
                setPackSelectionne(null); setContenuPack(null); chargerDonnees()
              }}
                className="text-xs px-3 py-1.5 rounded-md font-medium"
                style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                🗑️ Supprimer
              </button>
            </div>
          )}
        </div>
        <div className="rounded-2xl border p-6 sm:p-8" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          {packSelectionne.photo_url && (
            <img src={packSelectionne.photo_url} alt={packSelectionne.titre}
              className="w-full h-56 object-cover rounded-xl mb-6" />
          )}
          <span className="inline-block text-xs mb-3 px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
            Pack
          </span>
          <h1 className="text-3xl font-medium mb-2" style={{ color: '#EDD98A' }}>{packSelectionne.titre}</h1>
          {packSelectionne.description && (
            <p className="text-base mb-6" style={{ color: '#FFFFFF' }}>{packSelectionne.description}</p>
          )}
          <div className="border-t mb-6" style={{ borderColor: '#4A3820' }} />
          <h2 className="text-lg font-medium mb-3" style={{ color: '#EDD98A' }}>Ce pack contient :</h2>
          {contenuPack?.tutoriels.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: '#F0B429' }}>📖 Tutoriels</p>
              <ul className="text-sm" style={{ color: '#EDD98A' }}>
                {contenuPack.tutoriels.map(t => (
                  <li key={t.titre} className="flex justify-between py-0.5">
                    <span>• {t.titre}</span><span style={{ color: '#FFFFFF' }}>{t.prix} €</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contenuPack?.produits.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: '#F0B429' }}>🥩 Produits</p>
              <ul className="text-sm" style={{ color: '#EDD98A' }}>
                {contenuPack.produits.map(p => (
                  <li key={p.nom} className="flex justify-between py-0.5">
                    <span>• {p.nom}</span><span style={{ color: '#FFFFFF' }}>{p.prix} €</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contenuPack?.fichiers.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2" style={{ color: '#F0B429' }}>📄 Fichiers inclus</p>
              <div className="flex flex-col gap-2">
                {contenuPack.fichiers.map(f => (
                  <div key={f.nom} className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
                    <span className="text-sm" style={{ color: '#EDD98A' }}>📄 {f.nom}</span>
                    {(packAchete || estAdmin) && f.fichier_url ? (
                      <a href={f.fichier_url} target="_blank" rel="noopener noreferrer" download
                        className="text-xs px-3 py-1 rounded-md font-semibold"
                        style={{ background: 'rgba(107,142,78,0.2)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.3)' }}>
                        Télécharger ↓
                      </a>
                    ) : (
                      <span className="text-xs" style={{ color: '#7A6A50' }}>
                        {f.prix > 0 ? `${f.prix} €` : 'inclus'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {contenuPack?.totalSepare > packSelectionne.prix && (
            <div className="flex items-center justify-between mb-4 text-sm" style={{ color: '#FFFFFF' }}>
              <span>Prix si acheté séparément</span>
              <span className="line-through">{contenuPack.totalSepare.toFixed(2)} €</span>
            </div>
          )}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
            <span className="text-lg font-semibold" style={{ color: '#F0B429' }}>{packSelectionne.prix} €</span>
            {packAchete || estAdmin ? (
              <span className="text-sm px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(107,142,78,0.2)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.3)' }}>
                ✓ Déjà acheté
              </span>
            ) : (
              <button onClick={() => acheterPack(packSelectionne.id)} disabled={achatEnCours}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                style={{ background: '#F0B429', color: '#1E1912', opacity: achatEnCours ? 0.6 : 1 }}>
                {achatEnCours ? 'Redirection...' : 'Acheter ce pack'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // VUE DÉTAIL TUTORIEL
  if (tutoSelectionne) {
    const accesOk = aAcces(tutoSelectionne)
    return (
      <div>
        <button onClick={() => setTutoSelectionne(null)}
          className="text-sm mb-6 flex items-center gap-1" style={{ color: '#FFFFFF' }}>
          ← Retour aux tutoriels
        </button>
        <div className="rounded-2xl border p-6 sm:p-8" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          {tutoSelectionne.photo_url && (
            <img src={tutoSelectionne.photo_url} alt={tutoSelectionne.titre}
              className="w-full h-56 object-cover rounded-xl mb-6" />
          )}
          <span className="inline-block text-xs mb-3 px-2 py-0.5 rounded-full font-medium"
            style={tutoSelectionne.gratuit
              ? { background: 'rgba(107,142,78,0.2)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.3)' }
              : { background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
            {tutoSelectionne.gratuit ? 'Gratuit' : `Payant — ${tutoSelectionne.prix} €`}
          </span>
          <h1 className="text-3xl font-medium mb-2" style={{ color: '#EDD98A' }}>{tutoSelectionne.titre}</h1>
          {tutoSelectionne.sous_titre && (
            <p className="text-base mb-3" style={{ color: '#FFFFFF' }}>{tutoSelectionne.sous_titre}</p>
          )}
          {tutoSelectionne.created_at && (
            <p className="text-xs mb-6" style={{ color: '#FFFFFF' }}>
              Publié le {new Date(tutoSelectionne.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          <div className="border-t mb-6" style={{ borderColor: '#4A3820' }} />
          {accesOk ? (
            <>
              <div className="prose prose-base max-w-none article-tutoriel" style={{ color: '#EDD98A' }}
                dangerouslySetInnerHTML={{ __html: tutoSelectionne.contenu }} />
              {tutoSelectionne.pdf_url && (
                <div className="mt-8 pt-6" style={{ borderTop: '1px solid #4A3820' }}>
                  <a href={tutoSelectionne.pdf_url} target="_blank" rel="noopener noreferrer" download
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'rgba(107,142,78,0.15)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.3)' }}>
                    📄 Télécharger en PDF
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 rounded-xl" style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
              <p className="text-3xl mb-3">🔒</p>
              <p className="text-sm mb-2" style={{ color: '#FFFFFF' }}>
                Ce tutoriel est payant. Achète-le pour débloquer le contenu complet.
              </p>
              {!utilisateur && (
                <p className="text-xs mb-4" style={{ color: '#7A6A50' }}>
                  Tu dois être connecté pour acheter.
                </p>
              )}
              <button onClick={() => acheterTutoriel(tutoSelectionne.id)} disabled={achatEnCours}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                style={{ background: '#F0B429', color: '#1E1912', opacity: achatEnCours ? 0.6 : 1 }}>
                {achatEnCours ? 'Redirection vers le paiement...' : `Acheter pour ${tutoSelectionne.prix} €`}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // VUE LISTE
  const gratuits = tutoriels.filter(t => t.gratuit)
  const payants = tutoriels.filter(t => !t.gratuit)

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#EDD98A' }}>Tutoriels</h1>

      {achatSucces && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(107,142,78,0.15)', border: '1px solid rgba(107,142,78,0.3)' }}>
          <span className="text-xl">🎉</span>
          <p className="text-sm" style={{ color: '#6B8E4E' }}>
            Achat confirmé ! Votre accès est maintenant activé. Un email de confirmation vous a été envoyé.
          </p>
        </div>
      )}

      {tutoriels.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#FFFFFF' }}>
          <p className="text-4xl mb-3">📖</p>
          <p className="text-sm">Aucun tutoriel disponible pour le moment.</p>
        </div>
      ) : (
        <>
          {gratuits.length > 0 && (
            <>
              <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: '#6B8E4E' }}>
                Tutoriels gratuits
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {gratuits.map(tuto => (
                  <CarteTutoriel key={tuto.id} tuto={tuto} onOuvrir={ouvrirTuto}
                    estAdmin={estAdmin} onModifier={modifierTuto} onSupprimer={supprimerTuto}
                    accesOk={aAcces(tuto)} />
                ))}
              </div>
            </>
          )}
          {payants.length > 0 && (
            <>
              <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: '#F0B429' }}>
                Tutoriels payants
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {payants.map(tuto => (
                  <CarteTutoriel key={tuto.id} tuto={tuto} onOuvrir={ouvrirTuto}
                    estAdmin={estAdmin} onModifier={modifierTuto} onSupprimer={supprimerTuto}
                    accesOk={aAcces(tuto)} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {packs.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: '#FFFFFF' }}>Packs disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packs.map(pack => {
              const packAchete = !estAdmin && achats.some(a => a.pack_id === pack.id)
              return (
              <div key={pack.id} onClick={() => ouvrirPack(pack)}
                className="rounded-xl cursor-pointer flex flex-col overflow-hidden relative"
                style={CARD_STYLE}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px #F0B429' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {estAdmin && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => navigate(`/admin/packs?edit=${pack.id}`)}
                      className="text-xs px-2 py-1 rounded-md font-medium"
                      style={{ background: 'rgba(240,180,41,0.9)', color: '#1E1912' }}>✏️</button>
                    <button onClick={async () => { if (!confirm('Supprimer ce pack ?')) return; await supabase.from('packs').delete().eq('id', pack.id); chargerDonnees() }}
                      className="text-xs px-2 py-1 rounded-md font-medium"
                      style={{ background: 'rgba(176,58,46,0.9)', color: '#fff' }}>🗑️</button>
                  </div>
                )}
                <div className="relative overflow-hidden" style={{ height: '200px' }}>
                  {pack.photo_url
                    ? <img src={pack.photo_url} alt={pack.titre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: '#3A2E1A' }}>📦</div>
                  }
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 30%, rgba(28,22,14,0.75) 100%)' }} />
                  <span className="absolute bottom-2 left-3 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={packAchete
                      ? { background: 'rgba(107,142,78,0.9)', color: '#fff', backdropFilter: 'blur(4px)' }
                      : { background: 'rgba(240,180,41,0.9)', color: '#1E1912' }}>
                    {packAchete ? '✓ Acheté' : `Pack — ${pack.prix} €`}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-sm leading-snug" style={{ color: '#EDD98A' }}>{pack.titre}</h3>
                  {pack.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#FFFFFF' }}>{pack.description}</p>}
                  <div className="mt-3 pt-3 flex items-center justify-end" style={{ borderTop: '1px solid #4A3820' }}>
                    <span className="text-xs font-medium" style={{ color: packAchete ? '#6B8E4E' : '#F0B429' }}>
                      {packAchete ? 'Accéder →' : 'Voir le pack →'}
                    </span>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Tutoriels
