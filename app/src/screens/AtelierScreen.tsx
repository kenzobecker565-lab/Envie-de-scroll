import { useEffect, useState } from 'react'
import { Archive, BookOpen, ChevronRight, Frame, Music2, Pencil, Ruler } from 'lucide-react'
import { LEARNING_PASSIONS, getPassion, type CompletionDTO, type LearningPassion } from '@scroll-up/shared'
import { api } from '../api/client.ts'
import { useNavigation } from '../state/AppState.tsx'
import { Screen } from '../components/Screen.tsx'
import { AppHeader } from '../components/AppHeader.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { Button } from '../components/ui/button.tsx'
import { Dialog, DialogContent } from '../components/ui/dialog.tsx'
import { GalleryDetail } from './GalleryScreen.tsx'
import { ATELIER_CAPACITY, atelierSelection } from '../lib/atelier.ts'
import './AtelierScreen.css'
const CORNERS: Record<LearningPassion, string> = {
  dessin: 'Le mur des dessins',
  ecriture: 'Le bureau des histoires',
  piano: 'Le coin piano',
  logique: 'Le tableau des énigmes',
  francais: 'Les mots bien choisis',
  sport: 'Le coin mouvement',
}
type Corner = { items: CompletionDTO[]; more: boolean; error: boolean }
export function AtelierScreen({ focus }: { focus?: string }) {
  const { push } = useNavigation(),
    [selected, setSelected] = useState<LearningPassion>('dessin'),
    [corners, setCorners] = useState<Partial<Record<LearningPassion, Corner>>>({}),
    [opened, setOpened] = useState<CompletionDTO>(),
    [focusError, setFocusError] = useState(false),
    [reload, setReload] = useState(0)
  useEffect(() => {
    let live = true
    for (const passion of LEARNING_PASSIONS)
      api
        .completions(undefined, passion, ATELIER_CAPACITY[passion])
        .then((page) => {
          if (live)
            setCorners((v) => ({
              ...v,
              [passion]: { items: atelierSelection(page.items, passion), more: !!page.nextCursor, error: false },
            }))
        })
        .catch(() => {
          if (live)
            setCorners((v) => ({
              ...v,
              [passion]: { items: v[passion]?.items ?? [], more: v[passion]?.more ?? false, error: true },
            }))
        })
    return () => {
      live = false
    }
  }, [reload])
  useEffect(() => {
    if (!focus) return
    let live = true
    setFocusError(false)
    api
      .completion(focus)
      .then(({ completion }) => {
        if (live) {
          setOpened(completion)
          if (LEARNING_PASSIONS.includes(completion.passion as LearningPassion))
            setSelected(completion.passion as LearningPassion)
        }
      })
      .catch(() => live && setFocusError(true))
    return () => {
      live = false
    }
  }, [focus, reload])
  const corner = corners[selected],
    items = corner?.items ?? []
  return (
    <Screen tabs className="atelier-screen">
      <AppHeader />
      <header className="atelier-heading">
        <div>
          <span>Ton espace, tes créations</span>
          <h1>Chez Minuton</h1>
          <p>Un petit bout de toi, à chaque activité.</p>
        </div>
        <button
          className="atelier-reserve-icon"
          aria-label="Ouvrir la réserve et l’historique"
          onClick={() => push({ name: 'gallery' })}
        >
          <Archive size={22} />
        </button>
      </header>
      <div className="atelier-tabs" aria-label="Les six coins de l’atelier">
        {LEARNING_PASSIONS.map((p) => (
          <button key={p} aria-pressed={p === selected} onClick={() => setSelected(p)}>
            {getPassion(p).label}
          </button>
        ))}
      </div>
      <section className="atelier-room" aria-label={CORNERS[selected]}>
        <div className="atelier-room-label">
          <span>MON ATELIER</span>
          <h2>{CORNERS[selected]}</h2>
        </div>
        <div className="atelier-frames" data-count={items.length}>
          {items.slice(0, selected === 'dessin' ? 6 : 4).map((item, index) => (
            <button
              className="atelier-frame"
              key={item.id}
              style={{ rotate: `${index % 2 ? 1.5 : -1}deg` }}
              onClick={() => setOpened(item)}
              aria-label={`Ouvrir ${item.exploredTitle ?? item.activityText}`}
            >
              {item.photoUrl ? (
                <img src={item.photoUrl} alt="" />
              ) : (
                <>
                  <span className="atelier-frame-icon" aria-hidden="true">
                    {selected === 'piano' ? (
                      <Music2 />
                    ) : selected === 'ecriture' ? (
                      <Pencil />
                    ) : selected === 'dessin' ? (
                      <Frame />
                    ) : (
                      <Ruler />
                    )}
                  </span>
                  <span>{item.text ?? item.exploredTitle ?? item.activityText}</span>
                </>
              )}
            </button>
          ))}
          {corner && !items.length && !corner.error && (
            <div className="atelier-empty-wall">
              <Frame size={27} />
              <p>Une place pour ta prochaine activité</p>
            </div>
          )}
        </div>
        <div className="atelier-mascot">
          <Mascot pose={items.length ? 'cheer' : 'welcome'} size={110} animated={false} />
        </div>
        <span className="atelier-room-caption">
          {items.length ? 'Tes dernières activités prennent place ici.' : 'L’atelier se remplit avec toi.'}
        </span>
      </section>
      {!corner && <p role="status">Minuton ouvre l’atelier…</p>}
      {corner?.error && (
        <div role="alert">
          <p>Ce coin n’a pas pu être chargé.</p>
          <Button variant="secondary" onClick={() => setReload((v) => v + 1)}>
            Réessayer
          </Button>
        </div>
      )}
      {focusError && (
        <div role="alert">
          <p>Cette création n’a pas pu être ouverte.</p>
          <Button variant="secondary" onClick={() => setReload((v) => v + 1)}>
            Réessayer
          </Button>
        </div>
      )}
      <div className="atelier-section-heading">
        <h2>{getPassion(selected).label}</h2>
        <span>
          {items.length} / {ATELIER_CAPACITY[selected]} places
        </span>
      </div>
      <p className="atelier-subtle">Les plus récentes sont exposées. Les précédentes restent dans la réserve.</p>
      <div className="atelier-works">
        {items.map((item) => (
          <button key={item.id} className="atelier-work" onClick={() => setOpened(item)}>
            {item.photoUrl ? (
              <img src={item.photoUrl} alt="" loading="lazy" />
            ) : (
              <span className="atelier-work-symbol">
                <BookOpen size={23} />
              </span>
            )}
            <span>
              <strong>{item.exploredTitle ?? item.activityText}</strong>
              <small>
                {new Date(item.createdAt).toLocaleDateString('fr-FR')} · {item.duration} min
              </small>
              {item.text && <small>Lire mon texte en entier</small>}
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      {corner && !corner.error && !items.length && (
        <Button onClick={() => push({ name: 'passionSpace', passion: selected })}>
          Découvrir les activités de {getPassion(selected).label.toLocaleLowerCase('fr')}
        </Button>
      )}
      <button className="atelier-link" onClick={() => push({ name: 'gallery', passion: selected })}>
        <Archive />
        <span>
          <strong>{corner?.more ? 'Ouvrir ma réserve' : 'Voir en liste'}</strong>
          <small>Toutes mes activités de {getPassion(selected).label.toLocaleLowerCase('fr')}</small>
        </span>
        <ChevronRight />
      </button>
      <button className="atelier-link atelier-notebooks" onClick={() => push({ name: 'learningNotebooks' })}>
        <BookOpen />
        <span>
          <strong>Mes carnets d’apprentissage</strong>
          <small>Les essais de mes leçons, conservés à part</small>
        </span>
        <ChevronRight />
      </button>
      <Dialog
        open={!!opened}
        onOpenChange={(open) => {
          if (!open) setOpened(undefined)
        }}
      >
        <DialogContent>{opened && <GalleryDetail item={opened} />}</DialogContent>
      </Dialog>
    </Screen>
  )
}
