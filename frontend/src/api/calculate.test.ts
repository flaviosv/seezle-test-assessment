import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculate, CalculateError } from './calculate'

function mockFetchResponse(init: {
  ok: boolean
  status?: number
  statusText?: string
  json?: () => Promise<unknown>
}) {
  return {
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 400),
    statusText: init.statusText ?? '',
    json: init.json ?? (() => Promise.resolve({})),
  } as Response
}

describe('api/calculate', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves with the parsed response on 200 success (FE-08)', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({ ok: true, status: 200, json: () => Promise.resolve({ operation: '2+2', result: 4 }) }),
    )
    const response = await calculate('2+2')
    expect(response).toEqual({ operation: '2+2', result: 4 })
  })

  it('rejects with a CalculateError carrying the server error message on 400 (FE-09)', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'operations: division by zero' }),
      }),
    )
    await expect(calculate('1/0')).rejects.toMatchObject({
      message: 'operations: division by zero',
      statusCode: 400,
      serverError: 'operations: division by zero',
    })
  })

  it('rejects with a CalculateError on a 500 server error', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({ ok: false, status: 500, json: () => Promise.resolve({ error: 'internal error' }) }),
    )
    await expect(calculate('2+2')).rejects.toMatchObject({
      message: 'internal error',
      statusCode: 500,
    })
  })

  it('rejects with a CalculateError instance', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({ ok: false, status: 400, json: () => Promise.resolve({ error: 'bad' }) }),
    )
    await expect(calculate('bad')).rejects.toBeInstanceOf(CalculateError)
  })

  it('re-throws a network failure (fetch rejecting) as a descriptive CalculateError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(calculate('2+2')).rejects.toMatchObject({
      statusCode: 0,
    })
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(calculate('2+2')).rejects.toThrow(/Failed to fetch/)
  })

  it('falls back to the response statusText when the error body is not valid JSON', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: () => Promise.reject(new Error('invalid json')),
      }),
    )
    await expect(calculate('2+2')).rejects.toMatchObject({
      message: 'Bad Gateway',
      statusCode: 502,
      serverError: undefined,
    })
  })

  it('resolves whatever a malformed-but-parseable 2xx body contains without throwing', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({ ok: true, status: 200, json: () => Promise.resolve({ unexpected: true }) }),
    )
    await expect(calculate('2+2')).resolves.toEqual({ unexpected: true })
  })

  it('sends the request to <base URL>/v1/calculate', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({ ok: true, json: () => Promise.resolve({ operation: '2+2', result: 4 }) }),
    )
    await calculate('2+2')
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8090/v1/calculate', expect.any(Object))
  })

  it('sends a POST request', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({ ok: true, json: () => Promise.resolve({ operation: '2+2', result: 4 }) }),
    )
    await calculate('2+2')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
  })

  it('sends the operation string as the JSON request body', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({ ok: true, json: () => Promise.resolve({ operation: '5+3', result: 8 }) }),
    )
    await calculate('5+3')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBe(JSON.stringify({ operation: '5+3' }))
  })

  it('sends a Content-Type: application/json header', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({ ok: true, json: () => Promise.resolve({ operation: '2+2', result: 4 }) }),
    )
    await calculate('2+2')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
  })
})
