/**
 * ============================================================================
 *  LE BOT TELEGRAM
 * ============================================================================
 *
 * - /start       : message d'accueil et bouton qui ouvre la Mini App
 * - /stop        : plus de relances
 * - /relances    : réactive les relances
 * - /stats       : ses propres chiffres ; pour un admin, le tableau de bord du test
 * - /avis        : comment donner son avis ; pour un admin, les derniers avis
 * - /admin       : devenir admin (le premier qui le demande, si ADMIN_IDS est vide)
 * - /export      : (admin) les activités validées et les avis, en CSV
 * - une photo    : relayée vers le chat privé de stockage, puis rangée dans
 *                  la galerie avec le dernier dessin enregistré sans photo
 * - un message   : un avis, transmis aux admins
 *
 * Les relances elles-mêmes sont envoyées par reminders.ts.
 */

import { Markup, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import type { Config } from '../config.ts'
import type { PrismaClient } from '../db.ts'
import { attachBotPhoto } from '../services/completions.ts'
import { adminIds, claimAdmin, exportCsv, globalStats, isAdmin, personalStats, recentFeedback, saveFeedback, type Notify } from '../services/feedback.ts'

export const APP_BUTTON_LABEL = 'Ouvrir Scroll-up'

/** Bouton « ouvrir la Mini App » (uniquement avec une adresse HTTPS). */
export function openAppKeyboard(webAppUrl: string | undefined, label = APP_BUTTON_LABEL) {
  if (!webAppUrl?.startsWith('https://')) return undefined
  return Markup.inlineKeyboard([Markup.button.webApp(label, webAppUrl)])
}

/** Transmet un message à chaque admin du test. */
export function adminNotifier(bot: Telegraf, prisma: PrismaClient, envAdmins: readonly string[]): Notify {
  return async (text) => {
    for (const id of await adminIds(prisma, envAdmins)) {
      await bot.telegram.sendMessage(id, text).catch((error) => console.error(`[bot] Message à l’admin ${id} impossible`, error))
    }
  }
}

const ADMIN_HELP = [
  'Commandes d’admin :',
  '/stats : le test en chiffres (parcours, passions, notes, activités préférées)',
  '/avis : les derniers avis écrits (ils arrivent aussi ici en direct)',
  '/export : les activités validées et les avis, en fichiers CSV',
].join('\n')

export function createBot(config: Pick<Config, 'botToken' | 'webAppUrl' | 'storageChatId' | 'adminIds'>, prisma: PrismaClient): Telegraf {
  if (!config.botToken) throw new Error('BOT_TOKEN manquant')
  const bot = new Telegraf(config.botToken)

  /** Enregistre (ou retrouve) l'utilisateur qui écrit au bot : il accepte donc nos messages. */
  async function welcome(from: { id: number; first_name: string; username?: string; language_code?: string }) {
    const id = BigInt(from.id)
    const profile = { firstName: from.first_name, username: from.username ?? null, languageCode: from.language_code ?? null }
    return prisma.user.upsert({
      where: { id },
      create: { id, ...profile, canMessage: true },
      update: { ...profile, canMessage: true },
    })
  }

  bot.start(async (ctx) => {
    await welcome(ctx.from)
    await prisma.user.update({ where: { id: BigInt(ctx.from.id) }, data: { remindersEnabled: true } })
    const keyboard = openAppKeyboard(config.webAppUrl)
    await ctx.reply(
      [
        `Salut ${ctx.from.first_name}\u00A0!`,
        '',
        'Ici, chaque envie de scroller peut devenir un petit moment créatif\u00A0: dessin, écriture, musique, cinéma.',
        '',
        'La prochaine fois que ton pouce te démange, ouvre l’app et appuie sur « J’ai envie de scroller ». On s’occupe du reste.',
        '',
        'Une remarque, une idée, un bug\u00A0? Écris-le-moi simplement ici\u00A0: je le transmets à l’équipe.',
      ].join('\n'),
      keyboard,
    )
  })

  bot.command('stop', async (ctx) => {
    await welcome(ctx.from)
    await prisma.user.update({ where: { id: BigInt(ctx.from.id) }, data: { remindersEnabled: false } })
    await ctx.reply('C’est noté, plus de relances de ma part. Tu peux les réactiver quand tu veux avec /relances.')
  })

  bot.command('relances', async (ctx) => {
    await welcome(ctx.from)
    await prisma.user.update({ where: { id: BigInt(ctx.from.id) }, data: { remindersEnabled: true, unansweredReminders: 0 } })
    await ctx.reply('Relances réactivées. Je garde un œil sur ton pouce.')
  })

  bot.command('stats', async (ctx) => {
    const user = await welcome(ctx.from)
    if (await isAdmin(prisma, config.adminIds, ctx.from.id)) {
      await ctx.reply(await globalStats(prisma))
      return
    }
    await ctx.reply(await personalStats(prisma, user), openAppKeyboard(config.webAppUrl, 'Voir ma galerie'))
  })

  bot.command('avis', async (ctx) => {
    await welcome(ctx.from)
    if (await isAdmin(prisma, config.adminIds, ctx.from.id)) {
      await ctx.reply(await recentFeedback(prisma))
      return
    }
    await ctx.reply('Écris ton avis juste ici, en un ou plusieurs messages\u00A0: ce qui te plaît, ce qui te gêne, tes idées. Je transmets tout à l’équipe. Merci\u00A0!')
  })

  bot.command('admin', async (ctx) => {
    await welcome(ctx.from)
    const result = await claimAdmin(prisma, config.adminIds, ctx.from.id)
    if (result === 'taken') {
      await ctx.reply('Cette commande est réservée à l’équipe de Scroll-up.')
      return
    }
    const intro = result === 'claimed' ? 'C’est fait\u00A0: tu es admin du test. Les avis des testeurs arriveront ici.' : 'Tu es déjà admin du test.'
    await ctx.reply([intro, '', ADMIN_HELP].join('\n'))
  })

  bot.command('export', async (ctx) => {
    await welcome(ctx.from)
    if (!(await isAdmin(prisma, config.adminIds, ctx.from.id))) {
      await ctx.reply('Cette commande est réservée à l’équipe de Scroll-up.')
      return
    }
    const files = await exportCsv(prisma)
    const stamp = new Date().toISOString().slice(0, 10)
    // Le BOM UTF-8 permet à Excel de lire les accents.
    await ctx.replyWithDocument({ source: Buffer.from(`\uFEFF${files.completions}`, 'utf8'), filename: `scroll-up-activites-${stamp}.csv` })
    await ctx.replyWithDocument({ source: Buffer.from(`\uFEFF${files.feedback}`, 'utf8'), filename: `scroll-up-avis-${stamp}.csv` })
  })

  bot.on(message('photo'), async (ctx) => {
    await welcome(ctx.from)
    const largest = ctx.message.photo.at(-1)
    if (!largest) return

    // Relais vers le chat privé de stockage (si configuré) : c'est ce file_id qu'on garde.
    let fileId = largest.file_id
    if (config.storageChatId) {
      try {
        const stored = await ctx.telegram.sendPhoto(config.storageChatId, largest.file_id, {
          caption: `Dessin · utilisateur ${ctx.from.id} · envoyé au bot`,
        })
        fileId = stored.photo.at(-1)?.file_id ?? fileId
      } catch (error) {
        console.error('[bot] Relais vers le chat de stockage impossible', error)
      }
    }

    const attached = await attachBotPhoto(prisma, BigInt(ctx.from.id), `tg:${fileId}`)
    if (attached) {
      await ctx.reply('Bien reçu\u00A0! Ton dessin a rejoint ta galerie.', openAppKeyboard(config.webAppUrl, 'Voir ma galerie'))
    } else {
      await ctx.reply(
        'Joli\u00A0! Pour la ranger dans ta galerie, termine d’abord une activité Dessin dans l’app (tu peux l’enregistrer sans photo), puis renvoie-la-moi.',
        openAppKeyboard(config.webAppUrl),
      )
    }
  })

  // Un message écrit au bot est un avis : il est gardé et transmis aux admins.
  bot.on(message('text'), async (ctx) => {
    const user = await welcome(ctx.from)
    const text = ctx.message.text.trim()
    const nudge = () => ctx.reply('Quand l’envie de scroller arrive, ouvre l’app\u00A0: on s’occupe de toi.', openAppKeyboard(config.webAppUrl))
    if (text.startsWith('/') || text.length < 3) {
      await nudge()
      return
    }
    if (await isAdmin(prisma, config.adminIds, ctx.from.id)) {
      await ctx.reply(ADMIN_HELP)
      return
    }
    await saveFeedback(prisma, user, { message: text.slice(0, 2000), source: 'bot' }, adminNotifier(bot, prisma, config.adminIds))
    await ctx.reply('Merci, c’est transmis à l’équipe\u00A0! Chaque retour nous aide à améliorer l’app.', openAppKeyboard(config.webAppUrl))
  })

  bot.catch((error) => {
    console.error('[bot]', error)
  })

  return bot
}

/** Commandes et bouton de menu, déclarés auprès de Telegram au démarrage. */
export async function configureBotProfile(bot: Telegraf, webAppUrl: string | undefined): Promise<void> {
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Ouvrir l’app' },
    { command: 'stop', description: 'Ne plus recevoir de relances' },
    { command: 'relances', description: 'Réactiver les relances' },
    { command: 'stats', description: 'Tes chiffres de création' },
    { command: 'avis', description: 'Donner ton avis sur l’app' },
  ])
  if (webAppUrl?.startsWith('https://')) {
    await bot.telegram.setChatMenuButton({ menuButton: { type: 'web_app', text: 'Ouvrir', web_app: { url: webAppUrl } } })
  }
}
