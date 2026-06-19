import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function UploadPhoto({ valeur, onChange }) {
  const [photosExistantes, setPhotosExistantes] = useState([])
  const [bibliothequeOuverte, setBibliothequeOuverte] = useState(false)
  const [enUpload, setEnUpload] = useState(false)

  useEffect(() => {
    if (bibliothequeOuverte) chargerPhotos()
  }, [bibliothequeOuverte])

  async function chargerPhotos() {
    const { data } = await supabase.storage.from('photos-produits').list()
    if (data) {
      const urls = data
        .filter(f => !f.name.startsWith('.'))
        .map(f => supabase.storage.from('photos-produits').getPublicUrl(f.name).data.publicUrl)
      setPhotosExistantes(urls)
    }
  }

  async function handleUpload(e) {
    const fichier = e.target.files[0]
    if (!fichier) return

    setEnUpload(true)
    const nomFichier = `${Date.now()}_${fichier.name}`
    const { error } = await supabase.storage.from('photos-produits').upload(nomFichier, fichier)

    if (!error) {
      const { data } = supabase.storage.from('photos-produits').getPublicUrl(nomFichier)
      onChange(data.publicUrl)
    } else {
      alert('Erreur upload : ' + error.message)
    }
    setEnUpload(false)
  }

  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }

  return (
    <div>
      {/* Aperçu */}
      {valeur && (
        <img src={valeur} alt="Aperçu" className="w-24 h-24 object-cover rounded-lg mb-2 border" style={{ borderColor: '#d6bfa0' }} />
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <label className="text-xs px-3 py-2 rounded-lg font-medium cursor-pointer flex items-center gap-2"
          style={{ background: '#5a2e0e', color: '#fdf0d0', opacity: enUpload ? 0.7 : 1, cursor: enUpload ? 'not-allowed' : 'pointer' }}>
          {enUpload
            ? <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi en cours...</>
            : '📤 Uploader une photo'}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={enUpload} />
        </label>

        <button type="button" onClick={() => setBibliothequeOuverte(!bibliothequeOuverte)}
          className="text-xs px-3 py-2 rounded-lg font-medium"
          style={{ background: '#f5e2c0', color: '#7a4010' }}>
          🖼️ Choisir dans la bibliothèque
        </button>

        {valeur && (
          <button type="button" onClick={() => onChange('')}
            className="text-xs px-3 py-2 rounded-lg font-medium"
            style={{ background: '#fde8e8', color: '#c0392b' }}>
            Retirer
          </button>
        )}
      </div>

      {/* Bibliothèque */}
      {bibliothequeOuverte && (
        <div className="mt-3 p-3 rounded-lg border max-h-48 overflow-y-auto" style={{ borderColor: '#d6bfa0', background: '#fdf6ec' }}>
          {photosExistantes.length === 0 ? (
            <p className="text-xs" style={{ color: '#a07050' }}>Aucune photo dans la bibliothèque pour l'instant.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {photosExistantes.map(url => (
                <img key={url} src={url} alt="" onClick={() => { onChange(url); setBibliothequeOuverte(false) }}
                  className="w-full h-16 object-cover rounded-md cursor-pointer border hover:opacity-80"
                  style={{ borderColor: '#d6bfa0' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UploadPhoto