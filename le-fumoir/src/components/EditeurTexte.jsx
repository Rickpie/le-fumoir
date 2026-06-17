import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { supabase } from '../supabase'


const COULEURS = [
  { nom: 'Brun', valeur: '#5a2e0e' },
  { nom: 'Orange', valeur: '#c07020' },
  { nom: 'Rouge', valeur: '#c0392b' },
  { nom: 'Vert', valeur: '#3B6D11' },
  { nom: 'Noir', valeur: '#1a1a1a' },
]

function EditeurTexte({ contenu, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit, Image, TextStyle, Color],
    content: contenu || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  async function insererImage(e) {
    const fichier = e.target.files[0]
    if (!fichier || !editor) return

    const nomFichier = `${Date.now()}_${fichier.name}`
    const { error } = await supabase.storage.from('photos-produits').upload(nomFichier, fichier)

    if (!error) {
      const { data } = supabase.storage.from('photos-produits').getPublicUrl(nomFichier)
      editor.chain().focus().setImage({ src: data.publicUrl }).run()
    } else {
      alert('Erreur upload : ' + error.message)
    }
    e.target.value = ''
  }

  if (!editor) return null

  const btnStyle = (actif) => ({
    background: actif ? '#5a2e0e' : '#f5e2c0',
    color: actif ? '#fdf0d0' : '#7a4010',
  })

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#d6bfa0' }}>
      {/* Barre d'outils */}
      <div className="flex gap-1 p-2 flex-wrap items-center" style={{ background: '#fdf6ec', borderBottom: '1px solid #d6bfa0' }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className="text-xs px-2 py-1 rounded-md font-bold" style={btnStyle(editor.isActive('bold'))}>
          Gras
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className="text-xs px-2 py-1 rounded-md italic" style={btnStyle(editor.isActive('italic'))}>
          Italique
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="text-xs px-2 py-1 rounded-md" style={btnStyle(editor.isActive('heading', { level: 2 }))}>
          Titre
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="text-xs px-2 py-1 rounded-md" style={btnStyle(editor.isActive('bulletList'))}>
          Liste
        </button>

        <div className="flex items-center gap-1 ml-1 pl-2" style={{ borderLeft: '1px solid #d6bfa0' }}>
          <span className="text-xs mr-1" style={{ color: '#7a4010' }}>Couleur :</span>
          {COULEURS.map(c => (
            <button
              key={c.valeur}
              type="button"
              onClick={() => editor.chain().focus().setColor(c.valeur).run()}
              title={c.nom}
              className="w-5 h-5 rounded-full border"
              style={{ background: c.valeur, borderColor: '#d6bfa0' }}
            />
          ))}
          <button type="button" onClick={() => editor.chain().focus().unsetColor().run()}
            className="text-xs px-2 py-1 rounded-md ml-1" style={{ background: '#f5e2c0', color: '#7a4010' }}>
            Réinitialiser
          </button>
        </div>

        <label className="text-xs px-2 py-1 rounded-md cursor-pointer ml-1" style={{ background: '#f5e2c0', color: '#7a4010' }}>
          📷 Insérer une image
          <input type="file" accept="image/*" onChange={insererImage} className="hidden" />
        </label>
      </div>

      {/* Zone d'édition */}
      <div className="p-3 prose prose-sm max-w-none min-h-[500px]" style={{ color: '#3d1e06' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default EditeurTexte