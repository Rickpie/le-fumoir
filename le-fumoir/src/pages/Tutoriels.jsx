import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

function Tutoriels() {
  const [tutoriels, setTutoriels] = useState([])
  const [packs, setPacks] = useState([])
  const [tutoSelectionne, setTutoSelectionne] = useState(null)
  const [packSelectionne, setPackSelectionne] = useState(null)
  const [contenuPack, setContenuPack] = useState(null)
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()
  const { profil } = useAuth()
  const estAdmin = profil?.role === 'admin'

  useEffect(() => {
    chargerDonnees()
  }, [])

  async function chargerDonnees() {
    const { data: tutos } = await supabase
      .from('tutoriels')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false })

    const { data: pks } = await supabase
      .from('packs')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false })

    setTutoriels(tutos || [])
    setPacks(pks || [])
    setChargement(false)
  }

  async function ouvrirTuto(tuto) {
    setTutoSelectionne(tuto)
    await supabase.rpc('incrementer_clics_tutoriel', { tutoriel_id: tuto.id }).catch(() => {})
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
    const { data: pt } = await supabase
      .from('pack_tutoriels')
      .select('tutoriel_id, tutoriels:tutoriel_id (titre, prix)')
      .eq('pack_id', pack.id)

    const { data: pp } = await supabase
      .from('pack_produits')
      .select('produit_id, produits:produit_id (nom, prix)')
      .eq('pack_id', pack.id)

    const { data: pf } = await supabase
      .from('pack_fichiers')
      .select('fichier_id, fichiers_telechargeables:fichier_id (nom, prix)')
      .eq('pack_id', pack.id)

    const tutos = (pt || []).map(x => x.tutoriels).filter(Boolean)
    const prods = (pp || []).map(x => x.produits).filter(Boolean)
    const fichs = (pf || []).map(x => x.fichiers_telechargeables).filter(Boolean)

    const totalSepare = [...tutos, ...prods, ...fichs].reduce((sum, item) => sum + (parseFloat(item.prix) || 0), 0)

    setContenuPack({
      tutoriels: tutos,
      produits: prods,
      fichiers: fichs,
      totalSepare,
    })
    setPackSelectionne(pack)
  }

  if (chargement) return (
    <div className="flex items-center justify-center h-40">
      <p style={{ color: '#FFFFFF' }}>Chargement...</p>
    </div>
  )

  // VUE DÉTAIL PACK
  if (packSelectionne) {
    return (
      <div>
        <button onClick={() => { setPackSelectionne(null); setContenuPack(null) }}
          className="text-sm mb-6 flex items-center gap-1 transition-colors"
          style={{ color: '#FFFFFF' }}>
          ← Retour aux tutoriels
        </button>

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
                    <span>• {t.titre}</span>
                    <span style={{ color: '#FFFFFF' }}>{t.prix} €</span>
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
                    <span>• {p.nom}</span>
                    <span style={{ color: '#FFFFFF' }}>{p.prix} €</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {contenuPack?.fichiers.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-1" style={{ color: '#F0B429' }}>📄 Fichiers inclus</p>
              <ul className="text-sm" style={{ color: '#EDD98A' }}>
                {contenuPack.fichiers.map(f => (
                  <li key={f.nom} className="flex justify-between py-0.5">
                    <span>• {f.nom}</span>
                    <span style={{ color: '#FFFFFF' }}>{f.prix > 0 ? `${f.prix} €` : 'inclus'}</span>
                  </li>
                ))}
              </ul>
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
            <button className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#F0B429', color: '#1E1912' }}>
              Acheter ce pack
            </button>
          </div>
        </div>
      </div>
    )
  }

  // VUE DÉTAIL TUTORIEL
  if (tutoSelectionne) {
    return (
      <div>
        <button onClick={() => setTutoSelectionne(null)}
          className="text-sm mb-6 flex items-center gap-1"
          style={{ color: '#FFFFFF' }}>
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

          {tutoSelectionne.gratuit ? (
            <div
              className="prose prose-base max-w-none article-tutoriel"
              style={{ color: '#EDD98A' }}
              dangerouslySetInnerHTML={{ __html: tutoSelectionne.contenu }}
            />
          ) : (
            <div className="text-center py-10 rounded-xl" style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
              <p className="text-3xl mb-3">🔒</p>
              <p className="text-sm mb-4" style={{ color: '#FFFFFF' }}>
                Ce tutoriel est payant. Achète-le pour débloquer le contenu complet.
              </p>
              <button className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#F0B429', color: '#1E1912' }}>
                Acheter pour {tutoSelectionne.prix} €
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // VUE LISTE
  return (
    <div>
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#EDD98A' }}>Tutoriels</h1>

      {packs.length > 0 && (
        <>
          <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: '#FFFFFF' }}>Packs disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {packs.map(pack => (
              <div key={pack.id} onClick={() => ouvrirPack(pack)}
                className="rounded-xl cursor-pointer flex flex-col overflow-hidden"
                style={{
                  background: '#2C2518',
                  border: '1px solid #4A3820',
                  borderTop: '2px solid rgba(240,180,41,0.5)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px #F0B429' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div className="relative overflow-hidden" style={{ height: '200px' }}>
                  {pack.photo_url
                    ? <img src={pack.photo_url} alt={pack.titre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: '#3A2E1A' }}>📦</div>
                  }
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 30%, rgba(28,22,14,0.75) 100%)'
                  }} />
                  <span className="absolute bottom-2 left-3 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(240,180,41,0.9)', color: '#1E1912' }}>
                    Pack — {pack.prix} €
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-sm leading-snug" style={{ color: '#EDD98A' }}>{pack.titre}</h3>
                  {pack.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#FFFFFF' }}>{pack.description}</p>}
                  <div className="mt-3 pt-3 flex items-center justify-end" style={{ borderTop: '1px solid #4A3820' }}>
                    <span className="text-xs font-medium" style={{ color: '#F0B429' }}>Voir le pack →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: '#FFFFFF' }}>Tutoriels</h2>

      {tutoriels.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#FFFFFF' }}>
          <p className="text-4xl mb-3">📖</p>
          <p className="text-sm">Aucun tutoriel disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tutoriels.map(tuto => (
            <div
              key={tuto.id}
              onClick={() => ouvrirTuto(tuto)}
              className="rounded-xl cursor-pointer flex flex-col overflow-hidden relative"
              style={{
                background: '#2C2518',
                border: '1px solid #4A3820',
                borderTop: '2px solid rgba(240,180,41,0.5)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px #F0B429' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              {/* Boutons admin */}
              {estAdmin && (
                <div className="absolute top-2 right-2 z-10 flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={e => modifierTuto(e, tuto)}
                    className="text-xs px-2 py-1 rounded-md font-medium"
                    style={{ background: 'rgba(240,180,41,0.9)', color: '#1E1912' }}>
                    ✏️
                  </button>
                  <button onClick={e => supprimerTuto(e, tuto.id)}
                    className="text-xs px-2 py-1 rounded-md font-medium"
                    style={{ background: 'rgba(176,58,46,0.9)', color: '#fff' }}>
                    🗑️
                  </button>
                </div>
              )}

              {/* Photo avec overlay gradient + badge */}
              <div className="relative overflow-hidden" style={{ height: '200px' }}>
                {tuto.photo_url
                  ? <img src={tuto.photo_url} alt={tuto.titre} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: '#3A2E1A' }}>📖</div>
                }
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 30%, rgba(28,22,14,0.75) 100%)'
                }} />
                {/* Badge gratuit/payant sur la photo */}
                <span className="absolute bottom-2 left-3 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={tuto.gratuit
                    ? { background: 'rgba(107,142,78,0.85)', color: '#fff', backdropFilter: 'blur(4px)' }
                    : { background: 'rgba(240,180,41,0.9)', color: '#1E1912', backdropFilter: 'blur(4px)' }}>
                  {tuto.gratuit ? 'Gratuit' : `${tuto.prix} €`}
                </span>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-sm mb-1 leading-snug" style={{ color: '#EDD98A' }}>{tuto.titre}</h3>
                {tuto.sous_titre && (
                  <p className="text-xs line-clamp-2 flex-1" style={{ color: '#FFFFFF' }}>{tuto.sous_titre}</p>
                )}
                <div className="mt-3 pt-3 flex items-center justify-end" style={{ borderTop: '1px solid #4A3820' }}>
                  <span className="text-xs font-medium" style={{ color: '#F0B429' }}>
                    {tuto.gratuit ? 'Lire →' : 'Voir le tutoriel →'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Tutoriels
