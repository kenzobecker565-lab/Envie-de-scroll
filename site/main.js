// Réglages du site : les deux seules lignes à modifier avant la mise en ligne.
const CONFIG = {
  // Lien du bot de test, par exemple 'https://t.me/scrollup_app_bot'.
  botUrl: 'https://t.me/TON_BOT',
  // Adresse du formulaire de liste d'attente (Formspree, Tally, Brevo…) ; vide = « bientôt ».
  waitlistEndpoint: '',
}

const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const nombre = new Intl.NumberFormat('fr-FR')

$$('[data-bot-link]').forEach((link) => { link.href = CONFIG.botUrl })
$$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()) })

// La bande d'activités : on double la liste pour qu'elle boucle sans à-coup.
const bande = $('[data-marquee]')
if (bande && !calme) {
  $$('li', bande).forEach((item) => {
    const copie = item.cloneNode(true)
    copie.setAttribute('aria-hidden', 'true')
    bande.append(copie)
  })
}

// Le calcul : temps de scroll par jour, puis ce que donneraient 5, 15 ou 30 minutes rendues.
const curseur = $('#temps-scroll')
if (curseur) {
  const sortie = $('#temps-scroll-val')
  const jours = $('#jours-an')
  const duree = (minutes) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (!h) return `${m} min`
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
  }
  const majScroll = () => {
    const minutes = Number(curseur.value)
    sortie.textContent = duree(minutes)
    jours.textContent = nombre.format(Math.round((minutes * 365) / 1440))
    const part = ((minutes - curseur.min) / (curseur.max - curseur.min)) * 100
    curseur.style.setProperty('--rempli', `${part}%`)
  }
  curseur.addEventListener('input', majScroll)
  majScroll()

  const boutons = $$('[data-rendu]')
  const majRendu = (bouton) => {
    const m = Number(bouton.dataset.rendu)
    boutons.forEach((b) => {
      b.setAttribute('aria-checked', String(b === bouton))
      b.tabIndex = b === bouton ? 0 : -1
    })
    $('#heures-rendues').textContent = `${nombre.format(Math.round((m * 365) / 60))} h`
    $('#niveau-max').textContent = `${Math.ceil(600 / m)} jours`
    $('#minutons-an').textContent = nombre.format(m * 365)
  }
  boutons.forEach((bouton, i) => {
    bouton.addEventListener('click', () => majRendu(bouton))
    bouton.addEventListener('keydown', (event) => {
      const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
      if (!pas) return
      event.preventDefault()
      const suivant = boutons[(i + pas + boutons.length) % boutons.length]
      suivant.focus()
      majRendu(suivant)
    })
  })
  majRendu(boutons.find((b) => b.getAttribute('aria-checked') === 'true') || boutons[0])
}

// La démo : trois vraies activités de l'app, selon le temps et les passions cochées.
const NOMS = { dessin: 'Dessin', piano: 'Piano', ecriture: 'Écriture', sport: 'Sport', logique: 'Énigme', francais: 'Français' }
const GENRES = { sport: 'Séance guidée : ', logique: 'Enquête : ', francais: 'Atelier : ' }
const demo = $('#demo-form')
if (demo && window.IDEES) {
  const liste = $('#demo-idees')
  const bulle = $('#demo-bulle')
  const suite = $('#demo-suite')
  const minuton = $('#demo-minuton')
  let deja = new Set($$('.idee-texte', liste).map((el) => el.textContent))

  const pose = (nom) => {
    minuton.src = `assets/minuton-${nom}.webp`
    if (calme) return
    minuton.classList.remove('saute')
    void minuton.offsetWidth
    minuton.classList.add('saute')
  }

  const tirer = () => {
    const minutes = demo.querySelector('[name="duree"]:checked').value
    const passions = $$('[name="passion"]:checked', demo).map((input) => input.value)
    suite.hidden = true
    if (!passions.length) {
      liste.innerHTML = ''
      bulle.textContent = 'Coche au moins une passion, et je te trouve trois idées.'
      pose('think')
      return
    }
    // Une idée par passion tant qu'il y en a, en évitant celles qu'on vient de montrer.
    const choix = []
    const melange = (tableau) => tableau.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v)
    const ordre = melange(passions)
    let tour = 0
    while (choix.length < 3 && tour < 12) {
      const passion = ordre[tour % ordre.length]
      const candidates = melange(window.IDEES[passion][minutes]).filter((t) => !deja.has(t) && !choix.some((c) => c.texte === t))
      const texte = candidates[0] || melange(window.IDEES[passion][minutes]).find((t) => !choix.some((c) => c.texte === t))
      if (texte) choix.push({ passion, texte })
      tour += 1
    }
    deja = new Set(choix.map((c) => c.texte))
    liste.innerHTML = ''
    choix.forEach(({ passion, texte }) => {
      const li = document.createElement('li')
      const bouton = document.createElement('button')
      bouton.type = 'button'
      bouton.className = 'idee'
      bouton.setAttribute('aria-pressed', 'false')
      const tag = document.createElement('span')
      tag.className = 'idee-tag'
      tag.textContent = `${NOMS[passion]} · ${minutes} min`
      const corps = document.createElement('span')
      corps.className = 'idee-texte'
      corps.textContent = (GENRES[passion] || '') + texte
      bouton.append(tag, corps)
      li.append(bouton)
      liste.append(li)
    })
    bulle.textContent = `Voilà trois idées pour tes ${minutes} minutes. Laquelle te donne envie ?`
    pose('idea')
  }

  liste.addEventListener('click', (event) => {
    const bouton = event.target.closest('.idee')
    if (!bouton) return
    $$('.idee', liste).forEach((b) => b.setAttribute('aria-pressed', String(b === bouton)))
    bulle.textContent = 'Bon choix ! Il ne reste plus qu’à t’y mettre.'
    suite.hidden = false
    pose('cheer')
  })
  $$('.idee', liste).forEach((b) => b.setAttribute('aria-pressed', 'false'))
  demo.addEventListener('submit', (event) => { event.preventDefault(); tirer() })
  demo.addEventListener('change', tirer)
}

// Comment ça marche : sur grand écran, le téléphone suit l'étape lue.
const etapes = $$('[data-etape]')
const ecrans = $$('[data-ecran]')
if (etapes.length && ecrans.length && 'IntersectionObserver' in window) {
  const observe = new IntersectionObserver((entrees) => {
    entrees.forEach((entree) => {
      if (!entree.isIntersecting) return
      const n = entree.target.dataset.etape
      etapes.forEach((li) => li.classList.toggle('actif', li === entree.target))
      ecrans.forEach((img) => img.classList.toggle('actif', img.dataset.ecran === n))
    })
  }, { rootMargin: '-45% 0px -45% 0px' })
  etapes.forEach((li) => observe.observe(li))
  etapes[0].classList.add('actif')
}

// Les cartes de passion se retournent.
$$('.carte').forEach((carte) => {
  carte.addEventListener('click', () => {
    carte.setAttribute('aria-pressed', String(carte.getAttribute('aria-pressed') !== 'true'))
  })
})

// La musique signature.
const lecteur = $('#lecteur')
const musique = $('#musique')
if (lecteur && musique) {
  const etat = $('#lecteur-etat')
  const repos = etat.textContent
  const arret = () => { lecteur.setAttribute('aria-pressed', 'false'); etat.textContent = repos }
  lecteur.addEventListener('click', async () => {
    if (musique.paused) {
      try {
        await musique.play()
        lecteur.setAttribute('aria-pressed', 'true')
        etat.textContent = 'En lecture · touche pour arrêter'
      } catch {
        etat.textContent = 'Lecture impossible ici'
      }
    } else {
      musique.pause()
      arret()
    }
  })
  musique.addEventListener('ended', arret)
}

// La story de 10 secondes : elle tourne quand elle est à l'écran, sans le son par défaut.
const story = $('#story')
const son = $('#story-son')
if (story) {
  if (!calme && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entree]) => {
      if (entree.isIntersecting) story.play().catch(() => {})
      else story.pause()
    }, { threshold: 0.4 }).observe(story)
  } else {
    story.controls = true
  }
  son?.addEventListener('click', () => {
    story.muted = !story.muted
    son.setAttribute('aria-pressed', String(!story.muted))
    son.textContent = story.muted ? 'Activer le son' : 'Couper le son'
    if (story.paused) story.play().catch(() => {})
  })
}

// Le QR code du bot, pour passer de l'ordinateur au téléphone.
const qr = $('#qr')
if (qr && typeof window.qrcode === 'function') {
  const code = window.qrcode(0, 'M')
  code.addData(CONFIG.botUrl)
  code.make()
  qr.innerHTML = code.createSvgTag({ cellSize: 4, margin: 0, scalable: true }).replace(/fill="black"/g, 'fill="#24104A"').replace(/fill:black/g, 'fill:#24104A')
}

// La liste d'attente.
const form = $('#liste-attente')
const soon = $('#attente-bientot')
if (form && CONFIG.waitlistEndpoint) {
  form.hidden = false
  if (soon) soon.hidden = true
  const message = $('.form-msg', form)
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = form.email.value.trim()
    if (!form.email.checkValidity() || !email) {
      message.textContent = 'Vérifie ton adresse : il manque peut-être un @ ou un point.'
      form.email.focus()
      return
    }
    const button = $('button', form)
    button.disabled = true
    message.textContent = 'Envoi…'
    try {
      const response = await fetch(CONFIG.waitlistEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
      if (!response.ok) throw new Error(String(response.status))
      form.reset()
      message.textContent = 'C’est noté. On te prévient à la sortie, et c’est tout.'
    } catch {
      message.textContent = 'L’envoi n’a pas marché. Réessaie dans un instant.'
    } finally {
      button.disabled = false
    }
  })
}
