function Accueil() {
  return (
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
  )
}

export default Accueil