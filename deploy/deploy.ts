import algosdk from 'algosdk'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { config } from 'dotenv'

config()

// ── Configuration ────────────────────────────────────────────

const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud'
const ALGOD_PORT = process.env.ALGOD_PORT || '443'
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || ''
const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC || ''

interface DeployOptions {
  contractName: string
  /** Optional app args for the creation transaction */
  appArgs?: Uint8Array[]
}

// ── Helpers ──────────────────────────────────────────────────

function loadTeal(contractName: string, programType: 'approval' | 'clear'): string {
  const filePath = path.resolve(
    __dirname,
    '..',
    'artifacts',
    contractName,
    `${contractName}.${programType}.teal`
  )
  if (!fs.existsSync(filePath)) {
    throw new Error(`TEAL file not found: ${filePath}. Run 'npm run compile' first.`)
  }
  return fs.readFileSync(filePath, 'utf-8')
}

function loadArc56(contractName: string): Record<string, unknown> {
  const filePath = path.resolve(
    __dirname,
    '..',
    'artifacts',
    contractName,
    `${contractName}.arc56.json`
  )
  if (!fs.existsSync(filePath)) {
    throw new Error(`ARC-56 spec not found: ${filePath}. Run 'npm run compile' first.`)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

async function compileTeal(client: algosdk.Algodv2, tealSource: string): Promise<Uint8Array> {
  const result = await client.compile(tealSource).do()
  return new Uint8Array(Buffer.from(result.result, 'base64'))
}

// ── Deploy ───────────────────────────────────────────────────

async function deploy(options: DeployOptions): Promise<{
  appId: number
  appAddress: string
  txId: string
}> {
  const { contractName } = options

  if (!DEPLOYER_MNEMONIC) {
    throw new Error(
      'DEPLOYER_MNEMONIC not set. Add your 25-word Algorand mnemonic to .env'
    )
  }

  const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)
  const deployer = algosdk.mnemonicToSecretKey(DEPLOYER_MNEMONIC)

  console.log(`Deploying ${contractName}...`)
  console.log(`  Network:  ${ALGOD_SERVER}`)
  console.log(`  Deployer: ${deployer.addr}`)

  // Load and compile TEAL programs
  const approvalTeal = loadTeal(contractName, 'approval')
  const clearTeal = loadTeal(contractName, 'clear')

  const approvalProgram = await compileTeal(client, approvalTeal)
  const clearProgram = await compileTeal(client, clearTeal)

  // Load ARC-56 to determine state schema
  const arc56 = loadArc56(contractName)
  const state = arc56.state as Record<string, Record<string, Record<string, number>>> | undefined
  const schema = state?.schema

  const globalInts = schema?.global?.ints ?? 4
  const globalBytes = schema?.global?.bytes ?? 4
  const localInts = schema?.local?.ints ?? 0
  const localBytes = schema?.local?.bytes ?? 0

  // Build application create transaction
  const suggestedParams = await client.getTransactionParams().do()

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: deployer.addr,
    approvalProgram,
    clearProgram,
    numGlobalInts: globalInts,
    numGlobalByteSlices: globalBytes,
    numLocalInts: localInts,
    numLocalByteSlices: localBytes,
    suggestedParams,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    extraPages: Math.ceil((approvalProgram.length + clearProgram.length) / 2048),
  })

  // Sign and send
  const signedTxn = txn.signTxn(deployer.sk)
  const { txId } = await client.sendRawTransaction(signedTxn).do()

  console.log(`  TxID:     ${txId}`)

  // Wait for confirmation
  const result = await algosdk.waitForConfirmation(client, txId, 4)
  const appId = result['application-index'] as number
  const appAddress = algosdk.getApplicationAddress(appId)

  console.log(`  App ID:   ${appId}`)
  console.log(`  App Addr: ${appAddress}`)
  console.log(`  ✓ ${contractName} deployed successfully`)

  return { appId, appAddress, txId }
}

// ── CLI Entry Point ──────────────────────────────────────────

const contractName = process.argv[2] || 'MemeToken'
const validContracts = ['MemeToken', 'MemeVault']

if (!validContracts.includes(contractName)) {
  console.error(`Unknown contract: ${contractName}`)
  console.error(`Available: ${validContracts.join(', ')}`)
  process.exit(1)
}

deploy({ contractName })
  .then((result) => {
    console.log('\nDeployment complete:')
    console.log(JSON.stringify(result, null, 2))
  })
  .catch((err) => {
    console.error('\nDeployment failed:', err.message)
    process.exit(1)
  })
