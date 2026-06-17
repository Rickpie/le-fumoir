import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

function AdminFichiers() {
  const [fichiers, setFichiers] = useState([])
  const [chargement, setChargement] = useState(true)
  const [enUpload, setEnUpload] = useState(false)

  const [form, setForm] = useState({ nom: '', description: '', prix: '', fichier_url: '' })

  useEffect(() => {
    chargerFichiers()
  }, [])

  async function chargerFichiers() {
    const { data } = await supabase.from('fichiers_telechargeables').select('*').order('nom')
    setFichiers(data || [])
    setChargement(false)
  }

  async function handleUploadFichier(e) {
    const fichier = e.target.files[0]
    if (!fichier) return

    setEnUpload(true)
    const nomFichier = `${Date.now()}_${fichier.name}`
    const { error } = await supabase.storage.from('photos-produits').upload(nomFichier, fichier)

    if (!error) {
      const { data } = supabase.storage.from('photos-produits').getPublicUrl(nomFichier)
      setForm(f => ({ ...f, fichier_url: data.publicUrl }))
    } else {
      alert('Erreur upload : ' + error.message)
    }
    setEnUpload(false)
  }

  async function ajouterFichier(e) {
    e.preventDefault()
    if (!form.nom || !form.fichier_url) {
      alert('Le nom et le fichier sont obligatoires')
      return
    }
    await supabase.from('fichiers_telechargeables').insert({
      nom: form.nom,
      description: form.description,
      prix: parseFloat(form.prix) || 0,
      fichier_url: form.fichier_url,
    })
    setForm({ nom: '', description: '', prix: '', fichier_url: '' })
    chargerFichiers()
  }

  async function toggleVisibilite(fichier) {
    await supabase.from('fichiers_telechargeables').update({ visible: !fichier.visible }).eq('id', fichier.id)
    chargerFichiers()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer définitivement ce fichier ?')) return
    await supabase.from('fichiers_telechargeables').delete().eq('id', id)
    chargerFichiers()
  }

  if (chargement) return <p style={{ color: '#7a4010' }}>Chargement...</p>

  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }
  const labelStyle = { color: '#7a4010' }

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: '#3d1e06' }}>📄 Fichiers téléchargeables</h2>

      <form onSubmit={ajouterFichier} className="bg-white rounded-xl border p-4 mb-6 max-w-xl flex flex-col gap-3"
        style={{ borderColor: '#d6bfa0' }}>

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Nom du fichier</label>
          <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
            placeholder="ex: Plans du fumoir"
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            rows={2} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Prix si vendu seul (€) — laisser à 0 si uniquement dans un pack</label>
          <input type="number" step="0.01" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Fichier (PDF, etc.)</label>
          <label className="inline-block text-xs px-3 py-2 rounded-lg font-medium cursor-pointer"
            style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
            {enUpload ? 'Upload...' : (form.fichier_url ? '✓ Fichier prêt — changer' : '📤 Choisir un fichier')}
            <input type="file" onChange={handleUploadFichier} className="hidden" disabled={enUpload} />
          </label>
        </div>

        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium self-start"
          style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
          Ajouter le fichier
        </button>
      </form>

      <div className="flex flex-col gap-2 max-w-xl">
        {fichiers.map(f => (
          <div key={f.id} className="flex items-center justify-between bg-white rounded-lg p-3 border"
            style={{ borderColor: '#d6bfa0', opacity: f.visible ? 1 : 0.5 }}>
            <div>
              <span className="text-sm font-medium" style={{ color: '#3d1e06' }}>{f.nom}</span>
              {f.prix > 0 && <span className="text-xs ml-2" style={{ color: '#b06010' }}>{f.prix} €</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleVisibilite(f)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#f5e2c0', color: '#7a4010' }}>
                {f.visible ? 'Cacher' : 'Afficher'}
              </button>
              <button onClick={() => supprimer(f.id)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#fde8e8', color: '#c0392b' }}>
                Suppr.
              </button>
            </div>
          </div>
        ))}
        {fichiers.length === 0 && <p className="text-sm" style={{ color: '#a07050' }}>Aucun fichier pour l'instant.</p>}
      </div>
    </div>
  )
}

export default AdminFichiers