import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

function AdminCalculateurConfig() {
  const [config, setConfig] = useState([])
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [succes, setSucces] = useState(false)
  const [nouveauFrais, setNouveauFrais] = useState({ label: '', montant: '' })
  const [nouveauFraisCommande, setNouveauFraisCommande] = useState({ label: '', montant: '' })
  const [editFraisCommande, setEditFraisCommande] = useState({})

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data } = await supabase.from('config_calculateur').select('*').order('ordre')
    setConfig(data || [])
    setChargement(false)
  }

  function modifierValeur(id, valeur) {
    setConfig(prev => prev.map(c => c.id === id ? { ...c, valeur } : c))
  }

  async function sauvegarder() {
    setSauvegarde(true)
    await Promise.all(
      config.map(item =>
        supabase.from('config_calculateur')
          .update({ valeur: parseFloat(item.valeur) || 0 })
          .eq('id', item.id)
      )
    )
    setSauvegarde(false)
    setSucces(true)
    setTimeout(() => setSucces(false), 3000)
  }

  async function ajouterFraisTournee() {
    if (!nouveauFrais.label.trim() || !nouveauFrais.montant) return
    const cle = `custom_${Date.now()}`
    const maxOrdre = config.filter(c => c.type === 'tournee').reduce((m, c) => Math.max(m, c.ordre || 0), 0)
    const { data } = await supabase.from('config_calculateur')
      .insert({
        cle,
        label: nouveauFrais.label.trim(),
        valeur: parseFloat(nouveauFrais.montant) || 0,
        unite: '€/tournée',
        type: 'tournee',
        supprimable: true,
        ordre: maxOrdre + 1,
      })
      .select().single()
    if (data) {
      setConfig(prev => [...prev, data])
      setNouveauFrais({ label: '', montant: '' })
    }
  }

  async function supprimerFrais(id) {
    await supabase.from('config_calculateur').delete().eq('id', id)
    setConfig(prev => prev.filter(c => c.id !== id))
  }

  async function sauvegarderFraisCommande(id) {
    const f = editFraisCommande[id]
    if (!f) return
    await supabase.from('config_calculateur')
      .update({ label: f.label, valeur: parseFloat(f.valeur) || 0 })
      .eq('id', id)
    setConfig(prev => prev.map(c => c.id === id ? { ...c, label: f.label, valeur: parseFloat(f.valeur) || 0 } : c))
    setEditFraisCommande(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  async function ajouterFraisCommande() {
    if (!nouveauFraisCommande.label.trim() || !nouveauFraisCommande.montant) return
    const cle = `commande_${Date.now()}`
    const maxOrdre = config.filter(c => c.type === 'commande').reduce((m, c) => Math.max(m, c.ordre || 0), 0)
    const { data } = await supabase.from('config_calculateur')
      .insert({
        cle,
        label: nouveauFraisCommande.label.trim(),
        valeur: parseFloat(nouveauFraisCommande.montant) || 0,
        unite: '€/commande',
        type: 'commande',
        supprimable: true,
        ordre: maxOrdre + 1,
      })
      .select().single()
    if (data) {
      setConfig(prev => [...prev, data])
      setNouveauFraisCommande({ label: '', montant: '' })
    }
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  const fraisTournee = config.filter(c => c.type === 'tournee').sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  const mainOeuvre = config.filter(c => c.type === 'main_oeuvre')
  const margeItem = config.find(c => c.type === 'marge')
  const fraisCommande = config.filter(c => c.type === 'commande').sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  const totalTournee = fraisTournee.reduce((s, c) => s + (parseFloat(c.valeur) || 0), 0)

  const Ligne = ({ item, onDelete, deletable = false }) => (
    <div className="flex items-center gap-3">
      <label className="text-sm flex-1" style={{ color: '#FFFFFF' }}>{item.label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number" step="0.01" min="0"
          value={item.valeur}
          onChange={e => modifierValeur(item.id, e.target.value)}
          className="w-24 px-3 py-1.5 rounded-lg border text-sm outline-none text-right"
          style={inputStyle}
        />
        <span className="text-xs w-16 shrink-0" style={{ color: '#7A6A50' }}>{item.unite}</span>
        {deletable && (
          <button onClick={() => onDelete(item.id)}
            className="text-xs px-1.5 py-1 rounded"
            style={{ color: '#B03A2E', background: '#3A2E1A' }}>
            ✕
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <h2 className="text-lg font-medium mb-1" style={{ color: '#EDD98A' }}>⚙️ Configuration des frais</h2>
      <p className="text-sm mb-6" style={{ color: '#FFFFFF' }}>
        Ces valeurs servent de base à tous vos calculs de prix. Modifiez-les selon vos coûts réels.
      </p>

      {succes && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(107,142,78,0.15)', color: '#6B8E4E', border: '1px solid rgba(107,142,78,0.3)' }}>
          ✓ Configuration enregistrée avec succès.
        </div>
      )}

      <div className="max-w-lg flex flex-col gap-5">

        {/* Frais par tournée */}
        <div className="rounded-xl border p-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: '#F0B429' }}>Frais fixes par tournée</h3>
          <p className="text-xs mb-4" style={{ color: '#7A6A50' }}>
            Ces frais sont divisés par le nombre de pièces lors du calcul. Ajoutez tout ce que vous consommez par session.
          </p>
          <div className="flex flex-col gap-3">
            {fraisTournee.map(item => (
              <Ligne key={item.id} item={item} onDelete={supprimerFrais} deletable={true} />
            ))}

            {/* Total */}
            <div className="pt-2 mt-1 border-t flex justify-between items-center" style={{ borderColor: '#4A3820' }}>
              <span className="text-xs font-medium" style={{ color: '#FFFFFF' }}>Total par tournée</span>
              <span className="text-base font-semibold" style={{ color: '#F0B429' }}>
                {totalTournee.toFixed(2)} €
              </span>
            </div>

            {/* Ajouter un frais */}
            <div className="pt-3 mt-1 border-t flex gap-2" style={{ borderColor: '#4A3820' }}>
              <input
                placeholder="Nom du frais (ex: Sel de nitrification)"
                value={nouveauFrais.label}
                onChange={e => setNouveauFrais(p => ({ ...p, label: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && ajouterFraisTournee()}
                className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="number" step="0.01" min="0" placeholder="€"
                value={nouveauFrais.montant}
                onChange={e => setNouveauFrais(p => ({ ...p, montant: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && ajouterFraisTournee()}
                className="w-20 px-3 py-1.5 rounded-lg border text-sm outline-none text-right"
                style={inputStyle}
              />
              <button
                onClick={ajouterFraisTournee}
                className="px-3 py-1.5 rounded-lg text-sm font-medium shrink-0"
                style={{ background: '#F0B429', color: '#1E1912' }}
              >
                + Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* Main d'oeuvre */}
        <div className="rounded-xl border p-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#F0B429' }}>Main d'œuvre</h3>
          <div className="flex flex-col gap-3">
            {mainOeuvre.map(item => <Ligne key={item.id} item={item} onDelete={supprimerFrais} />)}
          </div>
        </div>

        {/* Marge */}
        {margeItem && (
          <div className="rounded-xl border p-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#F0B429' }}>Marge</h3>
            <Ligne item={margeItem} onDelete={supprimerFrais} />
            <p className="text-xs mt-3" style={{ color: '#7A6A50' }}>
              Modifiable à la volée dans la calculatrice. Exemple : prix de revient 10€ + 30% = prix conseillé 13€.
            </p>
          </div>
        )}

        {/* Frais visibles par le client à la commande */}
        <div className="rounded-xl border p-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: '#F0B429' }}>Frais à la commande</h3>
          <p className="text-xs mb-4" style={{ color: '#7A6A50' }}>
            Ces frais sont affichés au client dans son panier et ajoutés au total. Facturés une seule fois par commande.
          </p>
          <div className="flex flex-col gap-3">
            {fraisCommande.length === 0 && (
              <p className="text-xs" style={{ color: '#7A6A50' }}>Aucun frais configuré. Ajoutez-en ci-dessous.</p>
            )}
            {fraisCommande.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                {editFraisCommande[item.id] ? (
                  <>
                    <input
                      value={editFraisCommande[item.id].label}
                      onChange={e => setEditFraisCommande(prev => ({ ...prev, [item.id]: { ...prev[item.id], label: e.target.value } }))}
                      className="flex-1 px-2 py-1.5 rounded-lg border text-sm outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="number" step="0.01" min="0"
                      value={editFraisCommande[item.id].valeur}
                      onChange={e => setEditFraisCommande(prev => ({ ...prev, [item.id]: { ...prev[item.id], valeur: e.target.value } }))}
                      className="w-24 px-2 py-1.5 rounded-lg border text-sm outline-none text-right"
                      style={inputStyle}
                    />
                    <span className="text-xs w-20 shrink-0" style={{ color: '#7A6A50' }}>€/commande</span>
                    <button onClick={() => sauvegarderFraisCommande(item.id)}
                      className="text-xs px-2 py-1 rounded" style={{ background: '#6B8E4E', color: '#fff' }}>✓</button>
                    <button onClick={() => setEditFraisCommande(prev => { const n = { ...prev }; delete n[item.id]; return n })}
                      className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#7A6A50' }}>✕</button>
                  </>
                ) : (
                  <>
                    <label className="text-sm flex-1" style={{ color: '#FFFFFF' }}>{item.label}</label>
                    <span className="text-sm font-semibold" style={{ color: '#EDD98A' }}>{parseFloat(item.valeur).toFixed(2)}</span>
                    <span className="text-xs w-20 shrink-0" style={{ color: '#7A6A50' }}>€/commande</span>
                    <button
                      onClick={() => setEditFraisCommande(prev => ({ ...prev, [item.id]: { label: item.label, valeur: item.valeur } }))}
                      className="text-xs px-2 py-1 rounded" style={{ background: '#3A2E1A', color: '#EDD98A' }}>✏️</button>
                    <button onClick={() => supprimerFrais(item.id)}
                      className="text-xs px-1.5 py-1 rounded" style={{ color: '#B03A2E', background: '#3A2E1A' }}>✕</button>
                  </>
                )}
              </div>
            ))}

            <div className="pt-3 mt-1 border-t flex gap-2" style={{ borderColor: '#4A3820' }}>
              <input
                placeholder="Libellé (ex: Frais de port)"
                value={nouveauFraisCommande.label}
                onChange={e => setNouveauFraisCommande(p => ({ ...p, label: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && ajouterFraisCommande()}
                className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="number" step="0.01" min="0" placeholder="€"
                value={nouveauFraisCommande.montant}
                onChange={e => setNouveauFraisCommande(p => ({ ...p, montant: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && ajouterFraisCommande()}
                className="w-20 px-3 py-1.5 rounded-lg border text-sm outline-none text-right"
                style={inputStyle}
              />
              <button
                onClick={ajouterFraisCommande}
                className="px-3 py-1.5 rounded-lg text-sm font-medium shrink-0"
                style={{ background: '#F0B429', color: '#1E1912' }}
              >
                + Ajouter
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={sauvegarder}
          disabled={sauvegarde}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold self-start transition-opacity"
          style={{ background: '#F0B429', color: '#1E1912', opacity: sauvegarde ? 0.6 : 1 }}
        >
          {sauvegarde ? 'Enregistrement...' : 'Enregistrer la configuration'}
        </button>
      </div>
    </div>
  )
}

export default AdminCalculateurConfig
