import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

function Tutoriels() {
  const [tutoriels, setTutoriels] = useState([])
  const [tutoSelectionne, setTutoSelectionne] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    chargerTutoriels()
  }, [])

  async function chargerTutoriels() {
    const { data } = await supabase
      .from('tutoriels')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false })
    setTutoriels(data || [])
    setChargement(false)
  }

  async function ouvrirTuto(tuto) {
    setTutoSelectionne(tuto)
    await supabase.rpc('incrementer_clics_tutoriel', { tutoriel_id: tuto.id }).catch(() => {})
  }

  if (chargement) return (
    <div className="flex items-center justify-center h-40">
      <p style={{ color: '#7a4010' }}>Chargement...</p>
    </div>
  )

  // VUE DÉTAIL D'UN TUTORIEL
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
            {tutoSelectionne.gratuit ? 'Gratuit' : 'Payant'}
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

          <div
            className="prose prose-base max-w-none article-tutoriel"
            style={{ color: '#3d1e06' }}
            dangerouslySetInnerHTML={{ __html: tutoSelectionne.contenu }}
          />
        </div>
      </div>
    )
  }

  // VUE LISTE
  return (
    <div>
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#3d1e06' }}>Tutoriels</h1>

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
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(80,35,5,0.14)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="h-36 rounded-t-xl flex items-center justify-center text-3xl overflow-hidden" style={{ background: '#f5e2c0' }}>
                {tuto.photo_url ? (
                  <img src={tuto.photo_url} alt={tuto.titre} className="h-full w-full object-cover" />
                ) : '📖'}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm" style={{ color: '#2e1506' }}>{tuto.titre}</h3>
                {tuto.sous_titre && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: '#7a4820' }}>{tuto.sous_titre}</p>
                )}
                <span className="inline-block text-xs mt-2 px-2 py-0.5 rounded-full"
                  style={tuto.gratuit ? { background: '#eaf3de', color: '#3B6D11' } : { background: '#fce0a0', color: '#6b3c06' }}>
                  {tuto.gratuit ? 'Gratuit' : 'Payant'}
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