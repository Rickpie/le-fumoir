import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

function Boutique() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [categorieActive, setCategorieActive] = useState(null)
  const [chargement, setChargement] = useState(true)

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
      .select('*')
      .eq('visible', true)

    setCategories(cats || [])
    setProduits(prods || [])
    setChargement(false)
  }

  async function incrementerClics(produitId) {
    await supabase.rpc('incrementer_clics_produit', { produit_id: produitId })
  }

  const produitsFiltres = categorieActive
    ? produits.filter(p => p.categorie_id === categorieActive)
    : produits

  if (chargement) return (
    <div className="flex items-center justify-center h-40">
      <p style={{ color: '#7a4010' }}>Chargement...</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium" style={{ color: '#3d1e06' }}>Boutique</h1>
        <div className="mt-3 p-4 rounded-xl text-sm" style={{ background: '#f5e2c0', color: '#7a4010', border: '0.5px solid #d6bfa0' }}>
          🔥 Tous nos produits sont préparés à la commande. Vous pouvez recevoir votre pièce <strong>prête à déguster</strong> (délai selon le produit) ou opter pour la version <strong>à faire sécher vous-même</strong> à la maison, avec nos conseils inclus.
        </div>
      </div>

      {/* Filtres catégories */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setCategorieActive(null)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={categorieActive === null
              ? { background: '#5a2e0e', color: '#fdf0d0' }
              : { background: '#f5e2c0', color: '#7a4010' }
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
                ? { background: '#5a2e0e', color: '#fdf0d0' }
                : { background: '#f5e2c0', color: '#7a4010' }
              }
            >
              {cat.nom}
            </button>
          ))}
        </div>
      )}

      {/* Grille de produits */}
      {produitsFiltres.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#7a4010' }}>
          <p className="text-4xl mb-3">🔥</p>
          <p className="text-sm">Aucun produit disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {produitsFiltres.map(produit => (
            <div
              key={produit.id}
              onClick={() => incrementerClics(produit.id)}
              className="bg-white rounded-xl border cursor-pointer group"
              style={{
                borderColor: '#d6bfa0',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(80,35,5,0.14)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Photo */}
              <div
                className="h-40 rounded-t-xl flex items-center justify-center text-4xl"
                style={{ background: '#c8784a' }}
              >
                {produit.photo_url ? (
                  <img src={produit.photo_url} alt={produit.nom}
                    className="h-full w-full object-cover rounded-t-xl" />
                ) : '🥩'}
              </div>

              {/* Infos */}
              <div className="p-3">
                <h3 className="font-medium text-sm" style={{ color: '#2e1506' }}>{produit.nom}</h3>
                {produit.description && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: '#7a4820' }}>
                    {produit.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-medium" style={{ color: '#b06010' }}>
                    dès {produit.prix} €
                  </span>
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{ background: '#5a2e0e', color: '#fdf0d0' }}
                  >
                    Choisir
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