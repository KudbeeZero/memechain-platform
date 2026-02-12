import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const ARTIFACTS_DIR = path.resolve(__dirname, '..', 'artifacts', 'MemeVault')

describe('MemeVault contract artifacts', () => {
  it('should have compiled TEAL approval program', () => {
    const approvalPath = path.join(ARTIFACTS_DIR, 'MemeVault.approval.teal')
    expect(fs.existsSync(approvalPath), `Missing: ${approvalPath}`).toBe(true)

    const teal = fs.readFileSync(approvalPath, 'utf-8')
    expect(teal).toContain('#pragma version')
  })

  it('should have compiled TEAL clear state program', () => {
    const clearPath = path.join(ARTIFACTS_DIR, 'MemeVault.clear.teal')
    expect(fs.existsSync(clearPath), `Missing: ${clearPath}`).toBe(true)
  })

  it('should have generated ARC-56 app spec', () => {
    const arc56Path = path.join(ARTIFACTS_DIR, 'MemeVault.arc56.json')
    expect(fs.existsSync(arc56Path), `Missing: ${arc56Path}`).toBe(true)

    const spec = JSON.parse(fs.readFileSync(arc56Path, 'utf-8'))
    expect(spec.name).toBe('MemeVault')
  })

  it('ARC-56 spec should declare vault methods', () => {
    const arc56Path = path.join(ARTIFACTS_DIR, 'MemeVault.arc56.json')
    const spec = JSON.parse(fs.readFileSync(arc56Path, 'utf-8'))

    const methodNames = spec.methods.map((m: { name: string }) => m.name)
    expect(methodNames).toContain('deposit')
    expect(methodNames).toContain('withdraw')
    expect(methodNames).toContain('adminWithdraw')
    expect(methodNames).toContain('getDeposit')
    expect(methodNames).toContain('getTotalDeposits')
    expect(methodNames).toContain('getAdmin')
  })
})
