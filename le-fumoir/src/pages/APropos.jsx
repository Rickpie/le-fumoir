import SEO from '../components/SEO'

function APropos() {
  return (
    <>
      <SEO
        titre="À propos — PC Le Fumoir"
        description="Découvrez l'histoire de PC Le Fumoir, artisan passionné de charcuterie fumée et de salaison."
      />

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-medium mb-2" style={{ color: '#EDD98A' }}>À propos</h1>
        <p className="text-sm mb-8" style={{ color: '#7A6A50' }}>PC Le Fumoir</p>

        {/* Photo + intro */}
        <div className="rounded-2xl border p-6 sm:p-8 mb-6 flex flex-col sm:flex-row gap-6 items-start"
          style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <div className="shrink-0 w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-5xl"
            style={{ background: '#3A2E1A', border: '2px solid #F0B429' }}>
            🔥
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#EDD98A' }}>Bonjour, moi c'est PC</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#FFFFFF' }}>
              Passionné de fumage et de salaison depuis de nombreuses années, j'ai développé
              au fil du temps des techniques et des recettes que j'ai envie de partager.
              Ce site est le prolongement naturel de cette passion artisanale.
            </p>
          </div>
        </div>

        {/* Mon histoire */}
        <div className="rounded-2xl border p-6 sm:p-8 mb-6" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#F0B429' }}>
            📖 Mon histoire
          </h2>
          <div className="text-sm leading-relaxed space-y-3" style={{ color: '#FFFFFF' }}>
            <p>
              Tout a commencé avec une simple envie de contrôler ce que je mets dans mon assiette —
              connaître l'origine, la qualité, et maîtriser chaque étape du processus.
            </p>
            <p>
              Au fil des essais, des ratés et des réussites, j'ai affiné ma méthode.
              Aujourd'hui, je propose des produits artisanaux préparés avec soin,
              et des tutoriels pour que vous puissiez faire de même chez vous.
            </p>
          </div>
        </div>

        {/* Mes valeurs */}
        <div className="rounded-2xl border p-6 sm:p-8 mb-6" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#F0B429' }}>
            ✦ Mes engagements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icone: '🥩', titre: 'Produits de qualité', texte: 'Sélection rigoureuse des matières premières, sans compromis.' },
              { icone: '🧂', titre: 'Techniques éprouvées', texte: 'Salaison traditionnelle, temps de repos respectés, aucune triche.' },
              { icone: '🤝', titre: 'Transparence totale', texte: 'Je partage mes méthodes pour que vous puissiez reproduire chez vous.' },
            ].map(v => (
              <div key={v.titre} className="rounded-xl p-4 text-center" style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
                <p className="text-2xl mb-2">{v.icone}</p>
                <p className="text-xs font-semibold mb-1" style={{ color: '#EDD98A' }}>{v.titre}</p>
                <p className="text-xs" style={{ color: '#FFFFFF' }}>{v.texte}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ce que je propose */}
        <div className="rounded-2xl border p-6 sm:p-8 mb-6" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#F0B429' }}>
            🛒 Ce que je propose
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { titre: 'Charcuteries fumées artisanales', desc: 'Commandes personnalisées avec vos épices et vos goûts.', lien: '/boutique', label: 'Voir la boutique' },
              { titre: 'Tutoriels de salaison & fumage', desc: 'Guides complets pour apprendre les techniques à la maison.', lien: '/tutoriels', label: 'Voir les tutoriels' },
              { titre: 'Calculatrice de salaison', desc: 'Outil gratuit pour calculer vos quantités de sel et d\'épices.', lien: '/calculatrice', label: 'Utiliser la calculatrice' },
            ].map(item => (
              <div key={item.titre} className="flex items-center justify-between gap-4 rounded-xl p-4"
                style={{ background: '#1E1912', border: '1px solid #4A3820' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#EDD98A' }}>{item.titre}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#FFFFFF' }}>{item.desc}</p>
                </div>
                <a href={item.lien} className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)', textDecoration: 'none' }}>
                  {item.label} →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="rounded-2xl border p-6 text-center" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <p className="text-sm mb-3" style={{ color: '#FFFFFF' }}>Une question ? Une commande spéciale ?</p>
          <a href="/contact" className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#F0B429', color: '#1E1912', textDecoration: 'none' }}>
            Me contacter →
          </a>
        </div>
      </div>
    </>
  )
}

export default APropos
