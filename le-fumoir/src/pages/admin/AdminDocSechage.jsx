import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../supabase'
import EditeurTexte from '../../components/EditeurTexte'

function AdminDocSechage() {
  const [contenu, setContenu] = useState('')
  const [pageId, setPageId] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [succes, setSucces] = useState(false)
  const [generationPdf, setGenerationPdf] = useState(false)
  const apercuRef = useRef(null)

  useEffect(() => {
    supabase.from('doc_sechage').select('*')
      .then(({ data }) => {
        const lignes = data || []
        const ligneAvecContenu = lignes.find(r => r.contenu && r.contenu.trim().length > 0)
        const ligne = ligneAvecContenu || lignes[0] || null
        if (ligne) {
          setPageId(ligne.id)
          setContenu(ligne.contenu || '')
        }
        setChargement(false)
      })
  }, [])

  async function enregistrer() {
    setEnregistrement(true)
    setSucces(false)
    if (pageId) {
      await supabase.from('doc_sechage').update({ contenu, updated_at: new Date().toISOString() }).eq('id', pageId)
    } else {
      const { data } = await supabase.from('doc_sechage').insert({ contenu }).select().single()
      if (data) setPageId(data.id)
    }
    setSucces(true)
    setTimeout(() => setSucces(false), 3000)
    setEnregistrement(false)
  }

  async function telechargerPdf() {
    if (!apercuRef.current) return
    setGenerationPdf(true)
    const html2pdf = (await import('html2pdf.js')).default
    await html2pdf()
      .set({
        margin: [15, 20, 15, 20],
        filename: 'guide-sechage-le-fumoir.pdf',
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(apercuRef.current)
      .save()
    setGenerationPdf(false)
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  return (
    <div>
      <h2 className="text-lg font-medium mb-1" style={{ color: '#EDD98A' }}>📄 Guide de séchage</h2>
      <p className="text-sm mb-4" style={{ color: '#FFFFFF' }}>
        Ce document sera automatiquement envoyé par email au client lors du paiement d'un produit "à sécher soi-même".
      </p>

      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Éditeur */}
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <p className="text-xs font-medium" style={{ color: '#FFFFFF' }}>Contenu du document</p>
          <EditeurTexte contenu={contenu} onChange={setContenu} />

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={enregistrer} disabled={enregistrement}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
              style={{ background: '#F0B429', color: '#1E1912', opacity: enregistrement ? 0.6 : 1 }}>
              {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={telechargerPdf} disabled={generationPdf || !contenu.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
              style={{ background: '#2C2518', color: '#EDD98A', border: '1px solid #4A3820', opacity: (generationPdf || !contenu.trim()) ? 0.5 : 1 }}>
              {generationPdf ? 'Génération...' : '⬇ Télécharger PDF'}
            </button>
            {succes && <p className="text-xs" style={{ color: '#6B8E4E' }}>✓ Enregistré</p>}
          </div>
        </div>

        {/* Aperçu rendu (utilisé pour la génération PDF) */}
        {contenu.replace(/<[^>]*>/g, '').trim().length > 0 && (
          <div className="rounded-xl border p-6" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <p className="text-xs font-medium mb-4" style={{ color: '#FFFFFF' }}>Aperçu du document</p>
            <div
              ref={apercuRef}
              style={{
                background: '#ffffff',
                color: '#1a1a1a',
                padding: '32px',
                borderRadius: '8px',
                fontFamily: 'Georgia, serif',
                lineHeight: '1.7',
              }}
            >
              <div style={{ borderBottom: '2px solid #c8922a', paddingBottom: '16px', marginBottom: '24px' }}>
                <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c8922a', margin: '0 0 4px' }}>Le Fumoir</p>
                <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Guide de séchage à domicile</h1>
              </div>
              <div
                className="doc-sechage-contenu"
                dangerouslySetInnerHTML={{ __html: contenu }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .doc-sechage-contenu h1 { font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 24px 0 10px; }
        .doc-sechage-contenu h2 { font-size: 15px; font-weight: 700; color: #c8922a; margin: 20px 0 8px; }
        .doc-sechage-contenu h3 { font-size: 13px; font-weight: 600; color: #1a1a1a; margin: 16px 0 6px; }
        .doc-sechage-contenu p  { margin: 0 0 10px; font-size: 13px; color: #2a2a2a; }
        .doc-sechage-contenu ul { padding-left: 20px; margin: 0 0 10px; }
        .doc-sechage-contenu li { font-size: 13px; color: #2a2a2a; margin: 4px 0; }
        .doc-sechage-contenu strong { color: #1a1a1a; }
      `}</style>
    </div>
  )
}

export default AdminDocSechage
