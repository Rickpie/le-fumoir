import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../supabase'
import UploadPhoto from '../../components/UploadPhoto'

function SelectMultiple({ label, options, selectionnes, onToggle, afficherPrix = true }) {
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>{label}</label>
      <button type="button" onClick={() => setOuvert(!ouvert)}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none text-left flex items-center justify-between gap-2"
        style={inputStyle}>
        <span className="flex flex-wrap gap-1 flex-1">
          {selectionnes.length === 0
            ? <span style={{ color: '#FFFFFF' }}>Aucun sélectionné</span>
            : options.filter(o => selectionnes.includes(o.id)).map(o => (
                <span key={o.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F0B429', color: '#1E1912' }}>
                  {o.nom || o.titre}
                </span>
              ))
          }
        </span>
        <span style={{ color: '#FFFFFF' }}>{ouvert ? '▲' : '▼'}</span>
      </button>

      {ouvert && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border shadow-lg"
          style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          {options.length === 0 ? (
            <p className="text-xs p-3" style={{ color: '#FFFFFF' }}>Aucune option disponible.</p>
          ) : options.map(opt => (
            <label key={opt.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-white/5"
              style={{ color: '#EDD98A' }}>
              <input type="checkbox" checked={selectionnes.includes(opt.id)} onChange={() => onToggle(opt.id)} />
              {opt.nom || opt.titre} {afficherPrix && opt.prix !== undefined && <span style={{ color: '#F0B429' }}>({opt.prix}€)</span>}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminPacks() {
  const [packs, setPacks] = useState([])
  const [tutoriels, setTutoriels] = useState([])
  const [produits, setProduits] = useState([])
  const [fichiers, setFichiers] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [packEnEdition, setPackEnEdition] = useState(null)

  const [form, setForm] = useState({
    titre: '', description: '', prix: '', photo_url: '',
    tutorielsSelectionnes: [], produitsSelectionnes: [], fichiersSelectionnes: [],
  })

  useEffect(() => {
    chargerDonnees()
  }, [])

  async function chargerDonnees() {
    const { data: p } = await supabase.from('packs').select('*').order('created_at', { ascending: false })
    const { data: t } = await supabase.from('tutoriels').select('*').order('titre')
    const { data: pr } = await supabase.from('produits').select('*').order('nom')
    const { data: f } = await supabase.from('fichiers_telechargeables').select('*').order('nom')
    setPacks(p || [])
    setTutoriels(t || [])
    setProduits(pr || [])
    setFichiers(f || [])
    setChargement(false)
  }

  function ouvrirNouveau() {
    setPackEnEdition(null)
    setForm({ titre: '', description: '', prix: '', photo_url: '', tutorielsSelectionnes: [], produitsSelectionnes: [], fichiersSelectionnes: [] })
    setFormulaireOuvert(true)
  }

  async function ouvrirEdition(pack) {
    const { data: pt } = await supabase.from('pack_tutoriels').select('tutoriel_id').eq('pack_id', pack.id)
    const { data: pp } = await supabase.from('pack_produits').select('produit_id').eq('pack_id', pack.id)
    const { data: pf } = await supabase.from('pack_fichiers').select('fichier_id').eq('pack_id', pack.id)
    setPackEnEdition(pack)
    setForm({
      titre: pack.titre,
      description: pack.description || '',
      prix: pack.prix,
      photo_url: pack.photo_url || '',
      tutorielsSelectionnes: (pt || []).map(x => x.tutoriel_id),
      produitsSelectionnes: (pp || []).map(x => x.produit_id),
      fichiersSelectionnes: (pf || []).map(x => x.fichier_id),
    })
    setFormulaireOuvert(true)
  }

  function toggle(liste, id, champ) {
    setForm(f => ({
      ...f,
      [champ]: f[champ].includes(id) ? f[champ].filter(x => x !== id) : [...f[champ], id]
    }))
  }

  async function enregistrer(e) {
    e.preventDefault()
    const payload = {
      titre: form.titre,
      description: form.description,
      prix: parseFloat(form.prix) || 0,
      photo_url: form.photo_url,
    }

    let packId = packEnEdition?.id
    if (packEnEdition) {
      await supabase.from('packs').update(payload).eq('id', packId)
    } else {
      const { data } = await supabase.from('packs').insert(payload).select().single()
      packId = data.id
    }

    await supabase.from('pack_tutoriels').delete().eq('pack_id', packId)
    await supabase.from('pack_produits').delete().eq('pack_id', packId)
    await supabase.from('pack_fichiers').delete().eq('pack_id', packId)

    if (form.tutorielsSelectionnes.length > 0) {
      await supabase.from('pack_tutoriels').insert(form.tutorielsSelectionnes.map(tutoriel_id => ({ pack_id: packId, tutoriel_id })))
    }
    if (form.produitsSelectionnes.length > 0) {
      await supabase.from('pack_produits').insert(form.produitsSelectionnes.map(produit_id => ({ pack_id: packId, produit_id })))
    }
    if (form.fichiersSelectionnes.length > 0) {
      await supabase.from('pack_fichiers').insert(form.fichiersSelectionnes.map(fichier_id => ({ pack_id: packId, fichier_id })))
    }

    setFormulaireOuvert(false)
    chargerDonnees()
  }

  async function toggleVisibilite(pack) {
    await supabase.from('packs').update({ visible: !pack.visible }).eq('id', pack.id)
    chargerDonnees()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer définitivement ce pack ?')) return
    await supabase.from('packs').delete().eq('id', id)
    chargerDonnees()
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }
  const labelStyle = { color: '#FFFFFF' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium" style={{ color: '#EDD98A' }}>📦 Packs</h2>
        <button onClick={ouvrirNouveau} className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#F0B429', color: '#1E1912' }}>
          + Nouveau pack
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={enregistrer} className="rounded-xl border p-4 mb-6 max-w-2xl flex flex-col gap-3"
          style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <h3 className="font-medium" style={{ color: '#EDD98A' }}>
            {packEnEdition ? 'Modifier le pack' : 'Nouveau pack'}
          </h3>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Titre du pack</label>
            <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Décris ce que contient ce pack..."
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Prix du pack (€)</label>
            <input type="number" step="0.01" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Photo du pack</label>
            <UploadPhoto valeur={form.photo_url} onChange={url => setForm({ ...form, photo_url: url })} />
          </div>

          <SelectMultiple
            label="Tutoriels inclus"
            options={tutoriels}
            selectionnes={form.tutorielsSelectionnes}
            onToggle={id => toggle(tutoriels, id, 'tutorielsSelectionnes')}
            afficherPrix={false}
          />

          <SelectMultiple
            label="Produits inclus"
            options={produits}
            selectionnes={form.produitsSelectionnes}
            onToggle={id => toggle(produits, id, 'produitsSelectionnes')}
          />

          <SelectMultiple
            label="Fichiers téléchargeables inclus"
            options={fichiers}
            selectionnes={form.fichiersSelectionnes}
            onToggle={id => toggle(fichiers, id, 'fichiersSelectionnes')}
            afficherPrix={false}
          />

          <div className="flex gap-2 mt-2">
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#F0B429', color: '#1E1912' }}>
              {packEnEdition ? 'Enregistrer' : 'Créer le pack'}
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
        {packs.map(p => (
          <div key={p.id} className="flex items-center justify-between rounded-lg p-3 border"
            style={{ background: '#2C2518', borderColor: '#4A3820', opacity: p.visible ? 1 : 0.5 }}>
            <div className="flex items-center gap-3">
              {p.photo_url && <img src={p.photo_url} alt="" className="w-10 h-10 object-cover rounded-md" />}
              <div>
                <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>{p.titre}</span>
                <span className="text-xs ml-2" style={{ color: '#F0B429' }}>{p.prix} €</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => ouvrirEdition(p)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                Modifier
              </button>
              <button onClick={() => toggleVisibilite(p)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                {p.visible ? 'Cacher' : 'Afficher'}
              </button>
              <button onClick={() => supprimer(p.id)} className="text-xs px-2 py-1 rounded-md"
                style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                Suppr.
              </button>
            </div>
          </div>
        ))}
        {packs.length === 0 && <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucun pack pour l'instant.</p>}
      </div>
    </div>
  )
}

export default AdminPacks
