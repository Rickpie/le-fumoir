import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import EditeurTexte from '../../components/EditeurTexte'

function AdminContact() {
  const [contenu, setContenu] = useState('')
  const [emailContact, setEmailContact] = useState('')
  const [pageId, setPageId] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    chargerDonnees()
  }, [])

  async function chargerDonnees() {
    const { data: page } = await supabase.from('contact_page').select('*').limit(1).single()
    if (page) {
      setPageId(page.id)
      setContenu(page.contenu || '')
      setEmailContact(page.email_contact || '')
    }
    setChargement(false)
  }

  async function enregistrer() {
    setEnregistrement(true)
    setSucces(false)
    const { error } = await supabase.from('contact_page').update({
      contenu,
      email_contact: emailContact,
      updated_at: new Date().toISOString(),
    }).eq('id', pageId)

    if (error) {
      alert('Erreur lors de l\'enregistrement : ' + error.message)
    } else {
      setSucces(true)
      setTimeout(() => setSucces(false), 3000)
    }
    setEnregistrement(false)
  }

  if (chargement) return <p style={{ color: '#7a4010' }}>Chargement...</p>

  const labelStyle = { color: '#7a4010' }
  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: '#3d1e06' }}>✉️ Page Contact</h2>

      <div className="bg-white rounded-xl border p-4 mb-8 max-w-2xl flex flex-col gap-3" style={{ borderColor: '#d6bfa0' }}>
        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Email de contact affiché</label>
          <input value={emailContact} onChange={e => setEmailContact(e.target.value)}
            placeholder="contact@lefumoir.fr"
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Texte explicatif</label>
          <EditeurTexte contenu={contenu} onChange={setContenu} />
        </div>

        {succes && <p className="text-xs" style={{ color: '#3B6D11' }}>✓ Enregistré</p>}

        <button onClick={enregistrer} disabled={enregistrement}
          className="px-4 py-2 rounded-lg text-sm font-medium self-start"
          style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
          {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default AdminContact