import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

function Contact() {
  const [contenu, setContenu] = useState('')
  const [emailContact, setEmailContact] = useState('')
  const [chargement, setChargement] = useState(true)

  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)

  useEffect(() => {
    chargerPage()
  }, [])

  async function chargerPage() {
    const { data } = await supabase.from('contact_page').select('*').limit(1).single()
    if (data) {
      setContenu(data.contenu || '')
      setEmailContact(data.email_contact || '')
    }
    setChargement(false)
  }

  async function envoyerMessage(e) {
    e.preventDefault()
    setEnvoi(true)
    await supabase.from('messages_contact').insert({ nom, email, message })
    setEnvoi(false)
    setEnvoye(true)
    setNom('')
    setEmail('')
    setMessage('')
  }

  if (chargement) return (
    <div className="flex items-center justify-center h-40">
      <p style={{ color: '#7a4010' }}>Chargement...</p>
    </div>
  )

  const labelStyle = { color: '#7a4010' }
  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#3d1e06' }}>Infos & Contact</h1>

      <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8 mb-8" style={{ borderColor: '#d6bfa0' }}>
        {contenu ? (
          <div
            className="prose prose-base max-w-none article-tutoriel"
            style={{ color: '#3d1e06' }}
            dangerouslySetInnerHTML={{ __html: contenu }}
          />
        ) : (
          <p className="text-sm" style={{ color: '#7a4010' }}>
            Une question sur nos produits ou notre fonctionnement ? N'hésitez pas à nous contacter.
          </p>
        )}

        {emailContact && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#d6bfa0' }}>
            <p className="text-sm" style={{ color: '#7a4010' }}>
              📧 Vous pouvez aussi nous écrire directement à{' '}
              <a href={`mailto:${emailContact}`} className="font-medium" style={{ color: '#b06010' }}>
                {emailContact}
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="border-t mb-8" style={{ borderColor: '#d6bfa0' }} />

      <h2 className="text-lg font-medium mb-4" style={{ color: '#3d1e06' }}>Nous écrire</h2>

      {envoye ? (
        <div className="text-center py-10 rounded-xl" style={{ background: '#eaf3de' }}>
          <p className="text-3xl mb-3">✓</p>
          <p className="text-sm" style={{ color: '#3B6D11' }}>Votre message a bien été envoyé. Merci !</p>
        </div>
      ) : (
        <form onSubmit={envoyerMessage} className="bg-white rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: '#d6bfa0' }}>
          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Votre nom</label>
            <input value={nom} onChange={e => setNom(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Votre email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Votre message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <button type="submit" disabled={envoi}
            className="px-4 py-2 rounded-lg text-sm font-medium self-start"
            style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
            {envoi ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      )}
    </div>
  )
}

export default Contact