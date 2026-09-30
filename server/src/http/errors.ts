import type { ApiErrorCode } from '@pqs/shared'

/** Erreur « métier » renvoyée telle quelle au client, avec un message lisible. */
export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const badRequest = (message: string) => new ApiError(400, 'invalid_request', message)
export const notFound = (message: string) => new ApiError(404, 'not_found', message)
