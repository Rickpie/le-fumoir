import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import SEO from '../components/SEO'

function AccordionItem({ question, reponse }) {
  const [ouvert, setOuvert] = useState(false)
  return (
    <div className="border-b" style={{ borderColor: '#4A3820' }}>
      <button type="button" onClick={() => setOuvert(v => !v)}
        className="w-full text-left flex items-center justify-between py-4 gap-3 text-sm font-medium"
        style={{ color: '#EDD98A', background: 'none', border: 'none', cursor: 'pointer' }}>
        <span>{question}</span>
        <span className="shrink-0 text-xs transition-transform" style={{ color: '#F0B429', transform: ouvert ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {ouvert && <p className="pb-4 text-sm leading-relaxed" style={{ color: '#FFFFFF' }}>{reponse}</p>}
    </div>
  )
}

function FAQ() {
  const [items, setItems] = useState([])
  const [contenu, setContenu] = useState('')
  const [chargement, setChargement] = useState(true)

  useEffect(() => { charger() }, [])

  async function charger() {
    const [{ data: faq }, { data: page }] = await Promise.all([
      supabase.from('faq_items').select('*').eq('actif', true).order('ordre').order('cree_le'),
      supabase.from('contact_page').select('contenu').limit(1).single(),
    ])
    setItems(faq || [])
    setContenu(page?.contenu || '')
    setChargement(false)
  }

  if (chargement) return (
    <div className="flex items-center justify-center h-40">
      <p style={{ color: '#FFFFFF' }}>Chargement...</p>
    </div>
  )

  return (
    <>
      <SEO titre="FAQ — PC Le Fumoir" description="Questions fréquentes sur nos produits, nos tutoriels de salaison et fumage, les commandes et la livraison." />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-medium mb-6" style={{ color: '#EDD98A' }}>FAQ</h1>

        {/* Bloc informatif (géré depuis l'admin) */}
        {contenu && (
          <div className="rounded-2xl border p-6 sm:p-8 mb-8" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <div className="prose prose-base max-w-none article-tutoriel" style={{ color: '#EDD98A' }}
              dangerouslySetInnerHTML={{ __html: contenu }} />
          </div>
        )}

        {/* Accordion FAQ */}
        {items.length > 0 ? (
          <div className="rounded-2xl border p-6 sm:p-8" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#F0B429' }}>Questions fréquentes</h2>
            <div>
              {items.map(item => (
                <AccordionItem key={item.id} question={item.question} reponse={item.reponse} />
              ))}
            </div>
          </div>
        ) : (
          !contenu && (
            <div className="text-center py-16" style={{ color: '#7A6A50' }}>
              <p className="text-4xl mb-3">❓</p>
              <p className="text-sm">Aucune question pour le moment.</p>
            </div>
          )
        )}
      </div>
    </>
  )
}

export default FAQ
