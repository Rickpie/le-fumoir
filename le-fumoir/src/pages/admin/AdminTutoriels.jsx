import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabase'
import UploadPhoto from '../../components/UploadPhoto'
import EditeurTexte from '../../components/EditeurTexte'

function AdminTutoriels() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tutoriels, setTutoriels] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [tutoEnEdition, setTutoEnEdition] = useState(null)

  const [form, setForm] = useState({
    titre: '', sous_titre: '', contenu: '', photo_url: '', gratuit: true, prix: '',
  })
  const [generationPdf, setGenerationPdf] = useState(false)

  useEffect(() => { chargerTutoriels() }, [])

  async function chargerTutoriels() {
    const { data } = await supabase
      .from('tutoriels')
      .select('*')
      .order('gratuit', { ascending: false })
      .order('ordre', { ascending: true })
      .order('created_at', { ascending: true })

    const tutos = data || []

    // Normalise l'ordre si des doublons existent (ex : tout à 0 au départ)
    const gratuits = tutos.filter(t => t.gratuit)
    const payants = tutos.filter(t => !t.gratuit)
    const aDesnormaliser = [gratuits, payants].some(groupe =>
      groupe.some((t, i) => i > 0 && t.ordre === groupe[i - 1].ordre)
    )
    if (aDesnormaliser) {
      const mises = [...gratuits.map((t, i) => ({ id: t.id, ordre: i })),
                     ...payants.map((t, i) => ({ id: t.id, ordre: i }))]
      await Promise.all(mises.map(({ id, ordre }) =>
        supabase.from('tutoriels').update({ ordre }).eq('id', id)
      ))
      mises.forEach(({ id, ordre }) => {
        const t = tutos.find(x => x.id === id)
        if (t) t.ordre = ordre
      })
    }

    setTutoriels(tutos)
    setChargement(false)

    const editId = searchParams.get('edit')
    if (editId && tutos.length) {
      const tuto = tutos.find(t => t.id === editId)
      if (tuto) { ouvrirEdition(tuto); setSearchParams({}) }
    }
  }

  async function deplacer(tuto, direction) {
    const groupe = tutoriels
      .filter(t => t.gratuit === tuto.gratuit)
      .sort((a, b) => a.ordre - b.ordre)
    const idx = groupe.findIndex(t => t.id === tuto.id)
    const cible = direction === 'haut' ? idx - 1 : idx + 1
    if (cible < 0 || cible >= groupe.length) return

    const liste = [...groupe]
    ;[liste[idx], liste[cible]] = [liste[cible], liste[idx]]

    await Promise.all(liste.map((t, i) =>
      supabase.from('tutoriels').update({ ordre: i }).eq('id', t.id)
    ))
    setTutoriels(prev =>
      prev.map(t => {
        const maj = liste.find(l => l.id === t.id)
        return maj ? { ...t, ordre: liste.indexOf(maj) } : t
      })
    )
  }

  function ouvrirNouveau() {
    setTutoEnEdition(null)
    setForm({ titre: '', sous_titre: '', contenu: '', photo_url: '', gratuit: true, prix: '' })
    setFormulaireOuvert(true)
  }

  function ouvrirEdition(tuto) {
    setTutoEnEdition(tuto)
    setForm({
      titre: tuto.titre,
      sous_titre: tuto.sous_titre || '',
      contenu: tuto.contenu || '',
      photo_url: tuto.photo_url || '',
      gratuit: tuto.gratuit,
      prix: tuto.prix || '',
    })
    setFormulaireOuvert(true)
  }

  async function genererEtUploaderPDF(titre, contenu, tutoId) {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 18
    const maxW = pageW - margin * 2
    let y = 18

    function checkPage(needed = 8) {
      if (y + needed > pageH - 16) { pdf.addPage(); y = 18 }
    }

    // En-tête
    pdf.setFontSize(9)
    pdf.setTextColor(170, 130, 60)
    pdf.text('LE FUMOIR', margin, y)
    y += 10

    // Titre
    pdf.setFontSize(22)
    pdf.setTextColor(44, 26, 14)
    const titreLines = pdf.splitTextToSize(titre, maxW)
    pdf.text(titreLines, margin, y)
    y += titreLines.length * 9 + 3

    // Trait doré
    pdf.setDrawColor(240, 180, 41)
    pdf.setLineWidth(0.8)
    pdf.line(margin, y, margin + 50, y)
    y += 9

    // Parser le HTML de l'éditeur
    const div = document.createElement('div')
    div.innerHTML = contenu

    function renderNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, ' ').trim()
        if (!text) return
        pdf.setFontSize(12)
        pdf.setTextColor(30, 30, 30)
        const lines = pdf.splitTextToSize(text, maxW)
        checkPage(lines.length * 6)
        pdf.text(lines, margin, y)
        y += lines.length * 6 + 2
        return
      }
      const tag = node.tagName?.toLowerCase()
      if (!tag) return
      if (tag === 'h1') {
        y += 4
        pdf.setFontSize(17); pdf.setTextColor(44, 26, 14)
        const lines = pdf.splitTextToSize(node.textContent.trim(), maxW)
        checkPage(lines.length * 8 + 4)
        pdf.text(lines, margin, y); y += lines.length * 8 + 3
        return
      }
      if (tag === 'h2') {
        y += 4
        pdf.setFontSize(15); pdf.setTextColor(60, 36, 16)
        const lines = pdf.splitTextToSize(node.textContent.trim(), maxW)
        checkPage(lines.length * 7 + 3)
        pdf.text(lines, margin, y); y += lines.length * 7 + 3
        return
      }
      if (tag === 'h3') {
        y += 3
        pdf.setFontSize(13); pdf.setTextColor(100, 60, 20)
        const lines = pdf.splitTextToSize(node.textContent.trim(), maxW)
        checkPage(lines.length * 6 + 2)
        pdf.text(lines, margin, y); y += lines.length * 6 + 2
        return
      }
      if (tag === 'p') {
        const text = node.textContent.trim()
        if (!text) { y += 2; return }
        pdf.setFontSize(12); pdf.setTextColor(30, 30, 30)
        const lines = pdf.splitTextToSize(text, maxW)
        checkPage(lines.length * 6 + 4)
        pdf.text(lines, margin, y); y += lines.length * 6 + 4
        return
      }
      if (tag === 'li') {
        const text = '• ' + node.textContent.trim()
        pdf.setFontSize(12); pdf.setTextColor(30, 30, 30)
        const lines = pdf.splitTextToSize(text, maxW - 4)
        checkPage(lines.length * 6 + 2)
        pdf.text(lines, margin + 3, y); y += lines.length * 6 + 2
        return
      }
      if (tag === 'br') { y += 4; return }
      if (tag === 'hr') { y += 2; pdf.setDrawColor(200); pdf.line(margin, y, pageW - margin, y); y += 5; return }
      for (const child of node.childNodes) renderNode(child)
    }

    for (const child of div.childNodes) renderNode(child)

    // Pied de page sur toutes les pages
    const total = pdf.internal.getNumberOfPages()
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8); pdf.setTextColor(170)
      pdf.text(`Le Fumoir — ${dateStr}`, margin, pageH - 8)
      if (total > 1) pdf.text(`${i} / ${total}`, pageW - margin, pageH - 8, { align: 'right' })
    }

    const blob = pdf.output('blob')

    const nomFichier = `tutoriels-pdf/${tutoId}.pdf`
    await supabase.storage.from('photos-produits').upload(nomFichier, blob, {
      contentType: 'application/pdf',
      upsert: true,
    })
    const { data } = supabase.storage.from('photos-produits').getPublicUrl(nomFichier)
    return data.publicUrl
  }

  async function enregistrer(e) {
    e.preventDefault()
    const payload = {
      titre: form.titre,
      sous_titre: form.sous_titre,
      contenu: form.contenu,
      photo_url: form.photo_url,
      gratuit: form.gratuit,
      prix: form.gratuit ? 0 : (parseFloat(form.prix) || 0),
    }

    let tutoId = tutoEnEdition?.id
    if (tutoEnEdition) {
      await supabase.from('tutoriels').update(payload).eq('id', tutoEnEdition.id)
    } else {
      const groupe = tutoriels.filter(t => t.gratuit === form.gratuit)
      payload.ordre = groupe.length
      const { data: inserted } = await supabase.from('tutoriels').insert(payload).select().single()
      tutoId = inserted?.id
    }

    if (form.contenu && tutoId) {
      setGenerationPdf(true)
      try {
        const pdfUrl = await genererEtUploaderPDF(form.titre, form.contenu, tutoId)
        await supabase.from('tutoriels').update({ pdf_url: pdfUrl }).eq('id', tutoId)
      } catch (err) {
        alert('Le PDF n\'a pas pu être généré : ' + err.message)
      }
      setGenerationPdf(false)
    }

    setFormulaireOuvert(false)
    chargerTutoriels()
  }

  async function toggleVisibilite(tuto) {
    await supabase.from('tutoriels').update({ visible: !tuto.visible }).eq('id', tuto.id)
    chargerTutoriels()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer définitivement ce tutoriel ?')) return
    await supabase.from('tutoriels').delete().eq('id', id)
    chargerTutoriels()
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }
  const labelStyle = { color: '#FFFFFF' }

  const gratuits = [...tutoriels].filter(t => t.gratuit).sort((a, b) => a.ordre - b.ordre)
  const payants = [...tutoriels].filter(t => !t.gratuit).sort((a, b) => a.ordre - b.ordre)

  function ListeTutos({ liste, label }) {
    if (liste.length === 0) return (
      <p className="text-xs italic mb-6" style={{ color: '#FFFFFF' }}>Aucun tutoriel {label.toLowerCase()}.</p>
    )
    return (
      <div className="flex flex-col gap-2 mb-6">
        {liste.map((t, idx) => (
          <div key={t.id} className="flex items-center gap-2 rounded-lg p-3 border"
            style={{ background: '#2C2518', borderColor: '#4A3820', opacity: t.visible ? 1 : 0.5 }}>

            {/* Flèches ordre */}
            <div className="flex flex-col gap-0.5">
              <button onClick={() => deplacer(t, 'haut')} disabled={idx === 0}
                className="w-6 h-6 rounded flex items-center justify-center text-xs transition-opacity"
                style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820', opacity: idx === 0 ? 0.3 : 1 }}>
                ▲
              </button>
              <button onClick={() => deplacer(t, 'bas')} disabled={idx === liste.length - 1}
                className="w-6 h-6 rounded flex items-center justify-center text-xs transition-opacity"
                style={{ background: '#1E1912', color: '#EDD98A', border: '1px solid #4A3820', opacity: idx === liste.length - 1 ? 0.3 : 1 }}>
                ▼
              </button>
            </div>

            {/* Miniature */}
            {t.photo_url
              ? <img src={t.photo_url} alt="" className="w-10 h-10 object-cover rounded-md flex-shrink-0" />
              : <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-lg" style={{ background: '#1E1912' }}>📖</div>
            }

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium block truncate" style={{ color: '#EDD98A' }}>{t.titre}</span>
              {t.sous_titre && <span className="text-xs truncate block" style={{ color: '#FFFFFF' }}>{t.sous_titre}</span>}
            </div>

            {/* Badge */}
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={t.gratuit
                ? { background: 'rgba(107,142,78,0.2)', color: '#6B8E4E' }
                : { background: 'rgba(240,180,41,0.15)', color: '#F0B429' }}>
              {t.gratuit ? 'Gratuit' : `${t.prix} €`}
            </span>

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => ouvrirEdition(t)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                Modifier
              </button>
              <button onClick={() => toggleVisibilite(t)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                {t.visible ? 'Cacher' : 'Afficher'}
              </button>
              <button onClick={() => supprimer(t.id)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                Suppr.
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium" style={{ color: '#EDD98A' }}>📖 Tutoriels</h2>
        <button onClick={ouvrirNouveau} className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#F0B429', color: '#1E1912' }}>
          + Nouveau tutoriel
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={enregistrer} className="rounded-xl border p-4 mb-6 flex flex-col gap-3"
          style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <h3 className="font-medium" style={{ color: '#EDD98A' }}>
            {tutoEnEdition ? 'Modifier le tutoriel' : 'Nouveau tutoriel'}
          </h3>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Titre</label>
            <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Sous-titre</label>
            <input value={form.sous_titre} onChange={e => setForm({ ...form, sous_titre: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Photo</label>
            <UploadPhoto valeur={form.photo_url} onChange={url => setForm({ ...form, photo_url: url })} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Contenu</label>
            <EditeurTexte contenu={form.contenu} onChange={html => setForm({ ...form, contenu: html })} />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#EDD98A' }}>
            <input type="checkbox" checked={form.gratuit} onChange={e => setForm({ ...form, gratuit: e.target.checked })} />
            Tutoriel gratuit
          </label>

          {!form.gratuit && (
            <div>
              <label className="block text-xs mb-1 font-medium" style={labelStyle}>Prix de vente à l'unité (€)</label>
              <input type="number" step="0.01" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button type="submit" disabled={generationPdf}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
              style={{ background: '#F0B429', color: '#1E1912', opacity: generationPdf ? 0.6 : 1 }}>
              {generationPdf ? 'Génération du PDF...' : tutoEnEdition ? 'Enregistrer' : 'Créer le tutoriel'}
            </button>
            <button type="button" onClick={() => setFormulaireOuvert(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Section gratuits */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B8E4E' }}>Tutoriels gratuits</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(107,142,78,0.15)', color: '#6B8E4E' }}>{gratuits.length}</span>
        </div>
        <ListeTutos liste={gratuits} label="gratuit" />

        {/* Section payants */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F0B429' }}>Tutoriels payants</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429' }}>{payants.length}</span>
        </div>
        <ListeTutos liste={payants} label="payant" />
      </div>
    </div>
  )
}

export default AdminTutoriels
