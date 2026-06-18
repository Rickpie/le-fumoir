import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const inputStyle = {
  border: '1px solid #4A3820',
  background: '#1E1912',
  color: '#EDD98A',
  borderRadius: '8px',
  padding: '6px 10px',
  fontSize: '0.875rem',
  width: '100%',
  outline: 'none',
}

const labelStyle = {
  fontSize: '0.68rem',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#FFFFFF',
  marginBottom: '4px',
  display: 'block',
}

function Champ({ label, value, onChange, placeholder, type = 'text', multiline = false }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            style={{ ...inputStyle, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} style={inputStyle} />
      }
    </div>
  )
}

function AdminParametresFacturation() {
  const [params, setParams] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    supabase.from('parametres_facturation').select('*').limit(1).maybeSingle()
      .then(({ data }) => {
        setParams(data || {
          vendeur_nom: 'Le Fumoir',
          vendeur_adresse: '',
          vendeur_siret: '',
          vendeur_email: '',
          vendeur_telephone: '',
          conditions_paiement: 'Paiement à réception de la facture.',
          mentions_legales: "TVA non applicable, art. 293 B du CGI. Pas d'escompte pour paiement anticipé. Pénalité de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.",
        })
        setChargement(false)
      })
  }, [])

  function maj(champ, valeur) {
    setParams(prev => ({ ...prev, [champ]: valeur }))
  }

  async function enregistrer() {
    setEnregistrement(true)
    if (params.id) {
      await supabase.from('parametres_facturation')
        .update({ ...params, updated_at: new Date().toISOString() })
        .eq('id', params.id)
    } else {
      const { data } = await supabase.from('parametres_facturation').insert(params).select().single()
      if (data) setParams(data)
    }
    setSucces(true)
    setTimeout(() => setSucces(false), 3000)
    setEnregistrement(false)
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  return (
    <div>
      <h2 className="text-lg font-medium mb-1" style={{ color: '#EDD98A' }}>⚙️ Paramètres de facturation</h2>
      <p className="text-sm mb-5" style={{ color: '#FFFFFF' }}>
        Ces informations pré-remplissent automatiquement chaque nouvelle facture.
      </p>

      <div className="flex flex-col gap-4 max-w-2xl">
        {/* Infos vendeur */}
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F0B429' }}>Vos informations</p>
          <Champ label="Nom / Raison sociale" value={params.vendeur_nom || ''} onChange={v => maj('vendeur_nom', v)} />
          <Champ label="Adresse complète" value={params.vendeur_adresse || ''} onChange={v => maj('vendeur_adresse', v)} multiline placeholder={"15 rue des Fumeurs\n75001 Paris"} />
          <Champ label="SIRET" value={params.vendeur_siret || ''} onChange={v => maj('vendeur_siret', v)} placeholder="XXX XXX XXX XXXXX" />
          <Champ label="Email" value={params.vendeur_email || ''} onChange={v => maj('vendeur_email', v)} type="email" />
          <Champ label="Téléphone" value={params.vendeur_telephone || ''} onChange={v => maj('vendeur_telephone', v)} placeholder="06 XX XX XX XX" />
        </div>

        {/* Textes par défaut */}
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F0B429' }}>Textes par défaut</p>
          <Champ
            label="Conditions de paiement"
            value={params.conditions_paiement || ''}
            onChange={v => maj('conditions_paiement', v)}
            multiline
          />
          <Champ
            label="Mentions légales"
            value={params.mentions_legales || ''}
            onChange={v => maj('mentions_legales', v)}
            multiline
          />
          <div className="rounded-lg p-3 text-xs" style={{ background: '#1E1912', color: '#FFFFFF', lineHeight: '1.6' }}>
            <p className="font-semibold mb-1" style={{ color: '#EDD98A' }}>Mentions obligatoires en France :</p>
            <ul className="list-disc pl-4 flex flex-col gap-1">
              <li>Si auto-entrepreneur sans TVA : <span style={{ color: '#F0B429' }}>TVA non applicable, art. 293 B du CGI</span></li>
              <li>Pénalités de retard (taux légal × 3)</li>
              <li>Indemnité forfaitaire de recouvrement : 40 €</li>
              <li>Absence d'escompte pour paiement anticipé</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={enregistrer} disabled={enregistrement}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#F0B429', color: '#1E1912', opacity: enregistrement ? 0.6 : 1 }}>
            {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {succes && <span className="text-xs" style={{ color: '#6B8E4E' }}>✓ Enregistré — ces données seront utilisées pour les prochaines factures</span>}
        </div>
      </div>
    </div>
  )
}

export default AdminParametresFacturation
