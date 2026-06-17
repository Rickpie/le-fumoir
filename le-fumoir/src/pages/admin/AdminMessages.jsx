import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    chargerMessages()
  }, [])

  async function chargerMessages() {
    const { data } = await supabase.from('messages_contact').select('*').order('created_at', { ascending: false })
    setMessages(data || [])
    setChargement(false)
  }

  async function marquerLu(id, lu) {
    await supabase.from('messages_contact').update({ lu: !lu }).eq('id', id)
    chargerMessages()
  }

  async function supprimerMessage(id) {
    if (!confirm('Supprimer ce message ?')) return
    await supabase.from('messages_contact').delete().eq('id', id)
    chargerMessages()
  }

  if (chargement) return <p style={{ color: '#7a4010' }}>Chargement...</p>

  const nonLus = messages.filter(m => !m.lu).length

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: '#3d1e06' }}>
        📬 Messages reçus {nonLus > 0 && `(${nonLus} non lus)`}
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

export default AdminMessages