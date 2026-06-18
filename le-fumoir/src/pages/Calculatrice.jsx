import { useState } from 'react'

const CALCULATRICES = [
  { id: 'viande', label: 'Salaison sous-vide', unite: 'g', placeholderPoids: 1000 },
  { id: 'saumon', label: 'Saumon fumé', unite: 'g', placeholderPoids: 1000 },
  { id: 'foiegras', label: 'Foie gras', unite: 'g', placeholderPoids: 1000 },
  { id: 'saumure', label: 'Saumure légère', unite: 'L', placeholderPoids: 1 },
]

const POURCENTAGES_SEL = [3, 3.5, 4, 4.5, 5, 5.5, 6]

function ligneIngredient(nom, valeur, unite) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: '#e8d9bd' }}>
      <span className="text-sm" style={{ color: '#5a2e0e' }}>{nom}</span>
      <span className="text-sm font-semibold px-3 py-1 rounded-lg" style={{ background: '#fdf0d0', color: '#7a4010' }}>
        {valeur} {unite}
      </span>
    </div>
  )
}

function CarteCalculatrice({ titre, sousTitre, enfants }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8" style={{ borderColor: '#d6bfa0' }}>
      <h2 className="text-xl font-medium mb-1" style={{ color: '#3d1e06' }}>{titre}</h2>
      {sousTitre && <p className="text-sm mb-6" style={{ color: '#a07050' }}>{sousTitre}</p>}
      {enfants}
    </div>
  )
}

function CalculatriceViande() {
  const [poids, setPoids] = useState(1000)
  const [pourcentageSel, setPourcentageSel] = useState(4)

  const sel = (poids * pourcentageSel) / 100
  const sucre = (poids * pourcentageSel) / 200
  const poivre = (poids * 0.1) / 100
  const genievre = (poids * 0.1) / 100
  const quatreEpices = (poids * 0.05) / 100

  return (
    <CarteCalculatrice
      titre="Salaison sous-vide"
      sousTitre="Pour une pièce de viande à saler avant fumage."
      enfants={
        <>
          <div className="mb-4">
            <label className="block text-xs mb-1 font-medium" style={{ color: '#7a4010' }}>Poids de la viande (g)</label>
            <input type="number" value={poids} onChange={e => setPoids(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }} />
          </div>

          <div className="mb-6">
            <label className="block text-xs mb-1 font-medium" style={{ color: '#7a4010' }}>Pourcentage de sel</label>
            <select value={pourcentageSel} onChange={e => setPourcentageSel(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }}>
              {POURCENTAGES_SEL.map(p => <option key={p} value={p}>{p}%</option>)}
            </select>
          </div>

          <div className="rounded-xl p-4" style={{ background: '#fdf6ec' }}>
            {ligneIngredient('Sel fin (ou nitrité)', sel.toFixed(1), 'g')}
            {ligneIngredient('Sucre roux', sucre.toFixed(1), 'g')}
            {ligneIngredient('Poivre moulu', poivre.toFixed(2), 'g')}
            {ligneIngredient('Baie de genièvre', genievre.toFixed(2), 'g')}
            {ligneIngredient('4 épices', quatreEpices.toFixed(2), 'g')}
            {ligneIngredient('Laurier', 2, 'feuilles')}
          </div>
        </>
      }
    />
  )
}

function CalculatriceSaumon() {
  const [poids, setPoids] = useState(1000)

  const sel = (poids * 3.4) / 100
  const sucre = (poids * 1.7) / 100
  const genievre = (poids * 0.1) / 100

  return (
    <CarteCalculatrice
      titre="Saumon fumé"
      sousTitre="Pour une pièce de saumon ou de truite à saler avant fumage."
      enfants={
        <>
          <div className="mb-6">
            <label className="block text-xs mb-1 font-medium" style={{ color: '#7a4010' }}>Poids du poisson (g)</label>
            <input type="number" value={poids} onChange={e => setPoids(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }} />
          </div>

          <div className="rounded-xl p-4" style={{ background: '#fdf6ec' }}>
            {ligneIngredient('Gros sel ou sel fin', sel.toFixed(1), 'g')}
            {ligneIngredient('Sucre', sucre.toFixed(1), 'g')}
            {ligneIngredient('Baie de genièvre moulue', genievre.toFixed(2), 'g')}
          </div>
        </>
      }
    />
  )
}

function CalculatriceFoieGras() {
  const [poids, setPoids] = useState(1000)

  const sel = (poids * 1.2) / 100
  const poivre = (poids * 0.2) / 100
  const quatreEpices = (poids * 0.1) / 100
  const liquoreux = (poids * 3) / 100
  const sucre = (poids * 0.6) / 100

  return (
    <CarteCalculatrice
      titre="Foie gras"
      sousTitre="Pour un foie gras à préparer en terrine ou torchon."
      enfants={
        <>
          <div className="mb-6">
            <label className="block text-xs mb-1 font-medium" style={{ color: '#7a4010' }}>Poids du foie gras (g)</label>
            <input type="number" value={poids} onChange={e => setPoids(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }} />
          </div>

          <div className="rounded-xl p-4" style={{ background: '#fdf6ec' }}>
            {ligneIngredient('Sel', sel.toFixed(1), 'g')}
            {ligneIngredient('Poivre', poivre.toFixed(2), 'g')}
            {ligneIngredient('4 épices', quatreEpices.toFixed(2), 'g')}
            {ligneIngredient('Liquoreux', liquoreux.toFixed(1), 'g')}
            {ligneIngredient('Sucre', sucre.toFixed(2), 'g')}
          </div>
        </>
      }
    />
  )
}

function CalculatriceSaumure() {
  const [volume, setVolume] = useState(1)

  const sel = volume * 60
  const sucre = volume * 30
  const poivre = volume * 5
  const genievre = volume * 10
  const sauge = volume * 2
  const thym = volume * 1
  const girofle = volume * 1
  const laurier = volume * 2

  return (
    <CarteCalculatrice
      titre="Saumure légère"
      sousTitre="Pour un volume d'eau donné, à adapter selon la pièce à immerger."
      enfants={
        <>
          <div className="mb-6">
            <label className="block text-xs mb-1 font-medium" style={{ color: '#7a4010' }}>Volume d'eau (L)</label>
            <input type="number" step="0.1" value={volume} onChange={e => setVolume(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }} />
          </div>

          <div className="rounded-xl p-4" style={{ background: '#fdf6ec' }}>
            {ligneIngredient('Sel fin', sel.toFixed(1), 'g')}
            {ligneIngredient('Sucre roux', sucre.toFixed(1), 'g')}
            {ligneIngredient('Poivre en grain', poivre.toFixed(1), 'g')}
            {ligneIngredient('Baie de genièvre', genievre.toFixed(1), 'g')}
            {ligneIngredient('Sauge', sauge.toFixed(1), 'g')}
            {ligneIngredient('Thym', thym.toFixed(1), 'branche(s)')}
            {ligneIngredient('Clou de girofle', girofle.toFixed(1), 'clou(s)')}
            {ligneIngredient('Laurier', laurier.toFixed(1), 'feuille(s)')}
          </div>
        </>
      }
    />
  )
}

function Calculatrice() {
  const [actif, setActif] = useState('viande')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-medium mb-2" style={{ color: '#3d1e06' }}>Calculatrice de salaison</h1>
      <p className="text-sm mb-6" style={{ color: '#7a4010' }}>
        Choisissez une recette et entrez le poids pour obtenir les quantités exactes.
      </p>

      <div className="flex gap-2 flex-wrap mb-6">
        {CALCULATRICES.map(c => (
          <button key={c.id} onClick={() => setActif(c.id)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={actif === c.id
              ? { background: '#5a2e0e', color: '#fdf0d0' }
              : { background: '#f5e2c0', color: '#7a4010' }}>
            {c.label}
          </button>
        ))}
      </div>

      {actif === 'viande' && <CalculatriceViande />}
      {actif === 'saumon' && <CalculatriceSaumon />}
      {actif === 'foiegras' && <CalculatriceFoieGras />}
      {actif === 'saumure' && <CalculatriceSaumure />}
    </div>
  )
}

export default Calculatrice