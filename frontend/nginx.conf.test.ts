import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const nginxConf = readFileSync(join(process.cwd(), 'nginx.conf'), 'utf-8')

function cspDirectives(): string[] {
  const match = nginxConf.match(/Content-Security-Policy\s+"([^"]+)"/)
  if (!match) throw new Error('nginx.conf has no Content-Security-Policy header')
  return match[1].split(';').map((directive) => directive.trim())
}

describe('nginx CSP allows the frontend to reach the API', () => {
  it('declares connect-src permitting the API origin used by api/calculate.ts', () => {
    const directives = cspDirectives()
    const connectSrc = directives.find((directive) => directive.startsWith('connect-src'))
    expect(connectSrc).toBeDefined()
    expect(connectSrc).toContain('http://localhost:8090')
  })

  it('keeps default-src restricted to self', () => {
    const directives = cspDirectives()
    expect(directives).toContain("default-src 'self'")
  })
})
