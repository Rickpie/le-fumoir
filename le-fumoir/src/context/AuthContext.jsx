import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null)
  const [profil, setProfil] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    // Récupère la session active
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUtilisateur(session?.user ?? null)
      if (session?.user) chargerProfil(session.user.id)
      setChargement(false)
    })

    // Écoute les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUtilisateur(session?.user ?? null)
      if (session?.user) chargerProfil(session.user.id)
      else setProfil(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function chargerProfil(userId) {
    const { data } = await supabase
      .from('profils')
      .select('*')
      .eq('id', userId)
      .single()
    setProfil(data)
  }

  async function seConnecter(email, motDePasse) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
    return { error }
  }

  async function sInscrire(email, motDePasse, infos) {
    const { data, error } = await supabase.auth.signUp({ email, password: motDePasse })
    if (!error && data.user) {
      await supabase.from('profils').insert({
        id: data.user.id,
        ...infos,
        role: 'client'
      })
    }
    return { error }
  }

  async function seDeconnecter() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ utilisateur, profil, chargement, seConnecter, sInscrire, seDeconnecter }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}