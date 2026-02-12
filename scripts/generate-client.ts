import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Generates a typed TypeScript client from ARC-56 app spec JSON.
 *
 * Usage: npx tsx scripts/generate-client.ts [ContractName]
 */

const contractName = process.argv[2] || 'MemeToken'
const artifactsDir = path.resolve(__dirname, '..', 'artifacts', contractName)
const arc56Path = path.join(artifactsDir, `${contractName}.arc56.json`)

if (!fs.existsSync(arc56Path)) {
  console.error(`ARC-56 spec not found: ${arc56Path}`)
  console.error(`Run 'npm run compile' first.`)
  process.exit(1)
}

const spec = JSON.parse(fs.readFileSync(arc56Path, 'utf-8'))
const methods: Array<{
  name: string
  args: Array<{ name: string; type: string }>
  returns: { type: string }
  readonly?: boolean
  desc?: string
}> = spec.methods || []

// Map ARC-4 ABI types to TypeScript types
function abiTypeToTs(abiType: string): string {
  if (abiType === 'void') return 'void'
  if (abiType === 'bool') return 'boolean'
  if (abiType === 'string') return 'string'
  if (abiType === 'address') return 'string'
  if (abiType.startsWith('uint') || abiType.startsWith('ufixed')) return 'bigint'
  if (abiType === 'byte[]' || abiType === 'byte') return 'Uint8Array'
  if (abiType === 'pay') return 'algosdk.Transaction'
  if (abiType.endsWith('[]')) return `${abiTypeToTs(abiType.slice(0, -2))}[]`
  return 'unknown'
}

let output = `// Auto-generated typed client for ${contractName}
// Generated from ARC-56 app spec: ${contractName}.arc56.json
// Do not edit manually — re-run 'npm run generate-client' to regenerate.

import algosdk from 'algosdk'

export interface ${contractName}AppCallArgs {
  method: string
  methodArgs: unknown[]
}

`

// Generate method interfaces
for (const method of methods) {
  const argsType = method.args
    .map((a) => `  ${a.name}: ${abiTypeToTs(a.type)}`)
    .join('\n')

  output += `export interface ${contractName}_${method.name}_Args {\n${argsType}\n}\n\n`
}

// Generate method list
output += `export const ${contractName}Methods = [\n`
for (const method of methods) {
  const argTypes = method.args.map((a) => a.type).join(',')
  output += `  '${method.name}(${argTypes})${method.returns.type}',\n`
}
output += `] as const\n\n`

// Generate ABI contract reference
output += `export const ${contractName}ABI = ${JSON.stringify(
  { name: spec.name, methods: spec.methods },
  null,
  2
)}\n`

const outputPath = path.join(artifactsDir, `${contractName}Client.ts`)
fs.writeFileSync(outputPath, output)
console.log(`Generated: ${outputPath}`)
