import { Helmet } from 'react-helmet-async'

function SEO({ titre, description, image }) {
  const descriptionDefaut = 'Charcuterie fumée artisanale, tutoriels de salaison et calculatrice de salaison. PC Le Fumoir.'
  const titreDefaut = 'PC Le Fumoir — Charcuterie artisanale & Tutoriels'
  const t = titre || titreDefaut
  const d = description || descriptionDefaut
  const img = image || '/og-image.jpg'

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
    </Helmet>
  )
}

export default SEO
