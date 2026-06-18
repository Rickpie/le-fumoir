import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../supabase'

function useApparition() {
  const [visible, setVisible] = useState(false)
  const observerRef = useRef(null)

  const ref = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.12 }
    )
    observer.observe(node)
    observerRef.current = observer
  }, [])

  return [ref, visible]
}

function Accueil() {
  const [contenu, setContenu] = useState('')
  const [chargement, setChargement] = useState(true)
  const [sectionRef, sectionVisible] = useApparition()

  useEffect(() => {
    supabase.from('accueil_contenu').select('*')
      .then(({ data, error }) => {
        console.log('[Accueil] toutes les lignes:', data, 'erreur:', error)
        const ligne = (data || []).find(r => r.contenu && r.contenu.trim().length > 0)
        console.log('[Accueil] ligne retenue:', ligne)
        setContenu(ligne?.contenu || '')
        setChargement(false)
      })
  }, [])

  return (
    <div className="flex flex-col gap-6">

      {/* Hero */}
      <div className="accueil-hero">
        <div className="accueil-fond" />
        <div className="accueil-contenu">
          <p className="accueil-eyebrow anim anim-1">Passion du fumage et du séchage</p>
          <h1 className="accueil-titre anim anim-2">
            Le sel, la fumée,<br />le temps qui fait son œuvre
          </h1>
          <p className="accueil-soustitre anim anim-3">
            Des viandes salées et fumées à la main, prêtes à déguster ou confiées à votre patience pour terminer le séchage chez vous.
          </p>
          <div className="accueil-cta anim anim-4">
            <a href="/boutique" className="accueil-bouton">Découvrir la boutique</a>
          </div>
        </div>
      </div>

      {/* Bloc texte éditorial */}
      {!chargement && contenu.replace(/<[^>]*>/g, '').trim().length > 0 && (
        <div
          ref={sectionRef}
          className="accueil-section"
          style={{
            opacity: sectionVisible ? 1 : 0,
            transform: sectionVisible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          <div className="accueil-section-barre" />
          <div
            className="prose prose-base max-w-none article-tutoriel accueil-section-contenu"
            dangerouslySetInnerHTML={{ __html: contenu }}
          />
        </div>
      )}
    </div>
  )
}

export default Accueil
