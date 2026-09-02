// SPEC_DEVIATION: thin compile-time stub only — useCalculator() (T13) needs a
// typed calculate() to call, but the real typed fetch client is T14's own
// task/commit per tasks.md. Replaced with the real implementation in T14.
export interface CalculateResponse {
  operation: string
  result: number
}

export async function calculate(_operation: string): Promise<CalculateResponse> {
  throw new Error('not implemented')
}
