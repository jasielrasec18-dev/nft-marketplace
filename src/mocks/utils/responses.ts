import { HttpResponse } from 'msw'
import { z } from 'zod'
import type { ApiErrorBody } from '@/contracts/common'

export class MockError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: ApiErrorBody['fieldErrors']
  constructor(status: number, code: string, message: string, fieldErrors?: ApiErrorBody['fieldErrors']) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.name = 'MockError'
  }
}
export function fail(status: number, code: string, message: string): never {
  throw new MockError(status, code, message)
}
export function errorResponse(error: unknown): Response {
  if (error instanceof MockError) {
    return HttpResponse.json({ code: error.code, message: error.message, ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}) } satisfies ApiErrorBody, { status: error.status })
  }
  if (error instanceof z.ZodError) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of error.issues) {
      const field = issue.path.join('.') || '_form'
      fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message]
    }
    return HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Revise os campos informados.', fieldErrors } satisfies ApiErrorBody, { status: 422 })
  }
  return HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'Falha interna no backend simulado.' } satisfies ApiErrorBody, { status: 500 })
}
export async function readBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown
  try { body = await request.json() } catch { return fail(400, 'INVALID_JSON', 'Envie um corpo JSON válido.') }
  return schema.parse(body)
}
const resolvedCookies = new WeakMap<Request, Record<string, string>>()
export function bindRequestCookies(request: Request, cookies: Record<string, string>) {
  resolvedCookies.set(request, cookies)
}
export function cookie(request: Request, name: string): string | undefined {
  return resolvedCookies.get(request)?.[name]
}
export function sessionCookie(token: string): string {
  return `jungle_session=${token}; Path=/; SameSite=Lax; Max-Age=${token ? 3600 : 0}`
}
