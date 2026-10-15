// Réglages du site : tout ce qui est à remplir avant la mise en ligne est ici.
const CONFIG = {
  // Lien du bot de test, par exemple 'https://t.me/scrollup_app_bot'.
  // Si une Mini App a un lien direct (https://t.me/ton_bot/app), mets-le plutôt : l'app s'ouvre en un geste.
  botUrl: 'https://t.me/TON_BOT',
  // Adresse du formulaire de liste d'attente (Formspree, Tally, Brevo…) ; vide = « bientôt ».
  waitlistEndpoint: '',
  // Lien de l'app Android de test (APK). Vide = le bloc n'apparaît pas.
  apkUrl: '',
  // Adresse e-mail de contact affichée en pied de page. Vide = rien n'est affiché.
  contactEmail: '',
  // Mesure d'audience sans cookie avec Plausible : le domaine du site, par exemple 'scroll-up.fr'. Vide = aucune mesure.
  plausibleDomain: '',
}

const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const nombre = new Intl.NumberFormat('fr-FR')

$$('[data-bot-link]').forEach((link) => { link.href = CONFIG.botUrl })
$$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()) })

if (CONFIG.contactEmail) {
  $('#contact-email').textContent = CONFIG.contactEmail
  $('#contact').hidden = false
}

// Mesure d'audience (facultative) : on compte les clics vers l'app, par emplacement.
if (CONFIG.plausibleDomain) {
  const script = document.createElement('script')
  script.defer = true
  script.dataset.domain = CONFIG.plausibleDomain
  script.src = 'https://plausible.io/js/script.js'
  document.head.append(script)
  window.plausible = window.plausible || function (...args) { (window.plausible.q = window.plausible.q || []).push(args) }
  $$('[data-suivi]').forEach((lien) => {
    lien.addEventListener('click', () => window.plausible('Essayer', { props: { emplacement: lien.dataset.suivi } }))
  })
}

// La bande d'activités : on double la liste pour qu'elle boucle sans à-coup.
const bande = $('[data-marquee]')
if (bande && !calme) {
  $$('li', bande).forEach((item) => {
    const copie = item.cloneNode(true)
    copie.setAttribute('aria-hidden', 'true')
    bande.append(copie)
  })
}

// La démo : le même tirage que l'app, une idée à la fois.
const NOMS = { dessin: 'Dessin', piano: 'Piano', ecriture: 'Écriture', sport: 'Sport', logique: 'Énigmes', francais: 'Français' }
const GENRES = { sport: 'Séance guidée : ', logique: 'Enquête : ', francais: 'Atelier : ' }
const demo = $('#demo-form')
if (demo && window.IDEES) {
  const carte = $('#idee-carte')
  const texte = $('#idee-texte')
  const minuton = $('#demo-minuton')
  let derniere = texte.textContent

  const pose = () => {
    if (calme) return
    minuton.classList.remove('saute')
    void minuton.offsetWidth
    minuton.classList.add('saute')
  }

  const tirer = () => {
    const minutes = demo.querySelector('[name="duree"]:checked').value
    let passion = demo.querySelector('[name="passion"]:checked').value
    if (passion === 'surprise') {
      const toutes = Object.keys(window.IDEES)
      passion = toutes[Math.floor(Math.random() * toutes.length)]
    }
    const choix = window.IDEES[passion][minutes].filter((t) => (GENRES[passion] || '') + t !== derniere)
    derniere = (GENRES[passion] || '') + choix[Math.floor(Math.random() * choix.length)]
    $('#idee-passion').textContent = NOMS[passion]
    $('#idee-temps').textContent = `${minutes} min`
    texte.textContent = derniere
    carte.classList.remove('tire')
    void carte.offsetWidth
    carte.classList.add('tire')
    pose()
  }

  demo.addEventListener('change', tirer)
  demo.addEventListener('submit', (event) => { event.preventDefault(); tirer() })
  $('#autre-idee').addEventListener('click', tirer)
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

// Rejoindre : « J'ai Telegram » ou « Je n'ai pas Telegram ».
const onglets = $$('[role="tab"]')
const choisirOnglet = (onglet) => {
  onglets.forEach((o) => {
    const actif = o === onglet
    o.setAttribute('aria-selected', String(actif))
    o.tabIndex = actif ? 0 : -1
    $('#' + o.getAttribute('aria-controls')).hidden = !actif
  })
}
onglets.forEach((onglet, i) => {
  onglet.addEventListener('click', () => choisirOnglet(onglet))
  onglet.addEventListener('keydown', (event) => {
    const pas = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!pas) return
    const suivant = onglets[(i + pas + onglets.length) % onglets.length]
    suivant.focus()
    choisirOnglet(suivant)
  })
})
if (CONFIG.apkUrl) {
  $('#lien-apk').href = CONFIG.apkUrl
  $('#bloc-apk').hidden = false
}

// La barre « Essayer » en bas de l'écran du téléphone : visible entre l'accueil et la section Rejoindre.
const barre = $('#barre-cta')
if (barre && 'IntersectionObserver' in window) {
  const vus = new Map()
  const maj = () => {
    const visible = !vus.get('hero') && !vus.get('rejoindre')
    barre.classList.toggle('visible', visible)
    barre.setAttribute('aria-hidden', String(!visible))
    $('a', barre).tabIndex = visible ? 0 : -1
  }
  const observe = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => vus.set(e.target.dataset.zone, e.isIntersecting))
    maj()
  })
  const zones = { hero: $('#hero-actions'), rejoindre: $('#rejoindre') }
  Object.entries(zones).forEach(([nom, el]) => { if (el) { el.dataset.zone = nom; observe.observe(el) } })
}

// Le QR code de l'app, pour passer de l'ordinateur au téléphone.
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
