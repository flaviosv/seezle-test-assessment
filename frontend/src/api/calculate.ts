export interface CalculateRequest {
  operation: string
}

export interface CalculateResponse {
  operation: string
  result: number
}

export class CalculateError extends Error {
  readonly statusCode: number
  readonly serverError?: string

  constructor(message: string, statusCode: number, serverError?: string) {
    super(message)
    this.name = 'CalculateError'
    this.statusCode = statusCode
    this.serverError = serverError
  }
}

const DEFAULT_BASE_URL = 'http://localhost:8090'

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL
}

export async function calculate(operation: string): Promise<CalculateResponse> {
  const body: CalculateRequest = { operation }

  let response: Response
  try {
    response = await fetch(`${getBaseUrl()}/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    throw new CalculateError(`Failed to reach the calculation service: ${message}`, 0)
  }

  if (!response.ok) {
    let serverError: string | undefined
    try {
      const errorBody = (await response.json()) as { error?: string }
      serverError = errorBody.error
    } catch {
      // Response body wasn't valid JSON — fall back to the status text below.
    }
    throw new CalculateError(serverError ?? response.statusText, response.status, serverError)
  }

  return (await response.json()) as CalculateResponse
}
