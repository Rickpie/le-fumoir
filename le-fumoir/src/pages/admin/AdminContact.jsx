import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import EditeurTexte from '../../components/EditeurTexte'

function AdminContact() {
  const [contenu, setContenu] = useState('')
  const [emailContact, setEmailContact] = useState('')
  const [pageId, setPageId] = useState(null)
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)

  useEffect(() => {
    chargerDonnees()
  }, [])

  async function chargerDonnees() {
    const { data: page } = await supabase.from('contact_page').select('*').limit(1).single()
    const { data: msgs } = await supabase.from('messages_contact').select('*').order('created_at', { ascending: false })

    if (page) {
      setPageId(page.id)
      setContenu(page.contenu || '')
      setEmailContact(page.email_contact || '')
    }
    setMessages(msgs || [])
    setChargement(false)
  }

  async function enregistrer() {
    setEnregistrement(true)
    await supabase.from('contact_page').update({
      contenu,
      email_contact: emailContact,
      updated_at: new Date().toISOString(),
    }).eq('id', pageId)
    setEnregistrement(false)
  }

  async function marquerLu(id, lu) {
    await supabase.from('messages_contact').update({ lu: !lu }).eq('id', id)
    chargerDonnees()
  }

  async function supprimerMessage(id) {
    if (!confirm('Supprimer ce message ?')) return
    await supabase.from('messages_contact').delete().eq('id', id)
    chargerDonnees()
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
          <EditeurTexte valeur={contenu} onChange={setContenu} />
        </div>

        <button onClick={enregistrer} disabled={enregistrement}
          className="px-4 py-2 rounded-lg text-sm font-medium self-start"
          style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
          {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <h2 className="text-lg font-medium mb-4" style={{ color: '#3d1e06' }}>
        📬 Messages reçus {messages.filter(m => !m.lu).length > 0 && `(${messages.filter(m => !m.lu).length} non lus)`}
      </h2>

      <div className="flex flex-col gap-2 max-w-2xl">
        {messages.map(m => (
          <div key={m.id} className="bg-white rounded-lg p-3 border" style={{ borderColor: '#d6bfa0', opacity: m.lu ? 0.6 : 1 }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium" style={{ color: '#3d1e06' }}>{m.nom}</span>
              <span className="text-xs" style={{ color: '#a07050' }}>
                {new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <p className="text-xs mb-1" style={{ color: '#b06010' }}>{m.email}</p>
            <p className="text-sm mb-2" style={{ color: '#3d1e06' }}>{m.message}</p>
            <div className="flex gap-2">
              <button onClick={() => marquerLu(m.id, m.lu)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#f5e2c0', color: '#7a4010' }}>
                {m.lu ? 'Marquer non lu' : 'Marquer lu'}
              </button>
              <button onClick={() => supprimerMessage(m.id)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#fde8e8', color: '#c0392b' }}>
                Suppr.
              </button>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm" style={{ color: '#a07050' }}>Aucun message pour l'instant.</p>}
      </div>
    </div>
  )
}

export default AdminContact