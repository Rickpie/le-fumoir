import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

function Tutoriels() {
  const [tutoriels, setTutoriels] = useState([])
  const [packs, setPacks] = useState([])
  const [tutoSelectionne, setTutoSelectionne] = useState(null)
  const [packSelectionne, setPackSelectionne] = useState(null)
  const [contenuPack, setContenuPack] = useState(null)
  const [chargement, setChargement] = useState(true)

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
      <p style={{ color: '#7a4010' }}>Chargement...</p>
    </div>
  )

  // VUE DÉTAIL PACK
  if (packSelectionne) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => { setPackSelectionne(null); setContenuPack(null) }}
          className="text-sm mb-6 flex items-center gap-1"
          style={{ color: '#7a4010' }}>
          ← Retour aux tutoriels
        </button>

        <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8" style={{ borderColor: '#d6bfa0' }}>
          {packSelectionne.photo_url && (
            <img src={packSelectionne.photo_url} alt={packSelectionne.titre}
              className="w-full h-56 object-cover rounded-xl mb-6" />
          )}

          <span className="inline-block text-xs mb-3 px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#fce0a0', color: '#6b3c06' }}>
            Pack
          </span>

          <h1 className="text-3xl font-medium mb-2" style={{ color: '#3d1e06' }}>{packSelectionne.titre}</h1>
          {packSelectionne.description && (
            <p className="text-base mb-6" style={{ color: '#7a4010' }}>{packSelectionne.description}</p>
          )}

          <div className="border-t mb-6" style={{ borderColor: '#d6bfa0' }} />

          <h2 className="text-lg font-medium mb-3" style={{ color: '#3d1e06' }}>Ce pack contient :</h2>

          {contenuPack?.tutoriels.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: '#7a4010' }}>📖 Tutoriels</p>
              <ul className="text-sm" style={{ color: '#3d1e06' }}>
                {contenuPack.tutoriels.map(t => (
                  <li key={t.titre} className="flex justify-between">
                    <span>• {t.titre}</span>
                    <span style={{ color: '#a07050' }}>{t.prix} €</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {contenuPack?.produits.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: '#7a4010' }}>🥩 Produits</p>
              <ul className="text-sm" style={{ color: '#3d1e06' }}>
                {contenuPack.produits.map(p => (
                  <li key={p.nom} className="flex justify-between">
                    <span>• {p.nom}</span>
                    <span style={{ color: '#a07050' }}>{p.prix} €</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {contenuPack?.fichiers.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-1" style={{ color: '#7a4010' }}>📄 Fichiers inclus</p>
              <ul className="text-sm" style={{ color: '#3d1e06' }}>
                {contenuPack.fichiers.map(f => (
                  <li key={f.nom} className="flex justify-between">
                    <span>• {f.nom}</span>
                    <span style={{ color: '#a07050' }}>{f.prix > 0 ? `${f.prix} €` : 'inclus'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {contenuPack?.totalSepare > packSelectionne.prix && (
            <div className="flex items-center justify-between mb-4 text-sm" style={{ color: '#7a4010' }}>
              <span>Prix si acheté séparément</span>
              <span className="line-through">{contenuPack.totalSepare.toFixed(2)} €</span>
            </div>
          )}

          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#f5e2c0' }}>
            <span className="text-lg font-medium" style={{ color: '#3d1e06' }}>{packSelectionne.prix} €</span>
            <button className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
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
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setTutoSelectionne(null)}
          className="text-sm mb-6 flex items-center gap-1"
          style={{ color: '#7a4010' }}>
          ← Retour aux tutoriels
        </button>

        <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8" style={{ borderColor: '#d6bfa0' }}>
          {tutoSelectionne.photo_url && (
            <img src={tutoSelectionne.photo_url} alt={tutoSelectionne.titre}
              className="w-full h-56 object-cover rounded-xl mb-6" />
          )}

          <span className="inline-block text-xs mb-3 px-2 py-0.5 rounded-full font-medium"
            style={tutoSelectionne.gratuit ? { background: '#eaf3de', color: '#3B6D11' } : { background: '#fce0a0', color: '#6b3c06' }}>
            {tutoSelectionne.gratuit ? 'Gratuit' : `Payant — ${tutoSelectionne.prix} €`}
          </span>

          <h1 className="text-3xl font-medium mb-2" style={{ color: '#3d1e06' }}>{tutoSelectionne.titre}</h1>
          {tutoSelectionne.sous_titre && (
            <p className="text-base mb-3" style={{ color: '#a07050' }}>{tutoSelectionne.sous_titre}</p>
          )}

          {tutoSelectionne.created_at && (
            <p className="text-xs mb-6" style={{ color: '#a07050' }}>
              Publié le {new Date(tutoSelectionne.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          <div className="border-t mb-6" style={{ borderColor: '#d6bfa0' }} />

          {tutoSelectionne.gratuit ? (
            <div
              className="prose prose-base max-w-none article-tutoriel"
              style={{ color: '#3d1e06' }}
              dangerouslySetInnerHTML={{ __html: tutoSelectionne.contenu }}
            />
          ) : (
            <div className="text-center py-10 rounded-xl" style={{ background: '#fdf6ec' }}>
              <p className="text-3xl mb-3">🔒</p>
              <p className="text-sm mb-4" style={{ color: '#7a4010' }}>
                Ce tutoriel est payant. Achète-le pour débloquer le contenu complet.
              </p>
              <button className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
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
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#3d1e06' }}>Tutoriels</h1>

      {packs.length > 0 && (
        <>
          <h2 className="text-sm font-medium mb-3 uppercase tracking-wide" style={{ color: '#8a5a28' }}>Packs disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {packs.map(pack => (
              <div key={pack.id} onClick={() => ouvrirPack(pack)}
                className="bg-white rounded-xl border cursor-pointer"
                style={{ borderColor: '#d6bfa0', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(80,35,5,0.14)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div className="h-36 rounded-t-xl flex items-center justify-center text-3xl overflow-hidden" style={{ background: '#fce0a0' }}>
                  {pack.photo_url ? <img src={pack.photo_url} alt={pack.titre} className="h-full w-full object-cover" /> : '📦'}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm" style={{ color: '#2e1506' }}>{pack.titre}</h3>
                  <p className="text-sm font-medium mt-2" style={{ color: '#b06010' }}>{pack.prix} €</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm font-medium mb-3 uppercase tracking-wide" style={{ color: '#8a5a28' }}>Tutoriels</h2>

      {tutoriels.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#7a4010' }}>
          <p className="text-4xl mb-3">📖</p>
          <p className="text-sm">Aucun tutoriel disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutoriels.map(tuto => (
            <div
              key={tuto.id}
              onClick={() => ouvrirTuto(tuto)}
              className="bg-white rounded-xl border cursor-pointer"
              style={{ borderColor: '#d6bfa0', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(80,35,5,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className="h-36 rounded-t-xl flex items-center justify-center text-3xl overflow-hidden" style={{ background: '#f5e2c0' }}>
                {tuto.photo_url ? <img src={tuto.photo_url} alt={tuto.titre} className="h-full w-full object-cover" /> : '📖'}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm" style={{ color: '#2e1506' }}>{tuto.titre}</h3>
                {tuto.sous_titre && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: '#7a4820' }}>{tuto.sous_titre}</p>
                )}
                <span className="inline-block text-xs mt-2 px-2 py-0.5 rounded-full"
                  style={tuto.gratuit ? { background: '#eaf3de', color: '#3B6D11' } : { background: '#fce0a0', color: '#6b3c06' }}>
                  {tuto.gratuit ? 'Gratuit' : `Payant — ${tuto.prix} €`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Tutoriels