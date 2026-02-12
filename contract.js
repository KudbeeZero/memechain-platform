import algosdk from "algosdk";
import { ALGOD_SERVER, ALGOD_PORT, ALGOD_TOKEN } from "./Config.js";

// ── Set your deployed App ID here after running `npm run deploy:token` ──
export const MEME_TOKEN_APP_ID = 0; // Replace with actual app ID after deploy

// ABI method selectors (first 4 bytes of sha512/256 of method signature)
const ABI_METHODS = {
  bootstrap:     "bootstrap(string,string,uint64)uint64",
  pause:         "pause()void",
  unpause:       "unpause()void",
  transfer:      "transfer(address,uint64)bool",
  mint:          "mint(address,uint64)void",
  getBalance:    "getBalance(address)uint64",
  getTotalSupply:"getTotalSupply()uint64",
  getName:       "getName()string",
  getSymbol:     "getSymbol()string",
  isPaused:      "isPaused()bool",
  getAdmin:      "getAdmin()address",
};

function getClient() {
  return new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
}

function getABIContract() {
  return new algosdk.ABIContract({
    name: "MemeToken",
    methods: [
      {
        name: "bootstrap",
        args: [
          { type: "string", name: "tokenName" },
          { type: "string", name: "tokenSymbol" },
          { type: "uint64", name: "initialSupply" },
        ],
        returns: { type: "uint64" },
      },
      {
        name: "transfer",
        args: [
          { type: "address", name: "to" },
          { type: "uint64", name: "amount" },
        ],
        returns: { type: "bool" },
      },
      {
        name: "mint",
        args: [
          { type: "address", name: "to" },
          { type: "uint64", name: "amount" },
        ],
        returns: { type: "void" },
      },
      {
        name: "getBalance",
        args: [{ type: "address", name: "account" }],
        returns: { type: "uint64" },
      },
      {
        name: "getTotalSupply",
        args: [],
        returns: { type: "uint64" },
      },
      {
        name: "getName",
        args: [],
        returns: { type: "string" },
      },
      {
        name: "getSymbol",
        args: [],
        returns: { type: "string" },
      },
      {
        name: "isPaused",
        args: [],
        returns: { type: "bool" },
      },
      {
        name: "getAdmin",
        args: [],
        returns: { type: "address" },
      },
      {
        name: "pause",
        args: [],
        returns: { type: "void" },
      },
      {
        name: "unpause",
        args: [],
        returns: { type: "void" },
      },
    ],
  });
}

// ── Read-only calls (no signing needed) ─────────────────────

export async function getBalance(address) {
  const client = getClient();
  const contract = getABIContract();
  const method = contract.getMethodByName("getBalance");

  const atc = new algosdk.AtomicTransactionComposer();
  const params = await client.getTransactionParams().do();

  atc.addMethodCall({
    appID: MEME_TOKEN_APP_ID,
    method,
    methodArgs: [address],
    sender: address,
    suggestedParams: params,
    signer: algosdk.makeEmptyTransactionSigner(),
    boxes: [{ appIndex: MEME_TOKEN_APP_ID, name: boxKey("bal_", address) }],
  });

  const result = await atc.simulate(client);
  const returnValue = result.methodResults[0].returnValue;
  return Number(returnValue);
}

export async function getTotalSupply() {
  const client = getClient();
  const contract = getABIContract();
  const method = contract.getMethodByName("getTotalSupply");

  const atc = new algosdk.AtomicTransactionComposer();
  const params = await client.getTransactionParams().do();

  // Use a zero address as sender for simulate
  const zeroAddr = algosdk.encodeAddress(new Uint8Array(32));
  atc.addMethodCall({
    appID: MEME_TOKEN_APP_ID,
    method,
    methodArgs: [],
    sender: zeroAddr,
    suggestedParams: params,
    signer: algosdk.makeEmptyTransactionSigner(),
  });

  const result = await atc.simulate(client);
  return Number(result.methodResults[0].returnValue);
}

export async function getTokenName() {
  const client = getClient();
  const contract = getABIContract();
  const method = contract.getMethodByName("getName");

  const atc = new algosdk.AtomicTransactionComposer();
  const params = await client.getTransactionParams().do();
  const zeroAddr = algosdk.encodeAddress(new Uint8Array(32));

  atc.addMethodCall({
    appID: MEME_TOKEN_APP_ID,
    method,
    methodArgs: [],
    sender: zeroAddr,
    suggestedParams: params,
    signer: algosdk.makeEmptyTransactionSigner(),
  });

  const result = await atc.simulate(client);
  return result.methodResults[0].returnValue;
}

export async function getTokenSymbol() {
  const client = getClient();
  const contract = getABIContract();
  const method = contract.getMethodByName("getSymbol");

  const atc = new algosdk.AtomicTransactionComposer();
  const params = await client.getTransactionParams().do();
  const zeroAddr = algosdk.encodeAddress(new Uint8Array(32));

  atc.addMethodCall({
    appID: MEME_TOKEN_APP_ID,
    method,
    methodArgs: [],
    sender: zeroAddr,
    suggestedParams: params,
    signer: algosdk.makeEmptyTransactionSigner(),
  });

  const result = await atc.simulate(client);
  return result.methodResults[0].returnValue;
}

// ── Write calls (require WalletConnect signing) ─────────────

/**
 * Build an ABI method call transaction for signing via WalletConnect.
 * Returns the unsigned transaction(s) to be signed by the wallet.
 */
export async function buildTransferTxn(senderAddress, toAddress, amount) {
  const client = getClient();
  const contract = getABIContract();
  const method = contract.getMethodByName("transfer");
  const params = await client.getTransactionParams().do();

  const atc = new algosdk.AtomicTransactionComposer();
  atc.addMethodCall({
    appID: MEME_TOKEN_APP_ID,
    method,
    methodArgs: [toAddress, BigInt(amount)],
    sender: senderAddress,
    suggestedParams: params,
    signer: algosdk.makeEmptyTransactionSigner(),
    boxes: [
      { appIndex: MEME_TOKEN_APP_ID, name: boxKey("bal_", senderAddress) },
      { appIndex: MEME_TOKEN_APP_ID, name: boxKey("bal_", toAddress) },
    ],
  });

  const txns = atc.buildGroup().map((t) => t.txn);
  return txns;
}

export async function buildBootstrapTxn(senderAddress, tokenName, tokenSymbol, initialSupply) {
  const client = getClient();
  const contract = getABIContract();
  const method = contract.getMethodByName("bootstrap");
  const params = await client.getTransactionParams().do();

  const atc = new algosdk.AtomicTransactionComposer();
  atc.addMethodCall({
    appID: MEME_TOKEN_APP_ID,
    method,
    methodArgs: [tokenName, tokenSymbol, BigInt(initialSupply)],
    sender: senderAddress,
    suggestedParams: params,
    signer: algosdk.makeEmptyTransactionSigner(),
    boxes: [
      { appIndex: MEME_TOKEN_APP_ID, name: boxKey("bal_", senderAddress) },
    ],
  });

  const txns = atc.buildGroup().map((t) => t.txn);
  return txns;
}

export async function buildMintTxn(senderAddress, toAddress, amount) {
  const client = getClient();
  const contract = getABIContract();
  const method = contract.getMethodByName("mint");
  const params = await client.getTransactionParams().do();

  const atc = new algosdk.AtomicTransactionComposer();
  atc.addMethodCall({
    appID: MEME_TOKEN_APP_ID,
    method,
    methodArgs: [toAddress, BigInt(amount)],
    sender: senderAddress,
    suggestedParams: params,
    signer: algosdk.makeEmptyTransactionSigner(),
    boxes: [
      { appIndex: MEME_TOKEN_APP_ID, name: boxKey("bal_", toAddress) },
    ],
  });

  const txns = atc.buildGroup().map((t) => t.txn);
  return txns;
}

/**
 * Submit a signed transaction to the network and wait for confirmation.
 */
export async function submitSignedTxn(signedTxnBytes) {
  const client = getClient();
  const { txId } = await client.sendRawTransaction(signedTxnBytes).do();
  const result = await algosdk.waitForConfirmation(client, txId, 4);
  return { txId, confirmedRound: result["confirmed-round"] };
}

// ── Helpers ─────────────────────────────────────────────────

function boxKey(prefix, address) {
  const prefixBytes = new TextEncoder().encode(prefix);
  const addrBytes = algosdk.decodeAddress(address).publicKey;
  const key = new Uint8Array(prefixBytes.length + addrBytes.length);
  key.set(prefixBytes, 0);
  key.set(addrBytes, prefixBytes.length);
  return key;
}
