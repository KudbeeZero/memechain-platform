import { useState, useRef, useEffect } from ‘react’;

const LESSONS = {
setup: {
title: “Setup & Basics”,
icon: “⚡”,
lessons: [
{
id: “intro”,
title: “Algosdk Introduction”,
description: “The official JavaScript/TypeScript SDK for Algorand.”,
concepts: [
“algosdk is the official SDK for JS/TS Algorand development”,
“Works in Node.js, browsers, and React Native”,
“Full TypeScript support with type definitions”
],
example: `import algosdk from ‘algosdk’;

// Initialize Algod client
const algodClient = new algosdk.Algodv2(
‘’,  // Empty token for public endpoints
‘https://testnet-api.algonode.cloud’,
443
);

// Check connection
const status = await algodClient.status().do();
console.log(‘Network status:’, status);

// Get transaction params
const params = await algodClient.getTransactionParams().do();`, challenge: { prompt: "Create an Algodv2 client for mainnet at 'https://mainnet-api.algonode.cloud'", solution: "new algosdk.Algodv2('', 'https://mainnet-api.algonode.cloud', 443)", hint: "Use algosdk.Algodv2 with empty token for public endpoints" } }, { id: "accounts", title: "Account Management", description: "Creating and managing Algorand accounts.", concepts: [ "Accounts are Ed25519 key pairs", "Address derived from public key", "25-word mnemonic for backup" ], example: `import algosdk from ‘algosdk’;

// Generate new account
const account = algosdk.generateAccount();
console.log(‘Address:’, account.addr);

// Convert to mnemonic
const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

// Recover from mnemonic
const recovered = algosdk.mnemonicToSecretKey(mnemonic);

// Get account info
const info = await algodClient.accountInformation(account.addr).do();
console.log(‘Balance:’, info.amount / 1e6, ‘ALGO’);`, challenge: { prompt: "Generate account and get mnemonic", solution: "algosdk.secretKeyToMnemonic(algosdk.generateAccount().sk)", hint: "Generate account, then convert sk to mnemonic" } } ] }, arc3: { title: "ARC-3 NFTs", icon: "🎨", lessons: [ { id: "arc3-intro", title: "ARC-3 Overview", description: "The standard for NFT metadata on Algorand.", concepts: [ "ARC-3 defines NFT metadata JSON structure", "Metadata stored off-chain (IPFS, HTTP)", "ASA URL points to metadata JSON", "URL ends with #arc3 to indicate compliance" ], example: `// ARC-3 Metadata JSON Structure
interface ARC3Metadata {
name: string;                    // Required: Asset name
decimals?: number;               // Optional: Usually 0 for NFTs
description?: string;            // Optional: Description
image: string;                   // Required: URL to image
image_integrity?: string;        // Optional: SHA-256 hash
image_mimetype?: string;         // Optional: MIME type
background_color?: string;       // Optional: Hex color
external_url?: string;           // Optional: External link
external_url_integrity?: string;
animation_url?: string;          // Optional: Video/audio
animation_url_integrity?: string;
animation_url_mimetype?: string;
properties?: {                   // Optional: Traits
[key: string]: any;
};
}

// Example metadata
const metadata: ARC3Metadata = {
name: “Cool NFT #1”,
description: “A very cool NFT”,
image: “ipfs://QmX…/image.png”,
image_mimetype: “image/png”,
properties: {
background: “blue”,
rarity: “legendary”,
power: 100
}
};`, challenge: { prompt: "What suffix indicates ARC-3 compliance in the ASA URL?", solution: "#arc3", hint: "It's a hash fragment at the end of the URL" } }, { id: "arc3-create", title: "Creating ARC-3 NFTs", description: "Minting NFTs with proper ARC-3 metadata.", concepts: [ "Upload metadata JSON to IPFS first", "ASA URL = metadata URL + #arc3", "total=1, decimals=0 for NFTs", "Can include integrity hash for verification" ], example: `import algosdk from ‘algosdk’;
import { create } from ‘ipfs-http-client’;

const ipfs = create({ url: ‘https://ipfs.infura.io:5001’ });

interface ARC3Config {
name: string;
unitName: string;
description: string;
image: File | Buffer;
properties?: Record<string, any>;
}

async function createARC3NFT(
creator: algosdk.Account,
config: ARC3Config
): Promise<{ assetId: number; metadataUrl: string }> {

// 1. Upload image to IPFS
const imageResult = await ipfs.add(config.image);
const imageUrl = `ipfs://${imageResult.cid}`;

// 2. Create metadata JSON
const metadata = {
name: config.name,
description: config.description,
image: imageUrl,
image_mimetype: “image/png”,
properties: config.properties || {}
};

// 3. Upload metadata to IPFS
const metadataResult = await ipfs.add(JSON.stringify(metadata));
const metadataUrl = `ipfs://${metadataResult.cid}#arc3`;

// 4. Create ASA with metadata URL
const params = await algodClient.getTransactionParams().do();

const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
from: creator.addr,
total: 1,
decimals: 0,
defaultFrozen: false,
assetName: config.name,
unitName: config.unitName,
assetURL: metadataUrl,
manager: creator.addr,
suggestedParams: params,
});

const signedTxn = txn.signTxn(creator.sk);
const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
const result = await algosdk.waitForConfirmation(algodClient, txId, 4);

return {
assetId: result[‘asset-index’],
metadataUrl
};
}`, challenge: { prompt: "What should total and decimals be for an NFT?", solution: "total: 1, decimals: 0", hint: "NFTs are unique (1) and indivisible (0)" } }, { id: "arc3-read", title: "Reading ARC-3 Metadata", description: "Fetching and parsing NFT metadata.", concepts: [ "Get ASA info to find URL", "Fetch JSON from IPFS/HTTP", "Parse and display properties", "Handle IPFS gateway conversion" ], example: `interface NFTData {
assetId: number;
name: string;
unitName: string;
url: string;
metadata?: ARC3Metadata;
}

async function fetchARC3Metadata(assetId: number): Promise<NFTData> {
// Get ASA info
const assetInfo = await algodClient.getAssetByID(assetId).do();

const nft: NFTData = {
assetId,
name: assetInfo.params.name,
unitName: assetInfo.params[‘unit-name’],
url: assetInfo.params.url,
};

// Check if ARC-3 compliant
if (!nft.url?.includes(’#arc3’)) {
return nft;
}

// Convert IPFS URL to gateway URL
const metadataUrl = convertIPFSUrl(nft.url.replace(’#arc3’, ‘’));

// Fetch metadata
const response = await fetch(metadataUrl);
nft.metadata = await response.json();

return nft;
}

function convertIPFSUrl(url: string): string {
if (url.startsWith(‘ipfs://’)) {
const cid = url.replace(‘ipfs://’, ‘’);
return `https://ipfs.io/ipfs/${cid}`;
}
return url;
}

// Usage
const nft = await fetchARC3Metadata(12345);
console.log(‘Name:’, nft.metadata?.name);
console.log(‘Image:’, nft.metadata?.image);
console.log(‘Traits:’, nft.metadata?.properties);`, challenge: { prompt: "Convert 'ipfs://QmXyz' to gateway URL", solution: "https://ipfs.io/ipfs/QmXyz", hint: "Replace ipfs:// with https://ipfs.io/ipfs/" } } ] }, arc19: { title: "ARC-19 Templates", icon: "🔄", lessons: [ { id: "arc19-intro", title: "ARC-19 Overview", description: "Mutable NFT metadata using reserve address.", concepts: [ "ARC-19 allows metadata updates without new ASA", "Reserve address encodes IPFS CID", "URL contains template: template-ipfs://{ipfscid:...}", "Update metadata by changing reserve address" ], example: `// ARC-19 Key Concepts:
// 1. URL uses template format
// 2. Reserve address contains encoded IPFS CID
// 3. Metadata can be updated by manager

// URL Template Format:
const arc19Url = “template-ipfs://{ipfscid:1:raw:reserve:sha2-256}”;

// This means:
// - template-ipfs:// = ARC-19 indicator
// - ipfscid = IPFS CID encoding
// - 1 = CID version
// - raw = multicodec
// - reserve = use reserve address
// - sha2-256 = hash algorithm

// The reserve address is derived from IPFS CID
// When you update the reserve address, metadata changes!

import algosdk from ‘algosdk’;
import CID from ‘cids’;
import multihash from ‘multihashes’;

// Convert IPFS CID to Algorand address (reserve)
function cidToReserveAddress(cidString: string): string {
const cid = new CID(cidString);
const decoded = multihash.decode(cid.multihash);

// Use the hash as the public key
const publicKey = decoded.digest;
return algosdk.encodeAddress(publicKey);
}

// Convert reserve address back to CID
function reserveAddressToCid(address: string): string {
const publicKey = algosdk.decodeAddress(address).publicKey;
const mh = multihash.encode(publicKey, ‘sha2-256’);
const cid = new CID(1, ‘raw’, mh);
return cid.toString();
}`, challenge: { prompt: "What address field stores the IPFS CID in ARC-19?", solution: "reserve", hint: "It's one of the four management addresses" } }, { id: "arc19-create", title: "Creating ARC-19 NFTs", description: "Minting updatable NFTs.", concepts: [ "Set URL to template format", "Encode CID in reserve address", "Keep manager address to allow updates", "Same metadata structure as ARC-3" ], example: `import algosdk from ‘algosdk’;

async function createARC19NFT(
creator: algosdk.Account,
name: string,
unitName: string,
metadataCid: string
): Promise<number> {
const params = await algodClient.getTransactionParams().do();

// Convert CID to reserve address
const reserveAddress = cidToReserveAddress(metadataCid);

// ARC-19 template URL
const arc19Url = “template-ipfs://{ipfscid:1:raw:reserve:sha2-256}”;

const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
from: creator.addr,
total: 1,
decimals: 0,
defaultFrozen: false,
assetName: name,
unitName: unitName,
assetURL: arc19Url,
// Manager can update reserve (metadata)
manager: creator.addr,
// Reserve encodes the IPFS CID
reserve: reserveAddress,
suggestedParams: params,
});

const signedTxn = txn.signTxn(creator.sk);
const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
const result = await algosdk.waitForConfirmation(algodClient, txId, 4);

console.log(‘Created ARC-19 NFT:’, result[‘asset-index’]);
console.log(‘Metadata CID:’, metadataCid);

return result[‘asset-index’];
}`, challenge: { prompt: "What's the ARC-19 URL template?", solution: "template-ipfs://{ipfscid:1:raw:reserve:sha2-256}", hint: "It tells clients how to decode the reserve address" } }, { id: "arc19-update", title: "Updating ARC-19 Metadata", description: "Changing NFT metadata after minting.", concepts: [ "Only manager can update reserve", "Upload new metadata to IPFS", "Update reserve address with new CID", "Old metadata still exists on IPFS" ], example: `async function updateARC19Metadata(
manager: algosdk.Account,
assetId: number,
newMetadataCid: string
): Promise<string> {
const params = await algodClient.getTransactionParams().do();

// Get current asset info to preserve other fields
const assetInfo = await algodClient.getAssetByID(assetId).do();

// New reserve address from new CID
const newReserve = cidToReserveAddress(newMetadataCid);

const txn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
from: manager.addr,
assetIndex: assetId,
// Preserve management addresses
manager: assetInfo.params.manager,
freeze: assetInfo.params.freeze,
clawback: assetInfo.params.clawback,
// Update reserve to new CID
reserve: newReserve,
suggestedParams: params,
strictEmptyAddressChecking: false,
});

const signedTxn = txn.signTxn(manager.sk);
const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
await algosdk.waitForConfirmation(algodClient, txId, 4);

console.log(‘Updated metadata to:’, newMetadataCid);
return txId;
}

// Example: Update NFT after reveal
async function revealNFT(assetId: number, revealedImageCid: string) {
// 1. Create new metadata with revealed image
const metadata = {
name: “Revealed NFT #1”,
description: “The true form is revealed!”,
image: `ipfs://${revealedImageCid}`,
properties: { revealed: true }
};

// 2. Upload to IPFS
const metadataResult = await ipfs.add(JSON.stringify(metadata));

// 3. Update the NFT
await updateARC19Metadata(manager, assetId, metadataResult.cid.toString());
}`, challenge: { prompt: "Which address do you update to change ARC-19 metadata?", solution: "reserve", hint: "Same address that stores the CID" } } ] }, arc200: { title: "ARC-200 Tokens", icon: "🪙", lessons: [ { id: "arc200-intro", title: "ARC-200 Overview", description: "Smart contract token standard (like ERC-20).", concepts: [ "ARC-200 = fungible tokens via smart contract", "More flexible than ASAs", "Supports approve/transferFrom pattern", "Balances stored in contract state (boxes)" ], example: `// ARC-200 Interface (like ERC-20)
interface ARC200 {
// View functions
arc200_name(): string;
arc200_symbol(): string;
arc200_decimals(): uint8;
arc200_totalSupply(): uint256;
arc200_balanceOf(owner: Address): uint256;
arc200_allowance(owner: Address, spender: Address): uint256;

// State-changing functions
arc200_transfer(to: Address, value: uint256): bool;
arc200_approve(spender: Address, value: uint256): bool;
arc200_transferFrom(from: Address, to: Address, value: uint256): bool;

// Events (logged via app logs)
// arc200_Transfer(from, to, value)
// arc200_Approval(owner, spender, value)
}

// Key differences from ASA:
// 1. No opt-in required (uses boxes)
// 2. Approve/transferFrom for DEX integration
// 3. More gas cost but more flexibility
// 4. Can have custom logic (fees, rebasing, etc.)`, challenge: { prompt: "What pattern does ARC-200 support that ASAs don't?", solution: "approve/transferFrom", hint: "Used by DEXes to trade on your behalf" } }, { id: "arc200-interact", title: "Interacting with ARC-200", description: "Reading balances and transferring tokens.", concepts: [ "Use ABI to encode method calls", "Read state from boxes", "Include box references in transactions", "Parse return values from logs" ], example: `import algosdk from ‘algosdk’;

// ARC-200 ABI method selectors
const ARC200_METHODS = {
name: ‘arc200_name()string’,
symbol: ‘arc200_symbol()string’,
decimals: ‘arc200_decimals()uint8’,
totalSupply: ‘arc200_totalSupply()uint256’,
balanceOf: ‘arc200_balanceOf(address)uint256’,
transfer: ‘arc200_transfer(address,uint256)bool’,
approve: ‘arc200_approve(address,uint256)bool’,
transferFrom: ‘arc200_transferFrom(address,address,uint256)bool’,
};

// Get method selector
function getSelector(method: string): Uint8Array {
const hash = algosdk.sha512_256(method);
return hash.slice(0, 4);
}

// Read balance
async function arc200BalanceOf(
appId: number,
address: string
): Promise<bigint> {
const params = await algodClient.getTransactionParams().do();

// Encode method call
const selector = getSelector(ARC200_METHODS.balanceOf);
const addressBytes = algosdk.decodeAddress(address).publicKey;
const args = new Uint8Array([…selector, …addressBytes]);

// Simulate the call
const txn = algosdk.makeApplicationNoOpTxnFromObject({
from: address,
appIndex: appId,
appArgs: [args],
boxes: [{ appIndex: appId, name: addressBytes }],
suggestedParams: params,
});

const result = await algodClient.simulateTransaction(
new algosdk.SimulateRequest({ txnGroups: [{ txns: [txn] }] })
).do();

// Parse return value from logs
const logs = result.txnGroups[0].txnResults[0].txnResult.logs;
if (logs && logs.length > 0) {
const returnValue = Buffer.from(logs[logs.length - 1], ‘base64’);
return BigInt(‘0x’ + returnValue.toString(‘hex’));
}

return BigInt(0);
}`, challenge: { prompt: "How many bytes is an ABI method selector?", solution: "4", hint: "First 4 bytes of SHA-512/256 hash" } }, { id: "arc200-transfer", title: "ARC-200 Transfers", description: "Sending tokens and approvals.", concepts: [ "Transfer: send your tokens", "Approve: allow spender to use tokens", "TransferFrom: spend approved tokens", "Must include receiver's box reference" ], example: `// Transfer ARC-200 tokens
async function arc200Transfer(
sender: algosdk.Account,
appId: number,
to: string,
amount: bigint
): Promise<string> {
const params = await algodClient.getTransactionParams().do();

// Encode: selector + address + uint256
const selector = getSelector(ARC200_METHODS.transfer);
const toBytes = algosdk.decodeAddress(to).publicKey;
const amountBytes = bigintToUint256(amount);

const args = new Uint8Array([
…selector,
…toBytes,
…amountBytes
]);

const txn = algosdk.makeApplicationNoOpTxnFromObject({
from: sender.addr,
appIndex: appId,
appArgs: [args],
// Include boxes for both sender and receiver
boxes: [
{ appIndex: appId, name: algosdk.decodeAddress(sender.addr).publicKey },
{ appIndex: appId, name: toBytes },
],
suggestedParams: params,
});

const signedTxn = txn.signTxn(sender.sk);
const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
await algosdk.waitForConfirmation(algodClient, txId, 4);

return txId;
}

// Approve spender
async function arc200Approve(
owner: algosdk.Account,
appId: number,
spender: string,
amount: bigint
): Promise<string> {
const params = await algodClient.getTransactionParams().do();

const selector = getSelector(ARC200_METHODS.approve);
const spenderBytes = algosdk.decodeAddress(spender).publicKey;
const amountBytes = bigintToUint256(amount);

const args = new Uint8Array([
…selector,
…spenderBytes,
…amountBytes
]);

// Approval box key = owner + spender
const approvalKey = new Uint8Array([
…algosdk.decodeAddress(owner.addr).publicKey,
…spenderBytes
]);

const txn = algosdk.makeApplicationNoOpTxnFromObject({
from: owner.addr,
appIndex: appId,
appArgs: [args],
boxes: [{ appIndex: appId, name: approvalKey }],
suggestedParams: params,
});

const signedTxn = txn.signTxn(owner.sk);
const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
await algosdk.waitForConfirmation(algodClient, txId, 4);

return txId;
}

// Helper: bigint to 32-byte uint256
function bigintToUint256(value: bigint): Uint8Array {
const hex = value.toString(16).padStart(64, ‘0’);
return Uint8Array.from(Buffer.from(hex, ‘hex’));
}`, challenge: { prompt: "What boxes must be included for a transfer?", solution: "sender and receiver", hint: "Both balances need to be accessed" } } ] }, boxes: { title: "Box Storage", icon: "📦", lessons: [ { id: "boxes-intro", title: "Box Storage Overview", description: "Scalable key-value storage for contracts.", concepts: [ "Boxes = arbitrary key-value storage", "Up to 32KB per box", "Must be referenced in transaction", "Cost: 0.0025 ALGO per box + 0.0004 per byte" ], example: `// Box Storage Benefits:
// 1. No 128-entry limit (unlike global/local state)
// 2. Larger values (32KB vs 128 bytes)
// 3. Dynamic keys (any byte string)
// 4. Per-box MBR (pay only for what you use)

// Box MBR Calculation:
// Base: 2500 microAlgo (0.0025 ALGO)
// Per byte: 400 microAlgo (0.0004 ALGO)
// Total = 2500 + (key.length + value.length) * 400

function calculateBoxMBR(keyLength: number, valueLength: number): number {
return 2500 + (keyLength + valueLength) * 400;
}

// Example: Store user profile (32-byte key, 100-byte value)
const mbr = calculateBoxMBR(32, 100);
console.log(‘Box MBR:’, mbr / 1e6, ‘ALGO’); // 0.0553 ALGO

// Use cases:
// - User balances (ARC-200 tokens)
// - NFT metadata
// - Game state
// - Large configuration
// - Mapping-like structures`, challenge: { prompt: "What's the max size of a single box?", solution: "32KB", hint: "32 kilobytes or 32768 bytes" } }, { id: "boxes-create", title: "Creating & Writing Boxes", description: "Storing data in contract boxes.", concepts: [ "Box.create(name, size) allocates space", "Box.put(name, value) writes data", "App must be funded for MBR", "Transaction must reference box" ], example: `// PyTeal contract with box storage
/*
from pyteal import *

def approval():
# Create a box
create_box = Seq([
Assert(Txn.application_args.length() >= Int(2)),
BoxCreate(
Txn.application_args[1],  # Box name
Int(100)                   # Size in bytes
),
Approve()
])

```
# Write to box
write_box = Seq([
    Assert(Txn.application_args.length() >= Int(3)),
    BoxPut(
        Txn.application_args[1],  # Box name
        Txn.application_args[2]   # Value
    ),
    Approve()
])

return Cond(
    [Txn.application_args[0] == Bytes("create"), create_box],
    [Txn.application_args[0] == Bytes("write"), write_box],
)
```

*/

// TypeScript: Create and write to box
async function createBox(
caller: algosdk.Account,
appId: number,
boxName: string,
size: number
): Promise<string> {
const params = await algodClient.getTransactionParams().do();

const nameBytes = new TextEncoder().encode(boxName);

const txn = algosdk.makeApplicationNoOpTxnFromObject({
from: caller.addr,
appIndex: appId,
appArgs: [
new TextEncoder().encode(‘create’),
nameBytes,
],
boxes: [{ appIndex: appId, name: nameBytes }],
suggestedParams: params,
});

const signedTxn = txn.signTxn(caller.sk);
const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
await algosdk.waitForConfirmation(algodClient, txId, 4);

return txId;
}

async function writeToBox(
caller: algosdk.Account,
appId: number,
boxName: string,
value: Uint8Array
): Promise<string> {
const params = await algodClient.getTransactionParams().do();

const nameBytes = new TextEncoder().encode(boxName);

const txn = algosdk.makeApplicationNoOpTxnFromObject({
from: caller.addr,
appIndex: appId,
appArgs: [
new TextEncoder().encode(‘write’),
nameBytes,
value,
],
boxes: [{ appIndex: appId, name: nameBytes }],
suggestedParams: params,
});

const signedTxn = txn.signTxn(caller.sk);
const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
await algosdk.waitForConfirmation(algodClient, txId, 4);

return txId;
}`, challenge: { prompt: "What must be included in txn to access a box?", solution: "boxes reference array", hint: "Array of { appIndex, name } objects" } }, { id: "boxes-read", title: "Reading Box Data", description: "Fetching box contents from contracts.", concepts: [ "Use algodClient.getApplicationBoxByName()", "Returns base64 encoded value", "List all boxes with getApplicationBoxes()", "Parse binary data as needed" ], example: `// Read a single box
async function readBox(
appId: number,
boxName: string
): Promise<Uint8Array | null> {
try {
const nameBytes = new TextEncoder().encode(boxName);
const response = await algodClient
.getApplicationBoxByName(appId, nameBytes)
.do();

```
return new Uint8Array(Buffer.from(response.value, 'base64'));
```

} catch (error) {
// Box doesn’t exist
return null;
}
}

// List all boxes for an app
async function listBoxes(appId: number): Promise<string[]> {
const response = await algodClient.getApplicationBoxes(appId).do();

return response.boxes.map((box: any) => {
const nameBytes = Buffer.from(box.name, ‘base64’);
return nameBytes.toString();
});
}

// Read user balance from ARC-200 style box
async function readUserBalance(
appId: number,
userAddress: string
): Promise<bigint> {
const publicKey = algosdk.decodeAddress(userAddress).publicKey;

try {
const response = await algodClient
.getApplicationBoxByName(appId, publicKey)
.do();

```
const valueBytes = Buffer.from(response.value, 'base64');
return BigInt('0x' + valueBytes.toString('hex'));
```

} catch {
return BigInt(0);
}
}

// Parse structured data from box
interface UserProfile {
name: string;
score: number;
lastActive: number;
}

async function readUserProfile(
appId: number,
userId: string
): Promise<UserProfile | null> {
const boxData = await readBox(appId, `profile_${userId}`);

if (!boxData) return null;

// Parse binary format (example: 32 bytes name + 8 bytes score + 8 bytes timestamp)
const decoder = new TextDecoder();
const name = decoder.decode(boxData.slice(0, 32)).replace(/\0/g, ‘’);
const score = Number(BigInt(‘0x’ + Buffer.from(boxData.slice(32, 40)).toString(‘hex’)));
const lastActive = Number(BigInt(‘0x’ + Buffer.from(boxData.slice(40, 48)).toString(‘hex’)));

return { name, score, lastActive };
}`, challenge: { prompt: "Method to read a box by name?", solution: "getApplicationBoxByName", hint: "algodClient.getApplicationBoxByName(appId, name)" } } ] }, algokit: { title: "AlgoKit Patterns", icon: "🛠️", lessons: [ { id: "algokit-intro", title: "AlgoKit Overview", description: "Modern Algorand development framework.", concepts: [ "AlgoKit = official development toolkit", "Includes utils, testing, deployment", "TypeScript client generation from ABI", "Simplified transaction composition" ], example: `// Install AlgoKit Utils
// npm install @algorandfoundation/algokit-utils

import { AlgorandClient } from ‘@algorandfoundation/algokit-utils’;

// Initialize client (much simpler!)
const algorand = AlgorandClient.testNet();

// Or from config
const algorand = AlgorandClient.fromConfig({
algodConfig: {
server: ‘https://testnet-api.algonode.cloud’,
port: 443,
},
indexerConfig: {
server: ‘https://testnet-idx.algonode.cloud’,
port: 443,
},
});

// Get account info
const account = algorand.account.fromMnemonic(mnemonic);
const info = await algorand.account.getInformation(account.addr);
console.log(‘Balance:’, info.amount.microAlgo / 1e6, ‘ALGO’);

// Simple payment
const result = await algorand.send.payment({
sender: account.addr,
receiver: ‘RECEIVER…’,
amount: (1.5).algo(),  // Nice helper!
signer: account,
});

console.log(‘Sent:’, result.txId);`, challenge: { prompt: "AlgoKit helper for 1.5 ALGO amount?", solution: "(1.5).algo()", hint: "Extension method on numbers" } }, { id: "algokit-apps", title: "Application Deployment", description: "Deploying contracts with AlgoKit.", concepts: [ "Compile TEAL automatically", "Deploy with one method call", "Typed client generation", "Built-in state management" ], example: `import { AlgorandClient } from ‘@algorandfoundation/algokit-utils’;
import * as fs from ‘fs’;

const algorand = AlgorandClient.testNet();
const deployer = algorand.account.fromMnemonic(DEPLOYER_MNEMONIC);

// Deploy from TEAL source
async function deployApp(): Promise<number> {
const approvalSource = fs.readFileSync(‘approval.teal’, ‘utf8’);
const clearSource = fs.readFileSync(‘clear.teal’, ‘utf8’);

const result = await algorand.send.appCreate({
sender: deployer.addr,
approvalProgram: approvalSource,
clearStateProgram: clearSource,
schema: {
globalByteSlices: 1,
globalInts: 2,
localByteSlices: 0,
localInts: 1,
},
signer: deployer,
});

console.log(‘Deployed app:’, result.appId);
return result.appId;
}

// Call app method
async function callApp(appId: number, method: string, args: any[]) {
const result = await algorand.send.appCall({
sender: deployer.addr,
appId: appId,
appArgs: [method, …args],
signer: deployer,
});

return result;
}

// Update app
async function updateApp(appId: number) {
const newApproval = fs.readFileSync(‘approval_v2.teal’, ‘utf8’);
const newClear = fs.readFileSync(‘clear.teal’, ‘utf8’);

await algorand.send.appUpdate({
sender: deployer.addr,
appId: appId,
approvalProgram: newApproval,
clearStateProgram: newClear,
signer: deployer,
});
}`, challenge: { prompt: "Method to deploy a new app?", solution: "algorand.send.appCreate", hint: "Uses send namespace with appCreate" } }, { id: "algokit-typed", title: "Typed App Clients", description: "Auto-generated type-safe clients.", concepts: [ "Generate client from ABI JSON", "Full TypeScript types for methods", "Automatic encoding/decoding", "IDE autocomplete support" ], example: `// Generated client from ABI (using algokit generate)
// algokit generate client -a app.json -o CounterClient.ts

import { CounterClient } from ‘./CounterClient’;

const algorand = AlgorandClient.testNet();
const caller = algorand.account.fromMnemonic(MNEMONIC);

// Create typed client
const client = new CounterClient({
resolveBy: ‘id’,
id: APP_ID,
sender: caller,
algorand,
});

// Type-safe method calls!
async function useTypedClient() {
// Methods are fully typed
const count = await client.getCount();
console.log(‘Current count:’, count.return);

// Increment with type checking
const result = await client.increment();
console.log(‘New count:’, result.return);

// Compiler catches errors
// client.nonExistentMethod(); // Error!

// Struct parameters are typed
await client.setConfig({
maxValue: 1000n,
minValue: 0n,
admin: caller.addr,
});
}

// Deploy new instance
async function deployTypedApp() {
const { appClient, result } = await client.deploy({
deployTimeParams: {
initialCount: 0,
},
onSchemaBreak: ‘replace’,
onUpdate: ‘update’,
});

console.log(‘Deployed:’, result.appId);
return appClient;
}

// Compose transactions
async function atomicIncrement() {
const composer = algorand.newGroup();

composer.addAppCall({
sender: caller.addr,
appId: APP_ID,
method: client.appClient.getABIMethod(‘increment’),
signer: caller,
});

composer.addPayment({
sender: caller.addr,
receiver: algosdk.getApplicationAddress(APP_ID),
amount: (0.1).algo(),
signer: caller,
});

const result = await composer.execute();
console.log(‘Group executed:’, result.txIds);
}`, challenge: { prompt: "Command to generate typed client?", solution: "algokit generate client", hint: "algokit CLI with generate subcommand" } }, { id: "algokit-testing", title: "Testing with AlgoKit", description: "Unit testing Algorand applications.", concepts: [ "LocalNet for fast testing", "Fixture-based test setup", "Automatic account funding", "State inspection helpers" ], example: `// Jest/Vitest test with AlgoKit
import { describe, it, expect, beforeAll } from ‘vitest’;
import { AlgorandClient } from ‘@algorandfoundation/algokit-utils’;
import { CounterClient } from ‘./CounterClient’;

describe(‘Counter App’, () => {
let algorand: AlgorandClient;
let deployer: Account;
let client: CounterClient;

beforeAll(async () => {
// Connect to LocalNet
algorand = AlgorandClient.fromEnvironment();

```
// Get funded account
deployer = await algorand.account.kmd.getOrCreateWalletAccount(
  'default',
  'default'
);

// Ensure funded
await algorand.account.ensureFunded(
  deployer,
  algorand.account.localNetDispenser(),
  (10).algo()
);

// Deploy app
client = new CounterClient({
  resolveBy: 'creatorAndName',
  creatorAddress: deployer.addr,
  name: 'counter-test',
  sender: deployer,
  algorand,
});

await client.deploy({
  deployTimeParams: { initialCount: 0 },
});
```

});

it(‘should start at zero’, async () => {
const result = await client.getCount();
expect(result.return).toBe(0n);
});

it(‘should increment’, async () => {
await client.increment();
const result = await client.getCount();
expect(result.return).toBe(1n);
});

it(‘should handle multiple increments’, async () => {
const initial = await client.getCount();

```
await client.increment();
await client.increment();
await client.increment();

const final = await client.getCount();
expect(final.return).toBe(initial.return + 3n);
```

});

it(‘should reject unauthorized reset’, async () => {
const otherAccount = algorand.account.random();
await algorand.account.ensureFunded(
otherAccount,
algorand.account.localNetDispenser(),
(1).algo()
);

```
const otherClient = new CounterClient({
  resolveBy: 'id',
  id: client.appId,
  sender: otherAccount,
  algorand,
});

await expect(otherClient.reset()).rejects.toThrow();
```

});
});`, challenge: { prompt: "Helper to ensure account has funds?", solution: "algorand.account.ensureFunded", hint: "Tops up account to minimum balance" } } ] }, wallet: { title: "Pera Wallet", icon: "👛", lessons: [ { id: "pera-connect", title: "Wallet Connection", description: "Integrating Pera Wallet in React.", concepts: [ "@perawallet/connect package", "WalletConnect protocol", "Session persistence" ], example: `import { PeraWalletConnect } from ‘@perawallet/connect’;
import { useState, useEffect } from ‘react’;

const peraWallet = new PeraWalletConnect();

export function usePeraWallet() {
const [address, setAddress] = useState<string | null>(null);

useEffect(() => {
peraWallet.reconnectSession()
.then(accounts => {
if (accounts.length) setAddress(accounts[0]);
});
}, []);

const connect = async () => {
const accounts = await peraWallet.connect();
setAddress(accounts[0]);
return accounts[0];
};

const disconnect = async () => {
await peraWallet.disconnect();
setAddress(null);
};

const signTransactions = async (txns: algosdk.Transaction[]) => {
const txnGroup = txns.map(txn => ({
txn,
signers: [address!]
}));
return peraWallet.signTransaction([txnGroup]);
};

return { address, connect, disconnect, signTransactions };
}`,
challenge: {
prompt: “Import PeraWalletConnect”,
solution: “import { PeraWalletConnect } from ‘@perawallet/connect’”,
hint: “Named import from @perawallet/connect”
}
}
]
}
};

const TEMPLATES = [
{
id: “arc3-nft”,
name: “ARC-3 NFT Minter”,
description: “Complete NFT minting with IPFS”,
code: `import algosdk from ‘algosdk’;

const algodClient = new algosdk.Algodv2(’’, ‘https://testnet-api.algonode.cloud’, 443);

interface ARC3Metadata {
name: string;
description: string;
image: string;
image_mimetype: string;
properties?: Record<string, any>;
}

export async function createARC3NFT(
creator: algosdk.Account,
metadata: ARC3Metadata,
metadataCid: string
): Promise<{ assetId: number; txId: string }> {
const params = await algodClient.getTransactionParams().do();

// ARC-3 URL format
const assetURL = `ipfs://${metadataCid}#arc3`;

const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
from: creator.addr,
total: 1,
decimals: 0,
defaultFrozen: false,
assetName: metadata.name.slice(0, 32),
unitName: ‘NFT’,
assetURL: assetURL,
manager: creator.addr,
reserve: creator.addr,
suggestedParams: params,
});

const signedTxn = txn.signTxn(creator.sk);
const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
const result = await algosdk.waitForConfirmation(algodClient, txId, 4);

return {
assetId: result[‘asset-index’],
txId
};
}

export async function fetchARC3Metadata(assetId: number): Promise<ARC3Metadata | null> {
const assetInfo = await algodClient.getAssetByID(assetId).do();
const url = assetInfo.params.url;

if (!url?.includes(’#arc3’)) return null;

const gatewayUrl = url
.replace(’#arc3’, ‘’)
.replace(‘ipfs://’, ‘https://ipfs.io/ipfs/’);

const response = await fetch(gatewayUrl);
return response.json();
}`}, { id: "arc200-token", name: "ARC-200 Token Client", description: "Interact with ARC-200 tokens", code:`import algosdk from ‘algosdk’;

const algodClient = new algosdk.Algodv2(’’, ‘https://testnet-api.algonode.cloud’, 443);

// ARC-200 method selectors
const METHODS = {
balanceOf: ‘arc200_balanceOf(address)uint256’,
transfer: ‘arc200_transfer(address,uint256)bool’,
approve: ‘arc200_approve(address,uint256)bool’,
};

function getSelector(method: string): Uint8Array {
return new Uint8Array(Buffer.from(algosdk.sha512_256(method)).slice(0, 4));
}

function bigintToBytes32(value: bigint): Uint8Array {
const hex = value.toString(16).padStart(64, ‘0’);
return new Uint8Array(Buffer.from(hex, ‘hex’));
}

export async function arc200BalanceOf(
appId: number,
address: string
): Promise<bigint> {
const params = await algodClient.getTransactionParams().do();
const addressBytes = algosdk.decodeAddress(address).publicKey;

const txn = algosdk.makeApplicationNoOpTxnFromObject({
from: address,
appIndex: appId,
appArgs: [new Uint8Array([…getSelector(METHODS.balanceOf), …addressBytes])],
boxes: [{ appIndex: appId, name: addressBytes }],
suggestedParams: params,
});

const result = await algodClient.simulateTransaction(
{ txnGroups: [{ txns: [algosdk.encodeUnsignedSimulateTransaction(txn)] }] }
).do();

const logs = result.txnGroups?.[0]?.txnResults?.[0]?.txnResult?.logs;
if (logs?.length) {
return BigInt(‘0x’ + Buffer.from(logs[logs.length - 1], ‘base64’).toString(‘hex’));
}
return 0n;
}

export async function arc200Transfer(
sender: algosdk.Account,
appId: number,
to: string,
amount: bigint
): Promise<string> {
const params = await algodClient.getTransactionParams().do();

const args = new Uint8Array([
…getSelector(METHODS.transfer),
…algosdk.decodeAddress(to).publicKey,
…bigintToBytes32(amount)
]);

const txn = algosdk.makeApplicationNoOpTxnFromObject({
from: sender.addr,
appIndex: appId,
appArgs: [args],
boxes: [
{ appIndex: appId, name: algosdk.decodeAddress(sender.addr).publicKey },
{ appIndex: appId, name: algosdk.decodeAddress(to).publicKey },
],
suggestedParams: params,
});

const signedTxn = txn.signTxn(sender.sk);
const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
await algosdk.waitForConfirmation(algodClient, txId, 4);

return txId;
}`}, { id: "box-storage", name: "Box Storage Manager", description: "Create, read, write boxes", code:`import algosdk from ‘algosdk’;

const algodClient = new algosdk.Algodv2(’’, ‘https://testnet-api.algonode.cloud’, 443);

// Calculate box MBR
export function calculateBoxMBR(keyLength: number, valueLength: number): number {
return 2500 + (keyLength + valueLength) * 400; // microAlgos
}

// Read box value
export async function readBox(
appId: number,
boxName: string | Uint8Array
): Promise<Uint8Array | null> {
try {
const nameBytes = typeof boxName === ‘string’
? new TextEncoder().encode(boxName)
: boxName;

```
const response = await algodClient
  .getApplicationBoxByName(appId, nameBytes)
  .do();

return new Uint8Array(Buffer.from(response.value, 'base64'));
```

} catch {
return null;
}
}

// List all boxes
export async function listBoxes(appId: number): Promise<Uint8Array[]> {
const response = await algodClient.getApplicationBoxes(appId).do();
return response.boxes.map((b: any) =>
new Uint8Array(Buffer.from(b.name, ‘base64’))
);
}

// Create box (requires contract support)
export async function createBox(
caller: algosdk.Account,
appId: number,
boxName: Uint8Array,
size: number
): Promise<string> {
const params = await algodClient.getTransactionParams().do();

// Fund app for box MBR
const mbr = calculateBoxMBR(boxName.length, size);
const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
from: caller.addr,
to: algosdk.getApplicationAddress(appId),
amount: mbr,
suggestedParams: params,
});

const createTxn = algosdk.makeApplicationNoOpTxnFromObject({
from: caller.addr,
appIndex: appId,
appArgs: [
new TextEncoder().encode(‘create_box’),
boxName,
algosdk.encodeUint64(size),
],
boxes: [{ appIndex: appId, name: boxName }],
suggestedParams: params,
});

algosdk.assignGroupID([fundTxn, createTxn]);

const signedTxns = [
fundTxn.signTxn(caller.sk),
createTxn.signTxn(caller.sk),
];

const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
await algosdk.waitForConfirmation(algodClient, txId, 4);

return txId;
}`}, { id: "algokit-app", name: "AlgoKit App Template", description: "Modern app with typed client", code:`import { AlgorandClient } from ‘@algorandfoundation/algokit-utils’;

// Initialize AlgoKit client
const algorand = AlgorandClient.fromConfig({
algodConfig: {
server: ‘https://testnet-api.algonode.cloud’,
port: 443,
},
});

// Account helpers
export async function getAccount(mnemonic: string) {
return algorand.account.fromMnemonic(mnemonic);
}

export async function getBalance(address: string): Promise<number> {
const info = await algorand.account.getInformation(address);
return info.amount.microAlgo / 1e6;
}

// Simple payment
export async function sendPayment(
sender: any,
receiver: string,
amountAlgo: number
): Promise<string> {
const result = await algorand.send.payment({
sender: sender.addr,
receiver,
amount: algorand.amount.algo(amountAlgo),
signer: sender,
});

return result.txId;
}

// Deploy app
export async function deployApp(
deployer: any,
approvalTeal: string,
clearTeal: string,
schema: {
globalInts: number;
globalBytes: number;
localInts: number;
localBytes: number;
}
) {
const result = await algorand.send.appCreate({
sender: deployer.addr,
approvalProgram: approvalTeal,
clearStateProgram: clearTeal,
schema: {
globalByteSlices: schema.globalBytes,
globalInts: schema.globalInts,
localByteSlices: schema.localBytes,
localInts: schema.localInts,
},
signer: deployer,
});

return {
appId: result.appId,
appAddress: result.appAddress,
txId: result.txId,
};
}

// Atomic group
export async function atomicGroup(
sender: any,
transactions: any[]
) {
const composer = algorand.newGroup();

for (const tx of transactions) {
if (tx.type === ‘payment’) {
composer.addPayment({
sender: sender.addr,
receiver: tx.receiver,
amount: algorand.amount.algo(tx.amount),
signer: sender,
});
} else if (tx.type === ‘appCall’) {
composer.addAppCall({
sender: sender.addr,
appId: tx.appId,
appArgs: tx.args,
signer: sender,
});
}
}

return composer.execute();
}`
}
];

const QUIZ = [
{ question: “ARC-3 URL suffix?”, options: [”#nft”, “#arc3”, “#metadata”, “.json”], correct: 1 },
{ question: “ARC-19 stores CID in which address?”, options: [“Manager”, “Reserve”, “Freeze”, “Clawback”], correct: 1 },
{ question: “ARC-200 is similar to which Ethereum standard?”, options: [“ERC-721”, “ERC-20”, “ERC-1155”, “ERC-4626”], correct: 1 },
{ question: “Max box size?”, options: [“1KB”, “8KB”, “32KB”, “128KB”], correct: 2 },
{ question: “Box MBR base cost?”, options: [“0.001 ALGO”, “0.0025 ALGO”, “0.01 ALGO”, “0.1 ALGO”], correct: 1 },
{ question: “AlgoKit amount helper for 5 ALGO?”, options: [”(5).algo()”, “algo(5)”, “Algo.from(5)”, “5 * 1e6”], correct: 0 },
{ question: “ARC-200 approve pattern enables?”, options: [“Freezing”, “DEX trading”, “Minting”, “Burning”], correct: 1 },
{ question: “Method to read box by name?”, options: [“getBox()”, “readBox()”, “getApplicationBoxByName()”, “fetchBox()”], correct: 2 }
];

export default function AdvancedAlgorandTraining() {
const [activeTab, setActiveTab] = useState(‘learn’);
const [selectedCategory, setSelectedCategory] = useState(‘arc3’);
const [selectedLesson, setSelectedLesson] = useState(0);
const [history, setHistory] = useState([
{ type: ‘system’, content: ‘🔷 Advanced Algorand Training Terminal’ },
{ type: ‘system’, content: ‘ARC Standards • AlgoKit • Box Storage’ },
{ type: ‘system’, content: ‘Commands: check <code>, hint, solution, clear’ },
]);
const [input, setInput] = useState(’’);
const [quizIndex, setQuizIndex] = useState(0);
const [quizScore, setQuizScore] = useState(0);
const [quizComplete, setQuizComplete] = useState(false);
const [completed, setCompleted] = useState(new Set());
const [template, setTemplate] = useState(0);

const terminalRef = useRef(null);
const cat = LESSONS[selectedCategory];
const lesson = cat?.lessons[selectedLesson];

useEffect(() => {
if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
}, [history]);

const add = (type, content) => setHistory(h => […h, { type, content }]);

const check = (code) => {
if (!lesson?.challenge) return false;
const s = lesson.challenge.solution.toLowerCase().replace(/\s/g, ‘’);
const u = code.toLowerCase().replace(/\s/g, ‘’);
return u.includes(s) || s.includes(u);
};

const exec = (cmd) => {
const t = cmd.trim();
if (!t) return;
add(‘input’, t);
if (t === ‘clear’) { setHistory([{ type: ‘system’, content: ‘Cleared.’ }]); return; }
if (t === ‘hint’) { add(‘hint’, `💡 ${lesson?.challenge?.hint || 'No hint'}`); return; }
if (t === ‘solution’) { add(‘solution’, `✨ ${lesson?.challenge?.solution || 'N/A'}`); return; }
if (t.startsWith(’check ’)) {
if (check(t.slice(6))) {
add(‘success’, ‘✅ Correct!’);
setCompleted(c => new Set([…c, `${selectedCategory}-${selectedLesson}`]));
} else add(‘error’, ‘❌ Try again or type “hint”’);
return;
}
add(‘system’, ‘Commands: check <code>, hint, solution, clear’);
};

const quizAnswer = (i) => {
if (i === QUIZ[quizIndex].correct) setQuizScore(s => s + 1);
if (quizIndex < QUIZ.length - 1) setQuizIndex(q => q + 1);
else setQuizComplete(true);
};

const colors = { input: ‘text-cyan-400’, success: ‘text-green-400’, error: ‘text-red-400’, hint: ‘text-yellow-400’, solution: ‘text-purple-400’, system: ‘text-gray-400’ };

return (
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
<header className="bg-slate-900/80 border-b border-indigo-500/30 px-6 py-4">
<div className="max-w-7xl mx-auto flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-xl">🔷</div>
<div>
<h1 className="text-xl font-bold">Advanced Algorand Academy</h1>
<p className="text-sm text-gray-400">ARC Standards • AlgoKit • Box Storage</p>
</div>
</div>
<span className="text-indigo-400 font-mono">{completed.size} completed</span>
</div>
</header>

```
  <nav className="bg-slate-900/50 border-b border-gray-700">
    <div className="max-w-7xl mx-auto flex">
      {[{ id: 'learn', label: 'Learn', icon: '📚' }, { id: 'practice', label: 'Practice', icon: '💻' }, { id: 'templates', label: 'Templates', icon: '📋' }, { id: 'quiz', label: 'Quiz', icon: '🎯' }].map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 flex items-center gap-2 ${activeTab === tab.id ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>
          <span>{tab.icon}</span><span>{tab.label}</span>
        </button>
      ))}
    </div>
  </nav>

  <main className="max-w-7xl mx-auto p-6">
    {activeTab === 'learn' && (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-2">
          {Object.entries(LESSONS).map(([key, c]) => (
            <div key={key}>
              <button onClick={() => { setSelectedCategory(key); setSelectedLesson(0); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${selectedCategory === key ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
                <span>{c.icon}</span><span>{c.title}</span>
              </button>
              {selectedCategory === key && (
                <div className="ml-4 mt-1 space-y-1">
                  {c.lessons.map((l, i) => (
                    <button key={i} onClick={() => setSelectedLesson(i)} className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${selectedLesson === i ? 'bg-indigo-500/30 text-indigo-300' : 'text-gray-400 hover:text-white'}`}>
                      {completed.has(`${key}-${i}`) && <span className="text-green-400">✓</span>}
                      <span>{l.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="col-span-9 space-y-6">
          {lesson && (
            <>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold mb-2">{lesson.title}</h2>
                <p className="text-gray-300 mb-4">{lesson.description}</p>
                <ul className="space-y-1">{lesson.concepts.map((c, i) => <li key={i} className="text-gray-300"><span className="text-indigo-400 mr-2">•</span>{c}</li>)}</ul>
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-slate-800 px-4 py-2 text-gray-400 text-sm">example.ts</div>
                <pre className="p-4 overflow-x-auto text-sm text-green-300 max-h-96">{lesson.example}</pre>
              </div>
              {lesson.challenge && (
                <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-6 border border-indigo-500/30">
                  <h3 className="text-lg font-bold text-indigo-300 mb-2">🎯 Challenge</h3>
                  <p className="text-gray-200 mb-4">{lesson.challenge.prompt}</p>
                  <button onClick={() => setActiveTab('practice')} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg">Try in Terminal →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )}

    {activeTab === 'practice' && (
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Current Challenge</h2>
          {lesson?.challenge ? (
            <>
              <p className="text-sm text-gray-400 mb-2">{cat.title} → {lesson.title}</p>
              <p className="text-lg mb-4">{lesson.challenge.prompt}</p>
              <pre className="bg-slate-900 rounded-lg p-4 text-sm text-green-300 overflow-x-auto max-h-64">{lesson.example}</pre>
            </>
          ) : <p className="text-gray-400">Select a lesson from Learn tab.</p>}
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col" style={{ height: '500px' }}>
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between">
            <span className="text-gray-400 text-sm">Terminal</span>
            <button onClick={() => setHistory([{ type: 'system', content: 'Cleared.' }])} className="text-xs bg-slate-700 px-2 py-1 rounded">Clear</button>
          </div>
          <div ref={terminalRef} className="flex-1 p-4 overflow-y-auto font-mono text-sm">
            {history.map((l, i) => <div key={i} className={colors[l.type] || 'text-gray-300'}>{l.type === 'input' && '❯ '}{l.content}</div>)}
            <div className="flex items-center mt-1">
              <span className="text-indigo-500">❯ </span>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { exec(input); setInput(''); } }} className="flex-1 bg-transparent text-indigo-400 outline-none" placeholder='check <code>' />
            </div>
          </div>
        </div>
      </div>
    )}

    {activeTab === 'templates' && (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-2">
          {TEMPLATES.map((t, i) => (
            <button key={t.id} onClick={() => setTemplate(i)} className={`w-full text-left px-4 py-3 rounded-lg ${template === i ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm opacity-75">{t.description}</div>
            </button>
          ))}
        </div>
        <div className="col-span-9 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 flex justify-between border-b border-slate-700">
            <span className="font-semibold">{TEMPLATES[template].name}</span>
            <button onClick={() => navigator.clipboard.writeText(TEMPLATES[template].code)} className="bg-indigo-600 px-3 py-1 rounded text-sm">Copy</button>
          </div>
          <pre className="p-4 overflow-auto text-sm text-green-300" style={{ maxHeight: '70vh' }}>{TEMPLATES[template].code}</pre>
        </div>
      </div>
    )}

    {activeTab === 'quiz' && (
      <div className="max-w-2xl mx-auto">
        {!quizComplete ? (
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
            <div className="flex justify-between mb-6">
              <span className="text-gray-400">Question {quizIndex + 1}/{QUIZ.length}</span>
              <span className="text-indigo-400">Score: {quizScore}</span>
            </div>
            <h2 className="text-xl font-bold mb-6">{QUIZ[quizIndex].question}</h2>
            <div className="space-y-3">
              {QUIZ[quizIndex].options.map((opt, i) => (
                <button key={i} onClick={() => quizAnswer(i)} className="w-full text-left px-4 py-3 bg-slate-700 hover:bg-indigo-600 rounded-lg">
                  {String.fromCharCode(65 + i)}. {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 text-center">
            <div className="text-6xl mb-4">{quizScore >= 6 ? '🏆' : quizScore >= 4 ? '👍' : '📚'}</div>
            <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-4xl font-bold text-indigo-400 mb-6">{quizScore}/{QUIZ.length}</p>
            <button onClick={() => { setQuizIndex(0); setQuizScore(0); setQuizComplete(false); }} className="bg-indigo-600 px-6 py-3 rounded-lg">Try Again</button>
          </div>
        )}
      </div>
    )}
  </main>
</div>
```

);
}