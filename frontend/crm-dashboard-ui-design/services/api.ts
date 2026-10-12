const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'

let token: string | null = null

export function setToken(value: string | null) {
  token = value
}

export function getToken() {
  return token
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = typeof body.message === 'string' ? body.message : res.statusText
    throw new ApiError(res.status, message || 'Request failed')
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export async function listAll<T>(path: string): Promise<T[]> {
  const pageSize = 100
  const first = await api.get<Page<T>>(`${path}?page=1&pageSize=${pageSize}`)
  const items = [...first.items]
  const pages = Math.ceil(first.total / pageSize)
  for (let page = 2; page <= pages; page++) {
    const next = await api.get<Page<T>>(`${path}?page=${page}&pageSize=${pageSize}`)
    items.push(...next.items)
  }
  return items
}
