// Réglages du site : les deux seules lignes à modifier avant la mise en ligne.
const CONFIG = {
  // Lien du bot de test, par exemple 'https://t.me/scrollup_app_bot'.
  botUrl: 'https://t.me/TON_BOT',
  // Adresse du formulaire de liste d'attente (Formspree, Tally, Brevo…) ; vide = « bientôt ».
  waitlistEndpoint: '',
}

document.querySelectorAll('[data-bot-link]').forEach((link) => { link.href = CONFIG.botUrl })
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()) })

const form = document.getElementById('liste-attente')
const soon = document.getElementById('attente-bientot')
if (form && CONFIG.waitlistEndpoint) {
  form.hidden = false
  if (soon) soon.hidden = true
  const message = form.querySelector('.form-msg')
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = form.email.value.trim()
    if (!form.email.checkValidity() || !email) {
      message.textContent = 'Vérifie ton adresse : il manque peut-être un @ ou un point.'
      form.email.focus()
      return
    }
    const button = form.querySelector('button')
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
