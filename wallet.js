import { PROJECT_ID } from "./config.js";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

let connector;

export async function connectWallet() {
  connector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org",
    qrcodeModal: QRCodeModal
  });

  if (!connector.connected) {
    await connector.createSession();
  }

  return new Promise(resolve => {
    connector.on("connect", (error, payload) => {
      if (error) throw error;
      const { accounts } = payload.params[0];
      resolve(accounts[0]);
    });
  });
}