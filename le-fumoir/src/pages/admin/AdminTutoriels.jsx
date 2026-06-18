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

  useEffect(() => {
    chargerTutoriels()
  }, [])

  async function chargerTutoriels() {
    const { data } = await supabase.from('tutoriels').select('*').order('created_at', { ascending: false })
    setTutoriels(data || [])
    setChargement(false)

    const editId = searchParams.get('edit')
    if (editId && data) {
      const tuto = data.find(t => t.id === editId)
      if (tuto) {
        ouvrirEdition(tuto)
        setSearchParams({})
      }
    }
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

    if (tutoEnEdition) {
      await supabase.from('tutoriels').update(payload).eq('id', tutoEnEdition.id)
    } else {
      await supabase.from('tutoriels').insert(payload)
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

          <label className="flex items-center gap-2 text-sm" style={{ color: '#EDD98A' }}>
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
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#F0B429', color: '#1E1912' }}>
              {tutoEnEdition ? 'Enregistrer' : 'Créer le tutoriel'}
            </button>
            <button type="button" onClick={() => setFormulaireOuvert(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2 max-w-2xl">
        {tutoriels.map(t => (
          <div key={t.id} className="flex items-center justify-between rounded-lg p-3 border"
            style={{ background: '#2C2518', borderColor: '#4A3820', opacity: t.visible ? 1 : 0.5 }}>
            <div className="flex items-center gap-3">
              {t.photo_url && <img src={t.photo_url} alt="" className="w-10 h-10 object-cover rounded-md" />}
              <div>
                <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>{t.titre}</span>
                <span className="text-xs ml-2 px-2 py-0.5 rounded-full"
                  style={t.gratuit
                    ? { background: 'rgba(107,142,78,0.2)', color: '#6B8E4E' }
                    : { background: 'rgba(240,180,41,0.15)', color: '#F0B429' }}>
                  {t.gratuit ? 'Gratuit' : `Payant — ${t.prix} €`}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
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
        {tutoriels.length === 0 && <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucun tutoriel pour l'instant.</p>}
      </div>
    </div>
  )
}

export default AdminTutoriels
