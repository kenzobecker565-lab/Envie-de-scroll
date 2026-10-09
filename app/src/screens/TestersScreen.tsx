import { useEffect, useState } from 'react'
import type { TestersResponse } from '@scroll-up/shared'
import { api } from '../api/client.ts'
import { Screen } from '../components/Screen.tsx'
import { useNavigation } from '../state/AppState.tsx'

const date = (value: string | null) => value ? new Date(value).toLocaleString('fr-FR') : 'Non enregistrée'

export function TestersScreen() {
  const { back } = useNavigation()
  const [data, setData] = useState<TestersResponse>()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    api.testers(page, search).then(value => { if (active) setData(value) }).catch(e => { if (active) { setData(undefined); setError(e.message) } }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, search, refresh])
  return <Screen tabs className="studio-settings">
    <header className="studio-subpage-heading"><button type="button" onClick={back}>← Retour</button><h1>Suivi des testeurs</h1></header>
    <p className="my-4">Réservé à l’administrateur. Un clic sur un lien hors Telegram ne révèle pas l’identité : les ouvertures ci-dessous sont authentifiées par Telegram.</p>
    <button className="studio-setting-row" disabled={loading} onClick={() => setRefresh(v => v + 1)}>Actualiser</button>
    {data && <div className="my-4 rounded-3xl bg-purple-100 p-5"><p>{data.summary.botStarted} ont démarré le bot</p><p>{data.summary.opened} ont ouvert l’application</p><p>{data.summary.registered} ont choisi leurs passions</p></div>}
    <p className="my-4 text-sm">Inscription = passions choisies. « Tutoriel terminé » inclut le tutoriel passé. Le démarrage du bot est suivi à partir de cette mise à jour ; les anciennes ouvertures sont reprises si elles ont été enregistrées.</p>
    <form className="my-4 flex gap-2" onSubmit={e => { e.preventDefault(); setPage(1); setSearch(query.trim()) }}><input className="min-w-0 flex-1 rounded-xl border p-3" aria-label="Rechercher un testeur" placeholder="Prénom ou pseudo Telegram" value={query} onChange={e => setQuery(e.target.value)} /><button type="submit">Rechercher</button></form>
    {loading ? <p role="status">Chargement…</p> : error ? <p role="alert">{error}</p> : data && <>
      <p>{data.total} profil(s){search ? ' trouvé(s)' : ' enregistré(s)'}</p>
      {!data.items.length && <p className="my-4">Aucun testeur trouvé.</p>}
      {data.items.map(user => <article key={user.id} className="my-4 rounded-3xl border bg-white/80 p-5">
        <h2 className="text-xl font-bold">{user.firstName || 'Sans prénom'} {user.username && <span className="text-sm font-normal">@{user.username}</span>}</h2>
        <p className="text-xs">Identifiant Telegram : {user.id}</p>
        <p className="mt-3">Bot démarré : {user.botStarted ? 'Oui' : 'Non enregistré'}</p>
        <p>Application ouverte : {user.openedAt ? 'Oui' : 'Non enregistrée'}</p>
        <p>Inscription : {user.registered ? 'Passions choisies' : 'À compléter'}</p>
        <p>Tutoriel terminé : {user.tutorialCompleted ? 'Oui' : 'Non'}</p>
        <p>{user.activities} activité(s) validée(s)</p>
        <p className="mt-3 text-sm">Première ouverture : {date(user.openedAt)}<br/>Dernière séance enregistrée : {date(user.lastOpenedAt)}</p>
      </article>)}
      <div className="my-5 flex items-center justify-between"><button disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>Précédent</button><span>{data.page} / {data.pages}</span><button disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>Suivant</button></div>
    </>}
  </Screen>
}
