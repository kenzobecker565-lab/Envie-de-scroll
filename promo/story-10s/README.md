# Story Instagram de 10 secondes : « Top chrono »

Format 1080×1920, 10 s, calée sur « Le grand défilé » (136 BPM). Minuton lance le chrono, le nom apparaît, « Envie de scroller ? » devient « créer ? », les six passions défilent, puis le logo et « Dispo en test sur Telegram ».

- `scroll-up-story.mp4` : la vidéo finale.
- `story-template.html` : la scène animée (Web Animations, fonction `seek(t)`). Les `{{…}}` sont remplacés par les images de Minuton et la musique, encodées en data URI, pour produire `story.html`.
- `render.mjs` : capture les 300 images (30 i/s) avec Playwright. On assemble ensuite avec ffmpeg, en ajoutant la musique.
