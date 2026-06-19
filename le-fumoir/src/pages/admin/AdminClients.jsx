import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

function AdminClients() {
  const [clients, setClients] = useState([])
  const [chargement, setChargement] = useState(true)
  const [clientOuvert, setClientOuvert] = useState(null)
  const [noteEnEdition, setNoteEnEdition] = useState({})
  const [recherche, setRecherche] = useState('')
  const [filtreBannis, setFiltreBannis] = useState(false)
  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    charger()
  }, [])

  async function charger() {
    const { data } = await supabase
      .from('profils')
      .select('*, commandes(id)')
      .eq('role', 'client')
      .order('created_at', { ascending: false })
    setClients(data || [])
    setChargement(false)
  }

  async function toggleBan(client) {
    const nouveauStatut = !client.banni
    await supabase.from('profils').update({ banni: nouveauStatut }).eq('id', client.id)
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, banni: nouveauStatut } : c))
    if (clientOuvert?.id === client.id) setClientOuvert(prev => ({ ...prev, banni: nouveauStatut }))
  }

  async function enregistrerNote(clientId) {
    const note = noteEnEdition[clientId] ?? ''
    await supabase.from('profils').update({ note_admin: note }).eq('id', clientId)
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, note_admin: note } : c))
    if (clientOuvert?.id === clientId) setClientOuvert(prev => ({ ...prev, note_admin: note }))
    setNoteEnEdition(prev => { const n = { ...prev }; delete n[clientId]; return n })
  }

  async function supprimerCompte(client) {
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.functions.invoke('admin-supprimer-utilisateur', {
      body: { userId: client.id },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (error) { alert('Erreur lors de la suppression : ' + error.message); return }
    setClients(prev => prev.filter(c => c.id !== client.id))
    if (clientOuvert?.id === client.id) setClientOuvert(null)
    setConfirmation(null)
  }

  const clientsFiltres = clients.filter(c => {
    if (filtreBannis && !c.banni) return false
    const q = recherche.toLowerCase()
    return !q || [c.prenom, c.nom, c.email].join(' ').toLowerCase().includes(q)
  })

  const nbBannis = clients.filter(c => c.banni).length

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  return (
    <div>
      <h2 className="text-lg font-medium mb-1" style={{ color: '#EDD98A' }}>👥 Clients</h2>
      <p className="text-sm mb-4" style={{ color: '#FFFFFF' }}>
        {clients.length} client{clients.length !== 1 ? 's' : ''} inscrits
        {nbBannis > 0 && <span style={{ color: '#B03A2E' }}> — {nbBannis} banni{nbBannis !== 1 ? 's' : ''}</span>}
      </p>

      {/* Note sécurité */}
      <div className="rounded-lg px-4 py-3 mb-5 text-xs" style={{ background: '#1E1912', border: '1px solid #4A3820', color: '#FFFFFF', lineHeight: '1.6' }}>
        🔒 Les mots de passe sont <strong style={{ color: '#EDD98A' }}>chiffrés par Supabase (bcrypt)</strong> — ni toi ni moi ne pouvons les lire. Pour supprimer complètement un compte de l'authentification, va dans <strong style={{ color: '#EDD98A' }}>Supabase Dashboard → Authentication → Users</strong>.
      </div>

      {/* Recherche + filtres */}
      <div className="flex gap-2 flex-wrap items-center mb-4">
        <input
          type="text"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ background: '#1E1912', borderColor: '#4A3820', color: '#EDD98A', minWidth: '240px' }}
        />
        <button
          onClick={() => setFiltreBannis(false)}
          className="text-xs px-3 py-2 rounded-lg font-medium"
          style={!filtreBannis
            ? { background: '#F0B429', color: '#1E1912' }
            : { background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }}>
          Tous ({clients.length})
        </button>
        <button
          onClick={() => setFiltreBannis(true)}
          className="text-xs px-3 py-2 rounded-lg font-medium"
          style={filtreBannis
            ? { background: '#B03A2E', color: '#fff' }
            : { background: '#2C2518', color: '#B03A2E', border: '1px solid #B03A2E44' }}>
          🚫 Bannis ({nbBannis})
        </button>
      </div>

      {clientsFiltres.length === 0 ? (
        <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucun client trouvé.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {clientsFiltres.map(client => {
            const ouvert = clientOuvert?.id === client.id
            const nbCommandes = client.commandes?.length || 0

            return (
              <div key={client.id} className="rounded-xl border overflow-hidden"
                style={{ background: '#2C2518', borderColor: ouvert ? '#F0B429' : client.banni ? '#B03A2E44' : '#4A3820' }}>

                {/* Ligne principale */}
                <button
                  onClick={() => setClientOuvert(ouvert ? null : client)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar initiales */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                      style={{ background: client.banni ? '#B03A2E33' : '#F0B42922', color: client.banni ? '#B03A2E' : '#F0B429' }}>
                      {(client.prenom?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>
                        {client.prenom} {client.nom}
                      </span>
                      <span className="text-xs ml-2" style={{ color: '#FFFFFF' }}>{client.email}</span>
                    </div>
                    {client.banni && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#B03A2E22', color: '#B03A2E', border: '1px solid #B03A2E44' }}>
                        Banni
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: '#FFFFFF' }}>{nbCommandes} commande{nbCommandes !== 1 ? 's' : ''}</span>
                    <span className="text-xs" style={{ color: '#FFFFFF' }}>
                      {client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : '—'}
                    </span>
                    <span style={{ color: '#FFFFFF' }}>{ouvert ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Détail */}
                {ouvert && (
                  <div className="border-t px-4 py-4 flex flex-col gap-4" style={{ borderColor: '#4A3820' }}>

                    {/* Note admin */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#FFFFFF' }}>Note (visible uniquement par toi)</p>
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={noteEnEdition[client.id] ?? client.note_admin ?? ''}
                          onChange={e => setNoteEnEdition(prev => ({ ...prev, [client.id]: e.target.value }))}
                          placeholder="Ajouter une note sur ce client…"
                          className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                          style={{ background: '#1E1912', borderColor: '#4A3820', color: '#EDD98A' }}
                        />
                        {noteEnEdition[client.id] !== undefined && (
                          <button
                            onClick={() => enregistrerNote(client.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold self-start"
                            style={{ background: '#F0B429', color: '#1E1912' }}>
                            ✓ Sauver
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => toggleBan(client)}
                        className="text-xs px-4 py-2 rounded-lg font-medium"
                        style={client.banni
                          ? { background: '#6B8E4E22', color: '#6B8E4E', border: '1px solid #6B8E4E44' }
                          : { background: '#EDD98A22', color: '#EDD98A', border: '1px solid #EDD98A44' }}>
                        {client.banni ? '✓ Débannir' : '🚫 Bannir'}
                      </button>
                      <button
                        onClick={() => setConfirmation(client)}
                        className="text-xs px-4 py-2 rounded-lg font-medium"
                        style={{ background: '#B03A2E22', color: '#B03A2E', border: '1px solid #B03A2E44' }}>
                        🗑 Supprimer le compte
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl border p-6 max-w-sm w-full mx-4 flex flex-col gap-4" style={{ background: '#2C2518', borderColor: '#B03A2E' }}>
            <h3 className="text-base font-semibold" style={{ color: '#EDD98A' }}>Supprimer le compte ?</h3>
            <p className="text-sm" style={{ color: '#FFFFFF' }}>
              Tu vas supprimer le profil de <strong style={{ color: '#EDD98A' }}>{confirmation.prenom} {confirmation.nom}</strong>.
              L'historique de ses commandes sera conservé mais anonymisé.
            </p>
            <p className="text-xs" style={{ color: '#FFFFFF', opacity: 0.7 }}>
              Le compte de connexion sera également supprimé. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => supprimerCompte(confirmation)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#B03A2E', color: '#fff' }}>
                Supprimer
              </button>
              <button onClick={() => setConfirmation(null)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminClients
