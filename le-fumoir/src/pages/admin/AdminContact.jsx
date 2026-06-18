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

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: '#EDD98A' }}>✉️ Page Infos & Contact</h2>

      <div className="rounded-xl border p-4 mb-8 max-w-2xl flex flex-col gap-3" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
        <div>
          <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Email de contact affiché</label>
          <input value={emailContact} onChange={e => setEmailContact(e.target.value)}
            placeholder="contact@lefumoir.fr"
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Texte explicatif</label>
          <EditeurTexte contenu={contenu} onChange={setContenu} />
        </div>

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

export default AdminContact
