import { useEffect } from 'react'
import { supabase } from '../supabase'

function genererUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export function useVisiteur() {
  useEffect(() => {
    let id = localStorage.getItem('visiteur_id')
    if (!id) {
      id = genererUUID()
      localStorage.setItem('visiteur_id', id)
    }
    supabase.from('visites').insert({ visiteur_id: id }).then(() => {})
  }, [])
}
