import { PROJECT_ID } from "./Config.js";
import algosdk from "algosdk";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

let connector;

export function getConnector() {
  return connector;
}

export async function connectWallet() {
  connector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org",
    qrcodeModal: QRCodeModal,
  });

  if (!connector.connected) {
    await connector.createSession();
  }

  return new Promise((resolve, reject) => {
    if (connector.connected) {
      resolve(connector.accounts[0]);
      return;
    }

    connector.on("connect", (error, payload) => {
      if (error) {
        reject(error);
        return;
      }
      const { accounts } = payload.params[0];
      resolve(accounts[0]);
    });
  });
}

export async function disconnectWallet() {
  if (connector && connector.connected) {
    await connector.killSession();
  }
  connector = null;
}

/**
 * Sign transactions via WalletConnect.
 * Accepts an array of algosdk.Transaction objects.
 * Returns an array of signed transaction bytes (Uint8Array[]).
 */
export async function signTransactions(txns) {
  if (!connector || !connector.connected) {
    throw new Error("Wallet not connected");
  }

  // Encode transactions for WalletConnect
  const txnsToSign = txns.map((txn) => ({
    txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64"),
  }));

  // Request signature from wallet
  const result = await connector.sendCustomRequest({
    id: Date.now(),
    jsonrpc: "2.0",
    method: "algo_signTxn",
    params: [txnsToSign],
  });

  // result is an array of base64-encoded signed txns
  return result.map((signedTxn) => new Uint8Array(Buffer.from(signedTxn, "base64")));
}
