import algosdk from 'algosdk'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { config } from 'dotenv'

config()

/**
 * Troubleshooting script — diagnoses common issues with
 * the Algorand development environment and contract artifacts.
 */

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

const results: CheckResult[] = []

function check(name: string, status: CheckResult['status'], message: string) {
  results[results.length] = { name, status, message }
}

async function run() {
  console.log('MemeChain Platform — Diagnostic Report\n')

  // 1. Check environment
  const algodServer = process.env.ALGOD_SERVER
  if (algodServer) {
    check('ALGOD_SERVER', 'pass', algodServer)
  } else {
    check('ALGOD_SERVER', 'fail', 'Not set in .env — copy .env.template to .env')
  }

  const mnemonic = process.env.DEPLOYER_MNEMONIC
  if (mnemonic && mnemonic.split(' ').length === 25) {
    check('DEPLOYER_MNEMONIC', 'pass', 'Set (25 words)')
  } else if (mnemonic) {
    check('DEPLOYER_MNEMONIC', 'warn', `Has ${mnemonic.split(' ').length} words (expected 25)`)
  } else {
    check('DEPLOYER_MNEMONIC', 'warn', 'Not set — deployment will fail')
  }

  // 2. Check artifacts
  const artifactsDir = path.resolve(__dirname, '..', 'artifacts')
  for (const contractName of ['MemeToken', 'MemeVault']) {
    const contractDir = path.join(artifactsDir, contractName)
    const approvalPath = path.join(contractDir, `${contractName}.approval.teal`)
    const clearPath = path.join(contractDir, `${contractName}.clear.teal`)
    const arc56Path = path.join(contractDir, `${contractName}.arc56.json`)

    if (fs.existsSync(approvalPath)) {
      check(`${contractName} approval.teal`, 'pass', 'Found')
    } else {
      check(`${contractName} approval.teal`, 'fail', `Missing — run 'npm run compile'`)
    }

    if (fs.existsSync(clearPath)) {
      check(`${contractName} clear.teal`, 'pass', 'Found')
    } else {
      check(`${contractName} clear.teal`, 'fail', `Missing — run 'npm run compile'`)
    }

    if (fs.existsSync(arc56Path)) {
      const spec = JSON.parse(fs.readFileSync(arc56Path, 'utf-8'))
      const methodCount = spec.methods?.length ?? 0
      check(`${contractName} ARC-56`, 'pass', `Found (${methodCount} methods)`)
    } else {
      check(`${contractName} ARC-56`, 'fail', `Missing — run 'npm run compile'`)
    }
  }

  // 3. Check TestNet connectivity
  try {
    const server = algodServer || 'https://testnet-api.algonode.cloud'
    const token = process.env.ALGOD_TOKEN || ''
    const port = process.env.ALGOD_PORT || '443'
    const client = new algosdk.Algodv2(token, server, port)
    const status = await client.status().do()
    check('TestNet connection', 'pass', `Round ${status['last-round']}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    check('TestNet connection', 'fail', message)
  }

  // 4. Check deployer balance
  if (mnemonic && mnemonic.split(' ').length === 25) {
    try {
      const server = algodServer || 'https://testnet-api.algonode.cloud'
      const client = new algosdk.Algodv2(
        process.env.ALGOD_TOKEN || '',
        server,
        process.env.ALGOD_PORT || '443'
      )
      const deployer = algosdk.mnemonicToSecretKey(mnemonic)
      const info = await client.accountInformation(deployer.addr).do()
      const balance = (info.amount as number) / 1_000_000
      if (balance >= 1) {
        check('Deployer balance', 'pass', `${balance.toFixed(6)} ALGO`)
      } else if (balance > 0) {
        check('Deployer balance', 'warn', `${balance.toFixed(6)} ALGO — may be insufficient`)
      } else {
        check('Deployer balance', 'fail', '0 ALGO — fund via TestNet dispenser')
      }
    } catch {
      check('Deployer balance', 'warn', 'Could not check — account may not exist on TestNet')
    }
  }

  // Print results
  console.log('─'.repeat(60))
  for (const r of results) {
    const icon = r.status === 'pass' ? '[OK]' : r.status === 'warn' ? '[!!]' : '[XX]'
    console.log(`  ${icon} ${r.name}: ${r.message}`)
  }
  console.log('─'.repeat(60))

  const failures = results.filter((r) => r.status === 'fail')
  if (failures.length > 0) {
    console.log(`\n${failures.length} issue(s) found. Fix the [XX] items above.`)
  } else {
    console.log('\nAll checks passed.')
  }
}

run().catch(console.error)
