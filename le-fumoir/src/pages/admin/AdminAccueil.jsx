import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import EditeurTexte from '../../components/EditeurTexte'

function AdminAccueil() {
  const [contenu, setContenu] = useState('')
  const [pageId, setPageId] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    supabase.from('accueil_contenu').select('*')
      .then(({ data }) => {
        const lignes = data || []
        const ligneAvecContenu = lignes.find(r => r.contenu && r.contenu.trim().length > 0)
        const ligne = ligneAvecContenu || lignes[0] || null
        if (ligne) {
          setPageId(ligne.id)
          setContenu(ligne.contenu || '')
        }
        setChargement(false)
      })
  }, [])

  async function enregistrer() {
    setEnregistrement(true)
    setSucces(false)
    if (pageId) {
      await supabase.from('accueil_contenu').update({ contenu, updated_at: new Date().toISOString() }).eq('id', pageId)
    } else {
      const { data } = await supabase.from('accueil_contenu').insert({ contenu }).select().single()
      setPageId(data.id)
    }
    setSucces(true)
    setTimeout(() => setSucces(false), 3000)
    setEnregistrement(false)
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  return (
    <div>
      <h2 className="text-lg font-medium mb-1" style={{ color: '#EDD98A' }}>🏠 Bloc texte — Page d'accueil</h2>
      <p className="text-sm mb-4" style={{ color: '#FFFFFF' }}>
        Ce texte apparaît sous le bandeau principal sur la page d'accueil.
      </p>

      <div className="rounded-xl border p-4 max-w-4xl flex flex-col gap-3" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
        <EditeurTexte contenu={contenu} onChange={setContenu} />

        {succes && <p className="text-xs" style={{ color: '#6B8E4E' }}>✓ Enregistré</p>}

        <button onClick={enregistrer} disabled={enregistrement}
          className="px-4 py-2 rounded-lg text-sm font-semibold self-start transition-opacity"
          style={{ background: '#F0B429', color: '#1E1912', opacity: enregistrement ? 0.6 : 1 }}>
          {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default AdminAccueil
