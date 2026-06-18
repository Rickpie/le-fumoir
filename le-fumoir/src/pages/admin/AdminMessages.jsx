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

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const nonLus = messages.filter(m => !m.lu).length

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: '#EDD98A' }}>
        📬 Messages reçus {nonLus > 0 && (
          <span className="text-sm px-2 py-0.5 rounded-full ml-2" style={{ background: '#B03A2E', color: '#fff' }}>{nonLus} non lus</span>
        )}
      </h2>

      <div className="flex flex-col gap-2 max-w-2xl">
        {messages.map(m => (
          <div key={m.id} className="rounded-lg p-4 border" style={{ background: '#2C2518', borderColor: '#4A3820', opacity: m.lu ? 0.6 : 1 }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>{m.nom}</span>
              <span className="text-xs" style={{ color: '#FFFFFF' }}>
                {new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <p className="text-xs mb-1" style={{ color: '#F0B429' }}>{m.email}</p>
            <p className="text-sm mb-3" style={{ color: '#EDD98A' }}>{m.message}</p>
            <div className="flex gap-2">
              <button onClick={() => marquerLu(m.id, m.lu)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                {m.lu ? 'Marquer non lu' : 'Marquer lu'}
              </button>
              <button onClick={() => supprimerMessage(m.id)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                Suppr.
              </button>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucun message pour l'instant.</p>}
      </div>
    </div>
  )
}

export default AdminMessages
