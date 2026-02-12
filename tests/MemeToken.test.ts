import { describe, it, expect, beforeAll } from 'vitest'
import algosdk from 'algosdk'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * MemeToken contract integration tests.
 *
 * These tests verify that the compiled TEAL and ARC-56 artifacts
 * are generated correctly by puya-ts. For full on-chain testing,
 * deploy to localnet or testnet with a funded account.
 */

const ARTIFACTS_DIR = path.resolve(__dirname, '..', 'artifacts', 'MemeToken')

describe('MemeToken contract artifacts', () => {
  it('should have compiled TEAL approval program', () => {
    const approvalPath = path.join(ARTIFACTS_DIR, 'MemeToken.approval.teal')
    expect(fs.existsSync(approvalPath), `Missing: ${approvalPath}`).toBe(true)

    const teal = fs.readFileSync(approvalPath, 'utf-8')
    expect(teal).toContain('#pragma version')
    expect(teal.length).toBeGreaterThan(100)
  })

  it('should have compiled TEAL clear state program', () => {
    const clearPath = path.join(ARTIFACTS_DIR, 'MemeToken.clear.teal')
    expect(fs.existsSync(clearPath), `Missing: ${clearPath}`).toBe(true)

    const teal = fs.readFileSync(clearPath, 'utf-8')
    expect(teal).toContain('#pragma version')
  })

  it('should have generated ARC-56 app spec', () => {
    const arc56Path = path.join(ARTIFACTS_DIR, 'MemeToken.arc56.json')
    expect(fs.existsSync(arc56Path), `Missing: ${arc56Path}`).toBe(true)

    const spec = JSON.parse(fs.readFileSync(arc56Path, 'utf-8'))
    expect(spec.name).toBe('MemeToken')
    expect(spec.methods).toBeDefined()
    expect(Array.isArray(spec.methods)).toBe(true)
  })

  it('ARC-56 spec should declare expected ABI methods', () => {
    const arc56Path = path.join(ARTIFACTS_DIR, 'MemeToken.arc56.json')
    const spec = JSON.parse(fs.readFileSync(arc56Path, 'utf-8'))

    const methodNames = spec.methods.map((m: { name: string }) => m.name)
    expect(methodNames).toContain('bootstrap')
    expect(methodNames).toContain('transfer')
    expect(methodNames).toContain('mint')
    expect(methodNames).toContain('getBalance')
    expect(methodNames).toContain('getTotalSupply')
    expect(methodNames).toContain('getName')
    expect(methodNames).toContain('getSymbol')
    expect(methodNames).toContain('pause')
    expect(methodNames).toContain('unpause')
    expect(methodNames).toContain('isPaused')
    expect(methodNames).toContain('getAdmin')
  })

  it('ARC-56 spec should declare state schema', () => {
    const arc56Path = path.join(ARTIFACTS_DIR, 'MemeToken.arc56.json')
    const spec = JSON.parse(fs.readFileSync(arc56Path, 'utf-8'))

    expect(spec.state).toBeDefined()
  })
})

describe('MemeToken ABI encoding', () => {
  it('bootstrap method should have correct signature', () => {
    const arc56Path = path.join(ARTIFACTS_DIR, 'MemeToken.arc56.json')
    const spec = JSON.parse(fs.readFileSync(arc56Path, 'utf-8'))

    const bootstrap = spec.methods.find((m: { name: string }) => m.name === 'bootstrap')
    expect(bootstrap).toBeDefined()
    expect(bootstrap.args.length).toBe(3)
  })

  it('transfer method should accept address and uint64 args', () => {
    const arc56Path = path.join(ARTIFACTS_DIR, 'MemeToken.arc56.json')
    const spec = JSON.parse(fs.readFileSync(arc56Path, 'utf-8'))

    const transfer = spec.methods.find((m: { name: string }) => m.name === 'transfer')
    expect(transfer).toBeDefined()
    expect(transfer.args.length).toBe(2)
  })
})

describe.skipIf(!process.env.NETWORK_TESTS)('Algorand TestNet connectivity', () => {
  const algodServer = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud'
  const algodToken = process.env.ALGOD_TOKEN || ''
  const algodPort = process.env.ALGOD_PORT || '443'

  let client: algosdk.Algodv2

  beforeAll(() => {
    client = new algosdk.Algodv2(algodToken, algodServer, algodPort)
  })

  it('should connect to TestNet', async () => {
    const status = await client.status().do()
    expect(status).toBeDefined()
    expect(status['last-round']).toBeGreaterThan(0)
  })

  it('should fetch suggested transaction params', async () => {
    const params = await client.getTransactionParams().do()
    expect(params).toBeDefined()
    expect(params.genesisID).toContain('testnet')
  })
})
