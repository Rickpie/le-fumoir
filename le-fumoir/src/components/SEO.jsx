import { Helmet } from 'react-helmet-async'

const BASE_URL = 'https://pc-fumoir.fr'
const DESC_DEFAUT = 'Charcuterie fumée artisanale sur commande, tutoriels de salaison et calculatrice de salaison. PC Le Fumoir.'
const TITRE_DEFAUT = 'PC Le Fumoir — Charcuterie artisanale & Tutoriels'

function SEO({ titre, description, image, url, noindex, jsonLd }) {
  const t = titre || TITRE_DEFAUT
  const d = description || DESC_DEFAUT
  const img = image ? (image.startsWith('http') ? image : `${BASE_URL}${image}`) : `${BASE_URL}/og-image.jpg`
  const canonical = url ? `${BASE_URL}${url}` : null

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={img} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={img} />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}

export default SEO
