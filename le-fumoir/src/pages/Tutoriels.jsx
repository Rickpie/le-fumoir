import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'

const ETOILES = [1, 2, 3, 4, 5]

function AffichageEtoiles({ note, taille = '14px' }) {
  return (
    <span>
      {ETOILES.map(n => (
        <span key={n} style={{ color: n <= note ? '#F0B429' : '#4A3820', fontSize: taille }}>★</span>
      ))}
    </span>
  )
}

function SectionAvis({ tutoId, utilisateur }) {
  const [avis, setAvis] = useState([])
  const [monAvis, setMonAvis] = useState(null)
  const [form, setForm] = useState({ note: 0, commentaire: '' })
  const [survol, setSurvol] = useState(0)
  const [envoi, setEnvoi] = useState(false)
  const [afficherForm, setAfficherForm] = useState(false)

  useEffect(() => {
    chargerAvis()
    if (utilisateur?.id) chargerMonAvis()
  }, [tutoId, utilisateur?.id])

  async function chargerAvis() {
    const { data } = await supabase
      .from('avis')
      .select('note, commentaire, cree_le, profils:profil_id (prenom)')
      .eq('tutoriel_id', tutoId)
      .eq('approuve', true)
      .order('cree_le', { ascending: false })
    setAvis(data || [])
  }

  async function chargerMonAvis() {
    const { data } = await supabase
      .from('avis')
      .select('*')
      .eq('tutoriel_id', tutoId)
      .eq('profil_id', utilisateur.id)
      .maybeSingle()
    setMonAvis(data)
    if (data) setForm({ note: data.note, commentaire: data.commentaire || '' })
  }

  async function soumettre(e) {
    e.preventDefault()
    if (form.note === 0) return
    setEnvoi(true)
    await supabase.from('avis').upsert({
      tutoriel_id: tutoId,
      profil_id: utilisateur.id,
      note: form.note,
      commentaire: form.commentaire,
      approuve: false,
    }, { onConflict: 'profil_id,tutoriel_id' })
    await chargerMonAvis()
    setAfficherForm(false)
    setEnvoi(false)
  }

  const moyenne = avis.length > 0 ? (avis.reduce((s, a) => s + a.note, 0) / avis.length) : null

  return (
    <div className="mt-8 pt-6" style={{ borderTop: '1px solid #4A3820' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: '#EDD98A' }}>
          Avis {avis.length > 0 && `(${avis.length})`}
        </h3>
        {moyenne && (
          <div className="flex items-center gap-2">
            <AffichageEtoiles note={Math.round(moyenne)} />
            <span className="text-xs" style={{ color: '#FFFFFF' }}>{moyenne.toFixed(1)}/5</span>
          </div>
        )}
      </div>

      {utilisateur && !afficherForm && (
        <button onClick={() => setAfficherForm(true)}
          className="text-xs px-3 py-1.5 rounded-lg mb-4"
          style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
          {monAvis ? 'Modifier mon avis' : '+ Laisser un avis'}
        </button>
      )}

      {afficherForm && (
        <form onSubmit={soumettre} className="rounded-xl border p-4 mb-5"
          style={{ background: '#1E1912', borderColor: '#4A3820' }}>
          <p className="text-xs font-medium mb-2" style={{ color: '#FFFFFF' }}>Votre note *</p>
          <div className="flex gap-1 mb-3">
            {ETOILES.map(n => (
              <button key={n} type="button"
                onClick={() => setForm(p => ({ ...p, note: n }))}
                onMouseEnter={() => setSurvol(n)}
                onMouseLeave={() => setSurvol(0)}
                style={{ fontSize: '24px', color: n <= (survol || form.note) ? '#F0B429' : '#4A3820', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>
                ★
              </button>
            ))}
          </div>
          <textarea value={form.commentaire} onChange={e => setForm(p => ({ ...p, commentaire: e.target.value }))}
            placeholder="Votre commentaire (optionnel)" rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none mb-3"
            style={{ background: '#2C2518', borderColor: '#4A3820', color: '#EDD98A' }} />
          <div className="flex gap-2">
            <button type="submit" disabled={!form.note || envoi}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: '#F0B429', color: '#1E1912', opacity: !form.note || envoi ? 0.5 : 1 }}>
              {envoi ? 'Envoi...' : 'Envoyer'}
            </button>
            <button type="button" onClick={() => setAfficherForm(false)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'transparent', color: '#FFFFFF', border: '1px solid #4A3820' }}>
              Annuler
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#7A6A50' }}>Votre avis sera visible après modération.</p>
        </form>
      )}

      {avis.length === 0 ? (
        <p className="text-xs" style={{ color: '#7A6A50' }}>Aucun avis pour le moment. Soyez le premier !</p>
      ) : (
        <div className="flex flex-col gap-3">
          {avis.map((a, i) => (
            <div key={i} className="rounded-xl border p-3" style={{ background: '#1E1912', borderColor: '#4A3820' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: '#EDD98A' }}>{a.profils?.prenom || 'Anonyme'}</span>
                <AffichageEtoiles note={a.note} taille="12px" />
              </div>
              {a.commentaire && <p className="text-xs italic" style={{ color: '#FFFFFF' }}>« {a.commentaire} »</p>}
              <p className="text-xs mt-1" style={{ color: '#7A6A50' }}>{new Date(a.cree_le).toLocaleDateString('fr-FR')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
        {tuto.sous_titre && <p className="text-xs line-clamp-2" style={{ color: '#FFFFFF' }}>{tuto.sous_titre}</p>}
        {tuto.tutoriel_categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tuto.tutoriel_categories.map(tc => tc.categorie_tutoriels && (
              <span key={tc.categorie_id} className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: `${tc.categorie_tutoriels.couleur}20`, color: tc.categorie_tutoriels.couleur, border: `1px solid ${tc.categorie_tutoriels.couleur}40` }}>
                {tc.categorie_tutoriels.icone} {tc.categorie_tutoriels.nom}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 flex items-center justify-end" style={{ borderTop: '1px solid #4A3820', marginTop: 'auto' }}>
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
  const [recherche, setRecherche] = useState('')
  const [toutesCategories, setToutesCategories] = useState([])
  const [categorieFiltre, setCategorieFiltre] = useState(null)
  const [achatSuccesBanner, setAchatSuccesBanner] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profil, utilisateur } = useAuth()
  const estAdmin = profil?.role === 'admin'

  useEffect(() => {
    chargerDonnees()
    if (searchParams.get('achat') === 'succes') {
      setAchatSuccesBanner(true)
      navigate('/tutoriels', { replace: true })
      const t = setTimeout(() => setAchatSuccesBanner(false), 6000)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (utilisateur?.id) chargerAchats()
    else setAchats([])
  }, [utilisateur?.id])

  async function chargerDonnees() {
    const [{ data: tutos }, { data: pks }, { data: cats }] = await Promise.all([
      supabase.from('tutoriels')
        .select('id, titre, sous_titre, gratuit, prix, photo_url, visible, ordre, created_at, tutoriel_categories(categorie_id, categorie_tutoriels(nom, couleur, icone))')
        .eq('visible', true)
        .order('gratuit', { ascending: false })
        .order('ordre', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase.from('packs')
        .select('*')
        .eq('visible', true)
        .order('created_at', { ascending: false }),
      supabase.from('categorie_tutoriels')
        .select('*')
        .order('ordre')
        .order('nom'),
    ])
    setTutoriels(tutos || [])
    setPacks(pks || [])
    setToutesCategories(cats || [])
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
              {!tutoSelectionne.gratuit && (
                <SectionAvis tutoId={tutoSelectionne.id} utilisateur={utilisateur} />
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
  const terme = recherche.toLowerCase().trim()
  const tutosFiltres = tutoriels.filter(t => {
    const matchTexte = !terme || t.titre?.toLowerCase().includes(terme) || t.sous_titre?.toLowerCase().includes(terme)
    const matchCat = !categorieFiltre || t.tutoriel_categories?.some(tc => tc.categorie_id === categorieFiltre)
    return matchTexte && matchCat
  })
  const packsFiltres = packs.filter(p =>
    !terme || p.titre?.toLowerCase().includes(terme) || p.description?.toLowerCase().includes(terme)
  )
  const gratuits = tutosFiltres.filter(t => t.gratuit)
  const payants = tutosFiltres.filter(t => !t.gratuit)

  return (
    <div>
      <SEO titre="Tutoriels — PC Le Fumoir" description="Apprenez la salaison et le fumage avec nos tutoriels détaillés. Techniques, recettes, guides complets pour débutants et confirmés." />
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-medium" style={{ color: '#EDD98A' }}>Tutoriels</h1>
        <div className="relative sm:ml-auto">
          <input
            type="text"
            placeholder="Rechercher un tutoriel..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 pl-8 rounded-lg border text-sm outline-none"
            style={{ background: '#2C2518', borderColor: '#4A3820', color: '#EDD98A' }}
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#7A6A50' }}>🔍</span>
          {recherche && (
            <button onClick={() => setRecherche('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: '#7A6A50' }}>✕</button>
          )}
        </div>
      </div>

      {toutesCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setCategorieFiltre(null)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={!categorieFiltre
              ? { background: '#F0B429', color: '#1E1912' }
              : { background: 'transparent', color: '#FFFFFF', border: '1px solid #4A3820' }}>
            Tous
          </button>
          {toutesCategories.map(cat => (
            <button key={cat.id}
              onClick={() => setCategorieFiltre(categorieFiltre === cat.id ? null : cat.id)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
              style={categorieFiltre === cat.id
                ? { background: cat.couleur, color: '#1E1912' }
                : { background: `${cat.couleur}18`, color: cat.couleur, border: `1px solid ${cat.couleur}40` }}>
              {cat.icone} {cat.nom}
            </button>
          ))}
        </div>
      )}

      {achatSuccesBanner && (
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
      ) : tutosFiltres.length === 0 && packsFiltres.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#FFFFFF' }}>
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">Aucun résultat pour « {recherche} »</p>
          <button onClick={() => setRecherche('')} className="mt-3 text-xs underline" style={{ color: '#F0B429' }}>
            Effacer la recherche
          </button>
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

      {packsFiltres.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: '#FFFFFF' }}>Packs disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packsFiltres.map(pack => {
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
