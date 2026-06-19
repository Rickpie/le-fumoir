import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={inputStyle} />
      }
    </div>
  )
}

function AdminFacture() {
  const { commandeId } = useParams()
  const navigate = useNavigate()
  const [facture, setFacture] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    if (commandeId) initialiserFacture()
  }, [commandeId])

  async function initialiserFacture() {
    try { await _initialiserFacture() } catch { setChargement(false) }
  }

  async function _initialiserFacture() {
    const { data: existante } = await supabase
      .from('factures').select('*').eq('commande_id', commandeId).maybeSingle()

    if (existante) {
      setFacture(existante)
      setChargement(false)
      return
    }

    const [{ data: commande }, { data: params }] = await Promise.all([
      supabase.from('commandes').select('*, profils(prenom, nom, email)').eq('id', commandeId).single(),
      supabase.from('parametres_facturation').select('*').limit(1).maybeSingle(),
    ])

    const annee = new Date().getFullYear()
    const { count } = await supabase.from('factures').select('*', { count: 'exact', head: true })
    const numero = `FAC-${annee}-${String((count || 0) + 1).padStart(3, '0')}`

    const nouvelleFacture = {
      commande_id: commandeId,
      numero,
      date_emission: new Date().toISOString().split('T')[0],
      vendeur_nom: params?.vendeur_nom || 'Le Fumoir',
      vendeur_adresse: params?.vendeur_adresse || '',
      vendeur_siret: params?.vendeur_siret || '',
      vendeur_email: params?.vendeur_email || '',
      vendeur_telephone: params?.vendeur_telephone || '',
      client_nom: `${commande?.profils?.prenom || ''} ${commande?.profils?.nom || ''}`.trim(),
      client_adresse: '',
      client_email: commande?.profils?.email || '',
      lignes: (commande?.lignes || []).map(l => ({
        description: l.nom || '',
        quantite: l.quantite || 1,
        prix_ht: parseFloat(l.prix_unitaire) || 0,
      })),
      tva_applicable: false,
      tva_taux: 5.5,
      notes: commande?.notes || '',
      conditions_paiement: params?.conditions_paiement || 'Paiement à réception de la facture.',
      mentions_legales: params?.mentions_legales || "TVA non applicable, art. 293 B du CGI. Pas d'escompte pour paiement anticipé. Pénalité de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.",
      statut: 'brouillon',
    }

    const { data: created } = await supabase.from('factures').insert(nouvelleFacture).select().single()
    setFacture(created || nouvelleFacture)
    setChargement(false)
  }

  function maj(champ, valeur) {
    setFacture(prev => ({ ...prev, [champ]: valeur }))
  }

  function majLigne(index, champ, valeur) {
    const lignes = [...facture.lignes]
    lignes[index] = { ...lignes[index], [champ]: valeur }
    maj('lignes', lignes)
  }

  function ajouterLigne() {
    maj('lignes', [...(facture.lignes || []), { description: '', quantite: 1, prix_ht: 0 }])
  }

  function supprimerLigne(index) {
    maj('lignes', facture.lignes.filter((_, i) => i !== index))
  }

  async function enregistrer() {
    setEnregistrement(true)
    if (facture.id) {
      await supabase.from('factures').update({ ...facture, updated_at: new Date().toISOString() }).eq('id', facture.id)
    }
    setSucces(true)
    setTimeout(() => setSucces(false), 3000)
    setEnregistrement(false)
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>
  if (!facture) return <p style={{ color: '#FFFFFF' }}>Commande introuvable.</p>

  const totalHT = (facture.lignes || []).reduce((sum, l) =>
    sum + ((parseFloat(l.prix_ht) || 0) * (parseInt(l.quantite) || 1)), 0)
  const montantTVA = facture.tva_applicable ? totalHT * (parseFloat(facture.tva_taux) || 0) / 100 : 0
  const totalTTC = totalHT + montantTVA

  const dateFormatee = facture.date_emission
    ? new Date(facture.date_emission + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  return (
    <div>
      {/* ─── Zone édition (masquée à l'impression) ─── */}
      <div className="no-print">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <button onClick={() => navigate('/admin/commandes')} style={{ color: '#FFFFFF', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Retour
          </button>
          <h2 className="text-lg font-medium" style={{ color: '#EDD98A' }}>Facture {facture.numero}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#2C2518', color: '#FFFFFF', border: '1px solid #4A3820' }}>
            {facture.statut === 'brouillon' ? 'Brouillon' : 'Envoyée'}
          </span>
        </div>

        {/* Grille vendeur / client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F0B429' }}>Vendeur</p>
            <Champ label="Nom / Raison sociale" value={facture.vendeur_nom} onChange={v => maj('vendeur_nom', v)} />
            <Champ label="Adresse" value={facture.vendeur_adresse} onChange={v => maj('vendeur_adresse', v)} multiline />
            <Champ label="SIRET" value={facture.vendeur_siret} onChange={v => maj('vendeur_siret', v)} placeholder="XXX XXX XXX XXXXX" />
            <Champ label="Email" value={facture.vendeur_email} onChange={v => maj('vendeur_email', v)} type="email" />
            <Champ label="Téléphone" value={facture.vendeur_telephone} onChange={v => maj('vendeur_telephone', v)} />
          </div>

          <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F0B429' }}>Client &amp; Référence</p>
            <Champ label="Nom complet" value={facture.client_nom} onChange={v => maj('client_nom', v)} />
            <Champ label="Adresse de facturation" value={facture.client_adresse} onChange={v => maj('client_adresse', v)} multiline placeholder="Adresse complète du client" />
            <Champ label="Email" value={facture.client_email} onChange={v => maj('client_email', v)} type="email" />
            <Champ label="N° de facture" value={facture.numero || ''} onChange={v => maj('numero', v)} />
            <Champ label="Date d'émission" value={facture.date_emission || ''} onChange={v => maj('date_emission', v)} type="date" />
          </div>
        </div>

        {/* Lignes */}
        <div className="rounded-xl border p-4 mb-4" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F0B429' }}>Lignes de la facture</p>
            <button onClick={ajouterLigne} className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820' }}>
              + Ajouter une ligne
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {(facture.lignes || []).map((ligne, i) => (
              <div key={i} className="grid items-end gap-2" style={{ gridTemplateColumns: '1fr 70px 120px 28px' }}>
                <div>
                  {i === 0 && <span style={labelStyle}>Désignation</span>}
                  <input value={ligne.description || ''} onChange={e => majLigne(i, 'description', e.target.value)}
                    placeholder="Description" style={inputStyle} />
                </div>
                <div>
                  {i === 0 && <span style={labelStyle}>Qté</span>}
                  <input type="number" min="1" value={ligne.quantite || 1}
                    onChange={e => majLigne(i, 'quantite', parseInt(e.target.value) || 1)} style={inputStyle} />
                </div>
                <div>
                  {i === 0 && <span style={labelStyle}>Prix unit. HT (€)</span>}
                  <input type="number" step="0.01" value={ligne.prix_ht ?? 0}
                    onChange={e => majLigne(i, 'prix_ht', parseFloat(e.target.value) || 0)} style={inputStyle} />
                </div>
                <button onClick={() => supprimerLigne(i)}
                  style={{ color: '#B03A2E', fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer', paddingBottom: i === 0 ? '0' : undefined }}>
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: '#4A3820' }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!facture.tva_applicable}
                onChange={e => maj('tva_applicable', e.target.checked)} />
              <span className="text-sm" style={{ color: '#FFFFFF' }}>TVA applicable</span>
            </label>
            {facture.tva_applicable && (
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#FFFFFF' }}>Taux :</span>
                <input type="number" step="0.1" value={facture.tva_taux ?? 5.5}
                  onChange={e => maj('tva_taux', parseFloat(e.target.value))}
                  style={{ ...inputStyle, width: '80px' }} />
                <span className="text-sm" style={{ color: '#FFFFFF' }}>%</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes / Conditions / Mentions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <Champ label="Notes (optionnel)" value={facture.notes || ''} onChange={v => maj('notes', v)} multiline placeholder="Informations complémentaires..." />
          <Champ label="Conditions de paiement" value={facture.conditions_paiement || ''} onChange={v => maj('conditions_paiement', v)} multiline />
          <Champ label="Mentions légales" value={facture.mentions_legales || ''} onChange={v => maj('mentions_legales', v)} multiline />
        </div>

        {/* Actions */}
        <div className="flex gap-3 items-center flex-wrap mb-8">
          <button onClick={enregistrer} disabled={enregistrement}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#F0B429', color: '#1E1912', opacity: enregistrement ? 0.6 : 1 }}>
            {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button onClick={() => window.print()}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#2C2518', color: '#EDD98A', border: '1px solid #4A3820' }}>
            🖨️ Imprimer / PDF
          </button>
          {succes && <span className="text-xs" style={{ color: '#6B8E4E' }}>✓ Enregistré</span>}
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#FFFFFF' }}>Aperçu</p>
      </div>

      {/* ─── FACTURE IMPRIMABLE ─── */}
      <div id="facture-print" style={{
        background: '#ffffff', color: '#1a1a1a',
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '13px', lineHeight: '1.6',
        padding: '48px 52px', maxWidth: '800px',
        borderRadius: '8px', border: '1px solid #e0d8cc',
      }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 10px' }}>
              {facture.vendeur_nom}
            </h1>
            {facture.vendeur_adresse && <p style={{ margin: '0 0 3px', color: '#555', whiteSpace: 'pre-line' }}>{facture.vendeur_adresse}</p>}
            {facture.vendeur_siret && <p style={{ margin: '0 0 3px', color: '#555' }}>SIRET : {facture.vendeur_siret}</p>}
            {facture.vendeur_email && <p style={{ margin: '0 0 3px', color: '#555' }}>{facture.vendeur_email}</p>}
            {facture.vendeur_telephone && <p style={{ margin: '0', color: '#555' }}>{facture.vendeur_telephone}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c8922a', margin: '0 0 4px', fontWeight: '700' }}>Facture</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' }}>{facture.numero}</p>
            <p style={{ color: '#666', margin: '0', fontSize: '13px' }}>Émise le {dateFormatee}</p>
          </div>
        </div>

        {/* Séparateur doré */}
        <div style={{ height: '2px', background: 'linear-gradient(to right, #c8922a, #f0dba0, transparent)', marginBottom: '28px' }} />

        {/* Destinataire */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', margin: '0 0 8px' }}>Facturer à</p>
          <p style={{ fontWeight: '600', fontSize: '15px', margin: '0 0 4px', color: '#1a1a1a' }}>{facture.client_nom}</p>
          {facture.client_adresse && <p style={{ margin: '0 0 3px', color: '#555', whiteSpace: 'pre-line' }}>{facture.client_adresse}</p>}
          {facture.client_email && <p style={{ margin: '0', color: '#555' }}>{facture.client_email}</p>}
        </div>

        {/* Tableau des lignes */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #c8922a' }}>
              {[['Désignation', 'left', ''], ['Qté', 'center', '60px'], ['Prix unit. HT', 'right', '130px'], ['Total HT', 'right', '130px']].map(([t, a, w]) => (
                <th key={t} style={{ textAlign: a, padding: '8px 10px 8px ' + (a === 'left' ? '0' : '10px'), fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c8922a', width: w || 'auto' }}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(facture.lignes || []).map((ligne, i) => {
              const total = (parseFloat(ligne.prix_ht) || 0) * (parseInt(ligne.quantite) || 1)
              return (
                <tr key={i} style={{ borderBottom: '1px solid #ede5d8' }}>
                  <td style={{ padding: '10px 10px 10px 0', color: '#1a1a1a' }}>{ligne.description}</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#555' }}>{ligne.quantite}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#555' }}>{(parseFloat(ligne.prix_ht) || 0).toFixed(2)} €</td>
                  <td style={{ padding: '10px 0 10px 10px', textAlign: 'right', fontWeight: '600', color: '#1a1a1a' }}>{total.toFixed(2)} €</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div style={{ width: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #ede5d8' }}>
              <span style={{ color: '#666' }}>Total HT</span>
              <span style={{ fontWeight: '600' }}>{totalHT.toFixed(2)} €</span>
            </div>
            {facture.tva_applicable ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #ede5d8' }}>
                <span style={{ color: '#666' }}>TVA ({facture.tva_taux} %)</span>
                <span style={{ fontWeight: '600' }}>{montantTVA.toFixed(2)} €</span>
              </div>
            ) : (
              <div style={{ padding: '7px 0', borderBottom: '1px solid #ede5d8' }}>
                <span style={{ color: '#aaa', fontSize: '11px' }}>TVA non applicable — art. 293 B du CGI</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fdf6ec', borderRadius: '6px', marginTop: '6px' }}>
              <span style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a' }}>Total TTC</span>
              <span style={{ fontWeight: '700', fontSize: '15px', color: '#c8922a' }}>{totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {facture.notes && (
          <div style={{ marginBottom: '24px', padding: '14px 16px', background: '#fdf6ec', borderRadius: '6px', borderLeft: '3px solid #c8922a' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c8922a', margin: '0 0 5px' }}>Notes</p>
            <p style={{ margin: 0, color: '#555', whiteSpace: 'pre-line' }}>{facture.notes}</p>
          </div>
        )}

        {/* Pied */}
        <div style={{ borderTop: '1px solid #ede5d8', paddingTop: '18px' }}>
          {facture.conditions_paiement && (
            <p style={{ margin: '0 0 8px', color: '#555', fontSize: '12px' }}>
              <strong style={{ color: '#1a1a1a' }}>Conditions de paiement : </strong>
              {facture.conditions_paiement}
            </p>
          )}
          {facture.mentions_legales && (
            <p style={{ margin: 0, color: '#999', fontSize: '11px', fontStyle: 'italic', lineHeight: '1.5' }}>
              {facture.mentions_legales}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; }
          #facture-print {
            border: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            padding: 16mm 18mm !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminFacture
