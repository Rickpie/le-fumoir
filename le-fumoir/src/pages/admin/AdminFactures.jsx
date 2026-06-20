import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'

const STATUTS = {
  autorisee:      { label: 'Autorisée',      couleur: '#A78BFA' },
  confirmee:      { label: 'Confirmée',      couleur: '#F0B429' },
  en_preparation: { label: 'En préparation', couleur: '#6B8E4E' },
  expediee:       { label: 'Expédiée',       couleur: '#4A90D9' },
  annulee:        { label: 'Annulée',        couleur: '#B03A2E' },
}

function AdminFactures() {
  const [commandes, setCommandes] = useState([])
  const [profils, setProfils] = useState({})
  const [chargement, setChargement] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [recherche, setRecherche] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    charger()
  }, [])

  async function charger() {
    const { data: cmds } = await supabase
      .from('commandes')
      .select('*')
      .not('statut', 'eq', 'en_attente')
      .order('created_at', { ascending: false })

    const coms = cmds || []
    setCommandes(coms)

    const profilIds = [...new Set(coms.map(c => c.profil_id).filter(Boolean))]
    if (profilIds.length > 0) {
      const { data: profs } = await supabase
        .from('profils').select('id, prenom, nom').in('id', profilIds)
      const map = {}
      for (const p of profs || []) map[p.id] = p
      setProfils(map)
    }

    setChargement(false)
  }

  const commandesFiltrees = commandes.filter(c => {
    if (filtreStatut !== 'tous' && c.statut !== filtreStatut) return false
    if (recherche.trim()) {
      const p = profils[c.profil_id]
      const texte = [p?.prenom, p?.nom, c.adresse_livraison].filter(Boolean).join(' ').toLowerCase()
      if (!texte.includes(recherche.toLowerCase())) return false
    }
    return true
  })

  const totalCA = commandesFiltrees
    .filter(c => c.statut === 'expediee')
    .reduce((sum, c) => sum + parseFloat(c.total || 0), 0)

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: '#EDD98A' }}>🧾 Factures</h2>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="Rechercher un client..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none"
          style={{ background: '#1E1912', borderColor: '#4A3820', color: '#EDD98A', minWidth: '200px' }}
        />
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none"
          style={{ background: '#1E1912', borderColor: '#4A3820', color: '#EDD98A' }}>
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUTS).map(([val, s]) => (
            <option key={val} value={val}>{s.label}</option>
          ))}
        </select>
        {filtreStatut === 'expediee' && (
          <div className="px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(74,144,217,0.15)', color: '#4A90D9', border: '1px solid rgba(74,144,217,0.3)' }}>
            CA : {totalCA.toFixed(2)} €
          </div>
        )}
      </div>

      {commandesFiltrees.length === 0 ? (
        <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucune facture trouvée.</p>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#4A3820' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#2C2518' }}>
                {['Date', 'Client', 'Total', 'Statut', 'Facture'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#7A6A50', borderBottom: '1px solid #4A3820' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commandesFiltrees.map((c, i) => {
                const p = profils[c.profil_id]
                const s = STATUTS[c.statut] || { label: c.statut, couleur: '#FFFFFF' }
                return (
                  <tr key={c.id}
                    style={{ borderBottom: '1px solid #4A382022', background: i % 2 === 0 ? '#1E1912' : '#221D15' }}>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: '#EDD98A' }}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: '#FFFFFF' }}>
                      {p ? (`${p.prenom || ''} ${p.nom || ''}`.trim() || '—') : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-semibold whitespace-nowrap" style={{ color: '#F0B429' }}>
                      {parseFloat(c.total || 0).toFixed(2)} €
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: s.couleur + '22', color: s.couleur, border: `1px solid ${s.couleur}44` }}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => navigate(`/admin/facture/${c.id}`)}
                        className="text-xs px-2 py-1 rounded-md font-medium"
                        style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
                        Voir →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminFactures
