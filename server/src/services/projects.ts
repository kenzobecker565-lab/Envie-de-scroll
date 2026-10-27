/**
 * Les projets : des créations d'une même passion rangées ensemble
 * (« Mon carnet de chats », « Ma nouvelle »), avec un objectif si on veut
 * (un nombre de créations). On range une création à la confirmation, depuis
 * la galerie, ou automatiquement quand on lance une activité depuis le projet.
 *
 * Et la signature de chaque passion (détail de la progression) : premier et
 * dernier dessin, texte le plus long, titres explorés.
 */

import {
  countWords,
  isPassionId,
  type CompletionDTO,
  type PassionDetailResponse,
  type PassionId,
  type ProjectDTO,
} from '@scroll-up/shared'
import type { Completion, PrismaClient, Project, User } from '../db.ts'
import { ApiError, badRequest } from '../http/errors.ts'
import { toCompletionDTO } from './completions.ts'
import { parsePassions } from './users.ts'
import { sessionMinutes } from './sessionMinutes.ts'

export const MAX_PROJECT_NAME = 40
export const MAX_PROJECT_GOAL = 100
/** Au plus tant de projets par personne (garde-fou). */
const MAX_PROJECTS = 30

type PhotoUrl = (completion: Completion) => string
type ProjectRow = Project & { completions: (Completion & { proposal: { createdAt: Date } })[] }

export function toProjectDTO(project: ProjectRow, photoUrl: PhotoUrl): ProjectDTO {
  const withPhoto = project.completions.filter((completion) => completion.photoRef)
  const cover = withPhoto.at(-1)
  return {
    id: project.id,
    passion: project.passion as PassionId,
    name: project.name,
    goal: project.goal,
    creations: project.completions.length,
    minutes: project.completions.reduce((sum, completion) => sum + sessionMinutes(completion), 0),
    words: project.completions.reduce((sum, completion) => sum + countWords(completion.text), 0),
    coverUrl: cover ? photoUrl(cover) : null,
    createdAt: project.createdAt.toISOString(),
    finishedAt: project.finishedAt?.toISOString() ?? null,
  }
}

const withCompletions = { completions: { orderBy: { createdAt: 'asc' as const }, include: { proposal: { select: { createdAt: true } } } } }

export async function listProjects(prisma: PrismaClient, user: User, photoUrl: PhotoUrl): Promise<ProjectDTO[]> {
  const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: withCompletions })
  return projects.map((project) => toProjectDTO(project, photoUrl))
}

function cleanName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (!name) throw badRequest('Donne un nom à ton projet.')
  if (name.length > MAX_PROJECT_NAME) throw badRequest(`Un nom de ${MAX_PROJECT_NAME} caractères au plus.`)
  return name
}

function cleanGoal(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_PROJECT_GOAL) {
    throw badRequest(`L’objectif est un nombre de créations, de 1 à ${MAX_PROJECT_GOAL}.`)
  }
  return value
}

async function ownProject(prisma: PrismaClient, user: User, id: string): Promise<Project> {
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } })
  if (!project) throw new ApiError(404, 'not_found', 'Projet introuvable.')
  return project
}

export async function createProject(prisma: PrismaClient, user: User, body: Record<string, unknown>, now = new Date()): Promise<Project> {
  const { passion } = body
  if (!isPassionId(passion) || !parsePassions(user).includes(passion)) throw badRequest('Choisis une de tes passions.')
  const name = cleanName(body.name)
  const goal = cleanGoal(body.goal)
  if ((await prisma.project.count({ where: { userId: user.id } })) >= MAX_PROJECTS) throw badRequest('Tu as déjà beaucoup de projets : termine ou supprime-en un.')
  return prisma.project.create({ data: { userId: user.id, passion, name, goal, createdAt: now } })
}

export async function updateProject(prisma: PrismaClient, user: User, id: string, body: Record<string, unknown>, now = new Date()): Promise<Project> {
  const project = await ownProject(prisma, user, id)
  const data: { name?: string; goal?: number | null; finishedAt?: Date | null } = {}
  if (body.name !== undefined) data.name = cleanName(body.name)
  if (body.goal !== undefined) data.goal = cleanGoal(body.goal)
  if (body.finished !== undefined) {
    if (typeof body.finished !== 'boolean') throw badRequest('Réglage du projet inconnu.')
    data.finishedAt = body.finished ? (project.finishedAt ?? now) : null
  }
  return prisma.project.update({ where: { id: project.id }, data })
}

/** Supprime le projet ; ses créations restent dans la galerie. */
export async function deleteProject(prisma: PrismaClient, user: User, id: string): Promise<void> {
  const project = await ownProject(prisma, user, id)
  await prisma.project.delete({ where: { id: project.id } })
}

export async function projectDetail(prisma: PrismaClient, user: User, id: string, photoUrl: PhotoUrl): Promise<{ project: ProjectDTO; items: CompletionDTO[] }> {
  const project = await prisma.project.findFirst({ where: { id, userId: user.id }, include: withCompletions })
  if (!project) throw new ApiError(404, 'not_found', 'Projet introuvable.')
  return { project: toProjectDTO(project, photoUrl), items: project.completions.map((completion) => toCompletionDTO(completion, photoUrl)) }
}

/** Le projet où ranger une création de cette passion (le sien, de la même passion, pas terminé). */
export async function projectForPassion(prisma: PrismaClient, user: User, projectId: string, passion: string): Promise<Project> {
  const project = await ownProject(prisma, user, projectId)
  if (project.passion !== passion) throw badRequest('Ce projet est d’une autre passion.')
  if (project.finishedAt) throw new ApiError(409, 'invalid_request', 'Ce projet est terminé : rouvre-le pour y ajouter une création.')
  return project
}

/** Range une création dans un projet, ou l'en sort (`projectId` null). */
export async function assignProject(prisma: PrismaClient, user: User, completionId: string, projectId: unknown): Promise<Completion> {
  const completion = await prisma.completion.findFirst({ where: { id: completionId, userId: user.id } })
  if (!completion) throw new ApiError(404, 'not_found', 'Activité introuvable.')
  if (projectId !== null && typeof projectId !== 'string') throw badRequest('Projet inconnu.')
  if (projectId) await projectForPassion(prisma, user, projectId, completion.passion)
  return prisma.completion.update({ where: { id: completion.id }, data: { projectId } })
}

/* ------------------------------------------------- signature d'une passion */

export async function passionDetail(prisma: PrismaClient, user: User, passion: PassionId, photoUrl: PhotoUrl): Promise<PassionDetailResponse> {
  const rows = await prisma.completion.findMany({ where: { userId: user.id, passion }, orderBy: { createdAt: 'asc' } })
  const drawings = rows.filter((row) => row.photoRef)
  const longest = rows.reduce<{ words: number; row: Completion } | null>((best, row) => {
    const words = countWords(row.text)
    return words > 0 && (!best || words > best.words) ? { words, row } : best
  }, null)
  const first = drawings[0]
  const last = drawings.length > 1 ? drawings.at(-1) : undefined
  return {
    passion,
    firstDrawing: first ? toCompletionDTO(first, photoUrl) : null,
    lastDrawing: last ? toCompletionDTO(last, photoUrl) : null,
    longestText: longest ? { words: longest.words, completion: toCompletionDTO(longest.row, photoUrl) } : null,
    titles: rows
      .filter((row) => row.exploredTitle)
      .reverse()
      .slice(0, 50)
      .map((row) => ({ title: row.exploredTitle ?? '', createdAt: row.createdAt.toISOString() })),
  }
}
