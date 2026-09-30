/**
 * ============================================================================
 *  LE BOT TELEGRAM
 * ============================================================================
 *
 * - /start       : message d'accueil et bouton qui ouvre la Mini App
 * - /stop        : plus de relances
 * - /relances    : réactive les relances
 * - une photo    : relayée vers le chat privé de stockage, puis rangée dans
 *                  la galerie avec le dernier dessin enregistré sans photo
 *
 * Les relances elles-mêmes sont envoyées par reminders.ts.
 */

import { Markup, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import type { Config } from '../config.ts'
import type { PrismaClient } from '../db.ts'
import { attachBotPhoto } from '../services/completions.ts'

export const APP_BUTTON_LABEL = 'Ouvrir Scroll-up'

/** Bouton « ouvrir la Mini App » (uniquement avec une adresse HTTPS). */
export function openAppKeyboard(webAppUrl: string | undefined, label = APP_BUTTON_LABEL) {
  if (!webAppUrl?.startsWith('https://')) return undefined
  return Markup.inlineKeyboard([Markup.button.webApp(label, webAppUrl)])
}

export function createBot(config: Pick<Config, 'botToken' | 'webAppUrl' | 'storageChatId'>, prisma: PrismaClient): Telegraf {
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

  bot.on(message('text'), async (ctx) => {
    await ctx.reply('Quand l’envie de scroller arrive, ouvre l’app\u00A0: on s’occupe de toi.', openAppKeyboard(config.webAppUrl))
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
  ])
  if (webAppUrl?.startsWith('https://')) {
    await bot.telegram.setChatMenuButton({ menuButton: { type: 'web_app', text: 'Ouvrir', web_app: { url: webAppUrl } } })
  }
}
