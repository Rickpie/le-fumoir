import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Boutique() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [categorieActive, setCategorieActive] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()
  const { profil } = useAuth()
  const estAdmin = profil?.role === 'admin'

  useEffect(() => {
    chargerDonnees()
  }, [])

  async function chargerDonnees() {
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .order('ordre', { nullsFirst: false })

    const { data: prods } = await supabase
      .from('produits')
      .select('*, categories(est_viande)')
      .eq('visible', true)

    const categoriesAvecProduits = (cats || []).filter(cat =>
      (prods || []).some(p => p.categorie_id === cat.id)
    )

    setCategories(categoriesAvecProduits)
    setProduits(prods || [])
    setChargement(false)
  }

  async function incrementerClics(produitId) {
    await supabase.rpc('incrementer_clics_produit', { produit_id: produitId })
  }

  async function supprimerProduit(e, produitId) {
    e.stopPropagation()
    if (!confirm('Supprimer définitivement ce produit de la boutique ?')) return
    await supabase.from('produits').delete().eq('id', produitId)
    chargerDonnees()
  }

  function modifierProduit(e, produitId) {
    e.stopPropagation()
    navigate(`/admin/produits?edit=${produitId}`)
  }

  const terme = recherche.toLowerCase().trim()
  const produitsFiltres = produits.filter(p => {
    const matchCat = !categorieActive || p.categorie_id === categorieActive
    const matchTexte = !terme || p.nom?.toLowerCase().includes(terme) || p.description?.toLowerCase().includes(terme)
    return matchCat && matchTexte
  })

  if (chargement) return (
    <div className="flex items-center justify-center h-40">
      <p style={{ color: '#FFFFFF' }}>Chargement...</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <h1 className="text-2xl font-medium" style={{ color: '#EDD98A' }}>Boutique</h1>
          <div className="relative sm:ml-auto">
            <input
              type="text"
              placeholder="Rechercher un produit..."
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
        <div className="p-4 rounded-xl text-sm" style={{ background: '#2C2518', color: '#EDD98A', border: '1px solid #4A3820' }}>
          🔥 Tous nos produits sont préparés à la commande. Vous pouvez recevoir votre pièce <strong style={{ color: '#F0B429' }}>prête à déguster</strong> (délai selon le produit) ou opter pour la version <strong style={{ color: '#F0B429' }}>à faire sécher vous-même</strong> à la maison, avec nos conseils inclus.
        </div>
      </div>

      {/* Filtres catégories */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setCategorieActive(null)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={categorieActive === null
              ? { background: '#F0B429', color: '#1E1912' }
              : { background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }
            }
          >
            Tout
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategorieActive(cat.id)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={categorieActive === cat.id
                ? { background: '#F0B429', color: '#1E1912' }
                : { background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }
              }
            >
              {cat.nom}
            </button>
          ))}
        </div>
      )}

      {/* Grille de produits */}
      {produitsFiltres.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#FFFFFF' }}>
          {terme || categorieActive ? (
            <>
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm mb-3">Aucun produit ne correspond à votre recherche.</p>
              <button onClick={() => { setRecherche(''); setCategorieActive(null) }}
                className="text-xs underline" style={{ color: '#F0B429' }}>
                Effacer les filtres
              </button>
            </>
          ) : (
            <>
              <p className="text-4xl mb-3">🔥</p>
              <p className="text-sm">Aucun produit disponible pour le moment.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {produitsFiltres.map(produit => (
            <div
              key={produit.id}
              onClick={() => { incrementerClics(produit.id); navigate(`/produit/${produit.id}`) }}
              className="rounded-xl cursor-pointer flex flex-col overflow-hidden relative"
              style={{
                background: '#2C2518',
                border: '1px solid #4A3820',
                borderTop: '2px solid rgba(240,180,41,0.5)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px #F0B429'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Boutons admin */}
              {estAdmin && (
                <div className="absolute top-2 right-2 z-10 flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={e => modifierProduit(e, produit.id)}
                    className="text-xs px-2 py-1 rounded-md font-medium"
                    style={{ background: 'rgba(240,180,41,0.9)', color: '#1E1912' }}>
                    ✏️
                  </button>
                  <button onClick={e => supprimerProduit(e, produit.id)}
                    className="text-xs px-2 py-1 rounded-md font-medium"
                    style={{ background: 'rgba(176,58,46,0.9)', color: '#fff' }}>
                    🗑️
                  </button>
                </div>
              )}

              {/* Photo avec overlay gradient */}
              <div className="relative overflow-hidden" style={{ height: '210px' }}>
                {produit.photo_url ? (
                  <img src={produit.photo_url} alt={produit.nom}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl"
                    style={{ background: '#3A2E1A' }}>🥩</div>
                )}
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 30%, rgba(28,22,14,0.75) 100%)'
                }} />
              </div>

              {/* Infos */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-sm mb-1 leading-snug" style={{ color: '#EDD98A' }}>{produit.nom}</h3>
                {produit.description && (
                  <p className="text-xs line-clamp-2" style={{ color: '#FFFFFF' }}>
                    {produit.description}
                  </p>
                )}
                {produit.categories?.est_viande && (
                  <p className="text-xs mt-2 flex-1" style={{ color: '#7A6A50' }}>
                    ⚖️ La viande perd environ 30% de son poids en séchant — prévoyez en conséquence.
                  </p>
                )}
                <div className="flex items-end justify-between mt-3 pt-3" style={{ borderTop: '1px solid #4A3820' }}>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: '#FFFFFF' }}>à partir de</p>
                    <p className="text-lg font-semibold leading-none" style={{ color: '#F0B429' }}>{produit.prix} €</p>
                  </div>
                  <button className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                    style={{ background: '#F0B429', color: '#1E1912' }}>
                    Commander →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Boutique
