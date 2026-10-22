/**
 * Base de données en mémoire, compatible avec la partie de l'API Prisma
 * qu'utilisent les services du serveur (server/src/services). La version
 * hors ligne exécute ainsi exactement les mêmes règles que le serveur :
 * minutons, déblocages, galerie, boutique, projets…
 *
 * Les tables sont sauvegardées sur le téléphone (voir storage.ts).
 */

type Row = Record<string, unknown>
type Where = Record<string, unknown>

interface Relation {
  model: string
  /** Champ de cette ligne… */
  local: string
  /** …égal à ce champ des lignes liées. */
  foreign: string
  many: boolean
}

interface Model {
  defaults: () => Row
  /** Contraintes d'unicité (en plus de l'identifiant). */
  unique: string[][]
  /** Clés composées acceptées dans `where` (ex. userId_itemId). */
  compound: Record<string, string[]>
  relations: Record<string, Relation>
  updatedAt: boolean
  /** Identifiant généré automatiquement (cuid) si absent. */
  autoId: boolean
}

const many = (model: string, foreign: string): Relation => ({ model, local: 'id', foreign, many: true })
const one = (model: string, local: string, foreign = 'id'): Relation => ({ model, local, foreign, many: false })

const MODELS: Record<string, Model> = {
  user: {
    defaults: () => ({
      firstName: '', username: null, languageCode: null, passions: '[]', theme: 'pop', timezone: 'Europe/Paris', canMessage: false,
      remindersEnabled: true, tutorialCompleted: false, completedGuides: '[]', scrollMoment: null, reminderTime: null, skills: '{}',
      reminderCount: 0, unansweredReminders: 0, lastReminderDate: null, lastSeenAt: new Date(), createdAt: new Date(),
      atelierAppearance: '{}', shopBonus: 0, shopTestCreditClaimed: false, coinsSpent: 0, shopEquipment: '{}',
    }),
    unique: [], compound: {}, updatedAt: true, autoId: false,
    relations: {
      purchases: many('shopPurchase', 'userId'), proposals: many('proposal', 'userId'), completions: many('completion', 'userId'),
      feedbacks: many('feedback', 'userId'), events: many('appEvent', 'userId'), projects: many('project', 'userId'), learningEntries: many('learningEntry', 'userId'),
    },
  },
  proposal: {
    defaults: () => ({ external: false, mood: null, extra: null, status: 'open', createdAt: new Date(), timerTracked: false, activeSeconds: 0, activeSince: null }),
    unique: [], compound: {}, updatedAt: false, autoId: true,
    relations: { user: one('user', 'userId'), completion: { model: 'completion', local: 'id', foreign: 'proposalId', many: false } },
  },
  completion: {
    defaults: () => ({ mood: null, extra: null, text: null, workshopData: null, exploredTitle: null, photoRef: null, photoPending: false, rating: null, projectId: null, createdAt: new Date() }),
    unique: [['proposalId']], compound: {}, updatedAt: false, autoId: true,
    relations: { user: one('user', 'userId'), proposal: one('proposal', 'proposalId'), project: one('project', 'projectId') },
  },
  project: {
    defaults: () => ({ goal: null, finishedAt: null, createdAt: new Date() }),
    unique: [], compound: {}, updatedAt: false, autoId: true,
    relations: { user: one('user', 'userId'), completions: many('completion', 'projectId') },
  },
  feedback: {
    defaults: () => ({ source: 'app', context: null, createdAt: new Date() }),
    unique: [], compound: {}, updatedAt: false, autoId: true,
    relations: { user: one('user', 'userId') },
  },
  appEvent: {
    defaults: () => ({ data: null, createdAt: new Date() }),
    unique: [], compound: {}, updatedAt: false, autoId: true,
    relations: { user: one('user', 'userId') },
  },
  setting: { defaults: () => ({}), unique: [], compound: {}, updatedAt: true, autoId: false, relations: {} },
  shopPurchase: {
    defaults: () => ({ createdAt: new Date() }),
    unique: [['userId', 'itemId']], compound: { userId_itemId: ['userId', 'itemId'] }, updatedAt: false, autoId: true,
    relations: { user: one('user', 'userId') },
  },
  learningEntry: {
    defaults: () => ({ completed: false, mastered: false, review: false, createdAt: new Date() }),
    unique: [], compound: {}, updatedAt: true, autoId: false,
    relations: { user: one('user', 'userId') },
  },
}

/** Clé primaire de chaque table. */
const ID: Record<string, string> = { setting: 'key' }
const idOf = (model: string) => ID[model] ?? 'id'

export type Tables = Record<string, Row[]>

export class PrismaError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

/* ------------------------------------------------------------ comparaisons */

function same(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (typeof a === 'bigint' || typeof b === 'bigint') {
    try { return a !== null && b !== null && a !== undefined && b !== undefined && BigInt(a as never) === BigInt(b as never) } catch { return false }
  }
  return a === b
}

function order(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (typeof a === 'bigint' || typeof b === 'bigint') {
    const x = BigInt(a as never), y = BigInt(b as never)
    return x === y ? 0 : x < y ? -1 : 1
  }
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  return String(a) < String(b) ? -1 : 1
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !(value instanceof Date) && !Array.isArray(value)

const OPERATORS = new Set(['equals', 'not', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte', 'contains', 'startsWith', 'endsWith'])

function matchField(value: unknown, condition: unknown): boolean {
  if (!isPlainObject(condition) || !Object.keys(condition).every((key) => OPERATORS.has(key))) return same(value, condition)
  for (const [op, arg] of Object.entries(condition)) {
    switch (op) {
      case 'equals': if (!same(value, arg)) return false; break
      case 'not': if (isPlainObject(arg) ? matchField(value, arg) : same(value, arg)) return false; break
      case 'in': if (!(arg as unknown[]).some((item) => same(value, item))) return false; break
      case 'notIn': if ((arg as unknown[]).some((item) => same(value, item))) return false; break
      case 'lt': if (value === null || value === undefined || order(value, arg) >= 0) return false; break
      case 'lte': if (value === null || value === undefined || order(value, arg) > 0) return false; break
      case 'gt': if (value === null || value === undefined || order(value, arg) <= 0) return false; break
      case 'gte': if (value === null || value === undefined || order(value, arg) < 0) return false; break
      case 'contains': if (typeof value !== 'string' || !value.includes(String(arg))) return false; break
      case 'startsWith': if (typeof value !== 'string' || !value.startsWith(String(arg))) return false; break
      case 'endsWith': if (typeof value !== 'string' || !value.endsWith(String(arg))) return false; break
    }
  }
  return true
}

/* ------------------------------------------------------------- le client */

export class MemoryPrisma {
  tables: Tables
  /** Vrai dès qu'une écriture a eu lieu depuis la dernière sauvegarde. */
  dirty = false
  private counter = 0

  constructor(tables: Tables = {}) {
    this.tables = {}
    for (const name of Object.keys(MODELS)) this.tables[name] = tables[name] ?? []
    for (const name of Object.keys(MODELS)) (this as unknown as Record<string, unknown>)[name] = this.delegate(name)
  }

  async $transaction<T>(input: ((tx: this) => Promise<T>) | Promise<unknown>[]): Promise<T | unknown[]> {
    if (typeof input === 'function') {
      // Tout est synchrone en mémoire : en cas d'erreur, on revient à l'état d'avant.
      const snapshot = structuredClone(this.tables)
      try {
        return await input(this)
      } catch (error) {
        this.tables = snapshot
        throw error
      }
    }
    return Promise.all(input)
  }

  private cuid(): string {
    this.counter = (this.counter + 1) % 1_679_616
    return `c${Date.now().toString(36)}${this.counter.toString(36).padStart(4, '0')}${Math.random().toString(36).slice(2, 10)}`
  }

  /* ----------------------------------------------------------- lecture */

  private matches(model: string, row: Row, where: Where | undefined): boolean {
    if (!where) return true
    const def = MODELS[model]!
    for (const [key, condition] of Object.entries(where)) {
      if (condition === undefined) continue
      if (key === 'AND') {
        const list = Array.isArray(condition) ? condition : [condition]
        if (!list.every((item) => this.matches(model, row, item as Where))) return false
      } else if (key === 'OR') {
        if (!(condition as Where[]).some((item) => this.matches(model, row, item))) return false
      } else if (key === 'NOT') {
        const list = Array.isArray(condition) ? condition : [condition]
        if (list.some((item) => this.matches(model, row, item as Where))) return false
      } else if (def.compound[key]) {
        for (const field of def.compound[key]!) if (!same(row[field], (condition as Row)[field])) return false
      } else if (def.relations[key]) {
        const relation = def.relations[key]!
        const related = this.related(relation, row)
        if (relation.many) {
          const spec = condition as { some?: Where; every?: Where; none?: Where }
          const list = related as Row[]
          if (spec.some && !list.some((item) => this.matches(relation.model, item, spec.some))) return false
          if (spec.every && !list.every((item) => this.matches(relation.model, item, spec.every))) return false
          if (spec.none && list.some((item) => this.matches(relation.model, item, spec.none))) return false
        } else if (!related || !this.matches(relation.model, related as Row, condition as Where)) return false
      } else if (!matchField(row[key], condition)) return false
    }
    return true
  }

  private related(relation: Relation, row: Row): Row[] | Row | null {
    const value = row[relation.local]
    const rows = this.tables[relation.model]!
    if (relation.many) return rows.filter((item) => value !== null && value !== undefined && same(item[relation.foreign], value))
    if (value === null || value === undefined) return null
    return rows.find((item) => same(item[relation.foreign], value)) ?? null
  }

  private sort(rows: Row[], orderBy: unknown): Row[] {
    if (!orderBy) return rows
    const list = (Array.isArray(orderBy) ? orderBy : [orderBy]) as Record<string, 'asc' | 'desc'>[]
    return [...rows].sort((a, b) => {
      for (const spec of list) {
        for (const [field, direction] of Object.entries(spec)) {
          const result = order(a[field], b[field])
          if (result !== 0) return direction === 'desc' ? -result : result
        }
      }
      return 0
    })
  }

  private shape(model: string, row: Row, args: { select?: Row; include?: Row } = {}): Row {
    const def = MODELS[model]!
    const out: Row = {}
    if (args.select) {
      for (const [key, spec] of Object.entries(args.select)) {
        if (!spec) continue
        if (def.relations[key]) out[key] = this.nested(model, key, row, spec)
        else if (key === '_count') out[key] = this.countRelations(model, row, spec)
        else out[key] = structuredClone(row[key])
      }
      return out
    }
    for (const [key, value] of Object.entries(row)) out[key] = structuredClone(value)
    if (args.include) {
      for (const [key, spec] of Object.entries(args.include)) {
        if (!spec) continue
        if (key === '_count') out[key] = this.countRelations(model, row, spec)
        else out[key] = this.nested(model, key, row, spec)
      }
    }
    return out
  }

  private countRelations(model: string, row: Row, spec: unknown): Row {
    const select = isPlainObject(spec) && isPlainObject(spec.select) ? spec.select : {}
    const out: Row = {}
    for (const key of Object.keys(select)) out[key] = (this.related(MODELS[model]!.relations[key]!, row) as Row[]).length
    return out
  }

  private nested(model: string, key: string, row: Row, spec: unknown): unknown {
    const relation = MODELS[model]!.relations[key]!
    const args = (isPlainObject(spec) ? spec : {}) as { select?: Row; include?: Row; where?: Where; orderBy?: unknown; take?: number; skip?: number }
    const related = this.related(relation, row)
    if (!relation.many) return related ? this.shape(relation.model, related as Row, args) : null
    let rows = (related as Row[]).filter((item) => this.matches(relation.model, item, args.where))
    rows = this.sort(rows, args.orderBy)
    if (args.skip) rows = rows.slice(args.skip)
    if (args.take !== undefined) rows = args.take >= 0 ? rows.slice(0, args.take) : rows.slice(args.take)
    return rows.map((item) => this.shape(relation.model, item, args))
  }

  private select(model: string, args: { where?: Where; orderBy?: unknown; take?: number; skip?: number; cursor?: Where } = {}): Row[] {
    let rows = this.tables[model]!.filter((row) => this.matches(model, row, args.where))
    rows = this.sort(rows, args.orderBy)
    if (args.cursor) {
      const index = rows.findIndex((row) => this.matches(model, row, args.cursor))
      rows = index < 0 ? [] : rows.slice(index)
    }
    if (args.skip) rows = rows.slice(args.skip)
    if (args.take !== undefined) rows = args.take >= 0 ? rows.slice(0, args.take) : rows.slice(args.take)
    return rows
  }

  /* ---------------------------------------------------------- écriture */

  private applyData(model: string, row: Row, data: Row): void {
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || MODELS[model]!.relations[key]) continue
      if (isPlainObject(value) && ('increment' in value || 'decrement' in value || 'multiply' in value || 'set' in value)) {
        const current = (row[key] as number) ?? 0
        if ('set' in value) row[key] = value.set
        if ('increment' in value) row[key] = current + (value.increment as number)
        if ('decrement' in value) row[key] = current - (value.decrement as number)
        if ('multiply' in value) row[key] = current * (value.multiply as number)
      } else row[key] = value instanceof Date ? new Date(value) : value
    }
    if (MODELS[model]!.updatedAt) row.updatedAt = new Date()
  }

  private checkUnique(model: string, row: Row, except?: Row): void {
    const def = MODELS[model]!
    const id = idOf(model)
    for (const other of this.tables[model]!) {
      if (other === except) continue
      if (same(other[id], row[id])) throw new PrismaError('P2002', `Unique constraint failed on ${model}.${id}`)
      for (const fields of def.unique) {
        if (fields.every((field) => row[field] !== null && row[field] !== undefined && same(other[field], row[field]))) {
          throw new PrismaError('P2002', `Unique constraint failed on ${model}.${fields.join(',')}`)
        }
      }
    }
  }

  private create(model: string, data: Row): Row {
    const def = MODELS[model]!
    const row: Row = def.defaults()
    if (def.autoId) row[idOf(model)] = this.cuid()
    this.applyData(model, row, data)
    if (def.updatedAt && !row.updatedAt) row.updatedAt = new Date()
    this.checkUnique(model, row)
    this.tables[model]!.push(row)
    this.dirty = true
    return row
  }

  private update(model: string, row: Row, data: Row): Row {
    const next = { ...row }
    this.applyData(model, next, data)
    this.checkUnique(model, next, row)
    Object.assign(row, next)
    this.dirty = true
    return row
  }

  private remove(model: string, rows: Row[]): void {
    if (!rows.length) return
    this.dirty = true
    this.tables[model] = this.tables[model]!.filter((row) => !rows.includes(row))
    const id = idOf(model)
    // Relations : cascade (propositions, créations…) ou SetNull (projet d'une création).
    for (const [child, def] of Object.entries(MODELS)) {
      for (const relation of Object.values(def.relations)) {
        if (relation.many || relation.model !== model || relation.foreign !== id) continue
        const orphans = this.tables[child]!.filter((item) => rows.some((row) => same(item[relation.local], row[id])))
        if (child === 'completion' && relation.local === 'projectId') {
          for (const item of orphans) item.projectId = null
        } else this.remove(child, orphans)
      }
    }
  }

  private unique(model: string, where: Where): Row | undefined {
    return this.tables[model]!.find((row) => this.matches(model, row, where))
  }

  private notFound(model: string): PrismaError {
    return new PrismaError('P2025', `No ${model} found`)
  }

  private delegate(model: string) {
    const self = this
    return {
      async findUnique(args: { where: Where; select?: Row; include?: Row }) {
        const row = self.unique(model, args.where)
        return row ? self.shape(model, row, args) : null
      },
      async findUniqueOrThrow(args: { where: Where; select?: Row; include?: Row }) {
        const row = self.unique(model, args.where)
        if (!row) throw self.notFound(model)
        return self.shape(model, row, args)
      },
      async findFirst(args: { where?: Where; orderBy?: unknown; select?: Row; include?: Row; skip?: number } = {}) {
        const row = self.select(model, { ...args, take: 1 })[0]
        return row ? self.shape(model, row, args) : null
      },
      async findFirstOrThrow(args: { where?: Where; orderBy?: unknown; select?: Row; include?: Row } = {}) {
        const row = self.select(model, { ...args, take: 1 })[0]
        if (!row) throw self.notFound(model)
        return self.shape(model, row, args)
      },
      async findMany(args: { where?: Where; orderBy?: unknown; take?: number; skip?: number; cursor?: Where; select?: Row; include?: Row } = {}) {
        return self.select(model, args).map((row) => self.shape(model, row, args))
      },
      async create(args: { data: Row; select?: Row; include?: Row }) {
        return self.shape(model, self.create(model, args.data), args)
      },
      async createMany(args: { data: Row[] }) {
        for (const data of args.data) self.create(model, data)
        return { count: args.data.length }
      },
      async update(args: { where: Where; data: Row; select?: Row; include?: Row }) {
        const row = self.unique(model, args.where)
        if (!row) throw self.notFound(model)
        return self.shape(model, self.update(model, row, args.data), args)
      },
      async updateMany(args: { where?: Where; data: Row }) {
        const rows = self.select(model, { where: args.where })
        for (const row of rows) self.update(model, row, args.data)
        return { count: rows.length }
      },
      async upsert(args: { where: Where; create: Row; update: Row; select?: Row; include?: Row }) {
        const row = self.unique(model, args.where)
        return self.shape(model, row ? self.update(model, row, args.update) : self.create(model, args.create), args)
      },
      async delete(args: { where: Where; select?: Row; include?: Row }) {
        const row = self.unique(model, args.where)
        if (!row) throw self.notFound(model)
        const shaped = self.shape(model, row, args)
        self.remove(model, [row])
        return shaped
      },
      async deleteMany(args: { where?: Where } = {}) {
        const rows = self.select(model, { where: args.where })
        self.remove(model, rows)
        return { count: rows.length }
      },
      async count(args: { where?: Where } = {}) {
        return self.select(model, { where: args.where }).length
      },
      async aggregate(args: { where?: Where; _sum?: Row; _count?: unknown; _avg?: Row; _max?: Row; _min?: Row }) {
        const rows = self.select(model, { where: args.where })
        const out: Row = {}
        const numbers = (field: string) => rows.map((row) => row[field]).filter((value): value is number => typeof value === 'number')
        if (args._sum) out._sum = Object.fromEntries(Object.keys(args._sum).map((field) => { const list = numbers(field); return [field, list.length ? list.reduce((a, b) => a + b, 0) : null] }))
        if (args._avg) out._avg = Object.fromEntries(Object.keys(args._avg).map((field) => { const list = numbers(field); return [field, list.length ? list.reduce((a, b) => a + b, 0) / list.length : null] }))
        if (args._max) out._max = Object.fromEntries(Object.keys(args._max).map((field) => [field, rows.reduce<unknown>((best, row) => (best === null || order(row[field], best) > 0 ? row[field] : best), null)]))
        if (args._min) out._min = Object.fromEntries(Object.keys(args._min).map((field) => [field, rows.reduce<unknown>((best, row) => (best === null || order(row[field], best) < 0 ? row[field] : best), null)]))
        if (args._count) out._count = args._count === true ? rows.length : Object.fromEntries(Object.keys(args._count as Row).map((field) => [field, rows.filter((row) => row[field] !== null && row[field] !== undefined).length]))
        return out
      },
      async groupBy(args: { by: string[]; where?: Where; _count?: unknown; _sum?: Row }) {
        const groups = new Map<string, Row[]>()
        for (const row of self.select(model, { where: args.where })) {
          const key = JSON.stringify(args.by.map((field) => String(row[field])))
          groups.set(key, [...(groups.get(key) ?? []), row])
        }
        return [...groups.values()].map((rows) => {
          const out: Row = Object.fromEntries(args.by.map((field) => [field, rows[0]![field]]))
          if (args._count) out._count = args._count === true ? rows.length : Object.fromEntries(Object.keys(args._count as Row).map((field) => [field, rows.filter((row) => row[field] !== null).length]))
          if (args._sum) out._sum = Object.fromEntries(Object.keys(args._sum).map((field) => [field, rows.reduce((sum, row) => sum + ((row[field] as number) ?? 0), 0)]))
          return out
        })
      },
    }
  }
}
