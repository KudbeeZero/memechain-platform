import { connectWallet, disconnectWallet, signTransactions } from "./wallet.js";
import { mintNFT } from "./mint.js";
import {
  MEME_TOKEN_APP_ID,
  getBalance,
  getTotalSupply,
  getTokenName,
  getTokenSymbol,
  buildTransferTxn,
  buildBootstrapTxn,
  buildMintTxn,
  submitSignedTxn,
} from "./contract.js";

// ── DOM elements ────────────────────────────────────────────

const connectBtn = document.getElementById("connectBtn");
const walletText = document.getElementById("walletAddress");
const networkBadge = document.getElementById("networkBadge");
const appIdDisplay = document.getElementById("appIdDisplay");

// Contract info
const tokenNameEl = document.getElementById("tokenName");
const tokenSymbolEl = document.getElementById("tokenSymbol");
const totalSupplyEl = document.getElementById("totalSupply");
const myBalanceEl = document.getElementById("myBalance");
const refreshBtn = document.getElementById("refreshBtn");

// Transfer
const transferTo = document.getElementById("transferTo");
const transferAmount = document.getElementById("transferAmount");
const transferBtn = document.getElementById("transferBtn");

// Mint NFT (original)
const mintBtn = document.getElementById("mintBtn");

// Status
const statusEl = document.getElementById("status");

// ── State ───────────────────────────────────────────────────

let walletAddress = null;

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = "status " + (isError ? "status-error" : "status-ok");
  if (msg) {
    setTimeout(() => {
      if (statusEl.textContent === msg) statusEl.textContent = "";
    }, 8000);
  }
}

function shortAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function setConnectedUI(addr) {
  walletAddress = addr;
  walletText.textContent = shortAddr(addr);
  walletText.title = addr;
  connectBtn.textContent = "Disconnect";
  connectBtn.classList.add("connected");
  document.querySelectorAll(".requires-wallet").forEach((el) => {
    el.classList.remove("disabled");
  });
}

function setDisconnectedUI() {
  walletAddress = null;
  walletText.textContent = "";
  connectBtn.textContent = "Connect Wallet";
  connectBtn.classList.remove("connected");
  myBalanceEl.textContent = "--";
  document.querySelectorAll(".requires-wallet").forEach((el) => {
    el.classList.add("disabled");
  });
}

// ── Wallet connect/disconnect ───────────────────────────────

connectBtn.onclick = async () => {
  if (walletAddress) {
    await disconnectWallet();
    setDisconnectedUI();
    setStatus("Wallet disconnected");
    return;
  }

  try {
    setStatus("Connecting wallet...");
    const addr = await connectWallet();
    setConnectedUI(addr);
    setStatus("Connected: " + shortAddr(addr));
    refreshContractInfo();
  } catch (err) {
    setStatus("Connection failed: " + err.message, true);
  }
};

// ── Contract info refresh ───────────────────────────────────

async function refreshContractInfo() {
  if (MEME_TOKEN_APP_ID === 0) {
    tokenNameEl.textContent = "Not deployed";
    tokenSymbolEl.textContent = "--";
    totalSupplyEl.textContent = "--";
    myBalanceEl.textContent = "--";
    return;
  }

  try {
    const [name, symbol, supply] = await Promise.all([
      getTokenName(),
      getTokenSymbol(),
      getTotalSupply(),
    ]);
    tokenNameEl.textContent = name;
    tokenSymbolEl.textContent = symbol;
    totalSupplyEl.textContent = supply.toLocaleString();

    if (walletAddress) {
      const bal = await getBalance(walletAddress);
      myBalanceEl.textContent = bal.toLocaleString();
    }
  } catch (err) {
    console.error("Failed to read contract:", err);
    tokenNameEl.textContent = "Error";
  }
}

if (refreshBtn) {
  refreshBtn.onclick = () => refreshContractInfo();
}

// ── Transfer tokens ─────────────────────────────────────────

if (transferBtn) {
  transferBtn.onclick = async () => {
    if (!walletAddress) return setStatus("Connect wallet first", true);
    if (MEME_TOKEN_APP_ID === 0) return setStatus("Contract not deployed yet", true);

    const to = transferTo.value.trim();
    const amount = parseInt(transferAmount.value, 10);

    if (!to || to.length !== 58) return setStatus("Enter a valid Algorand address", true);
    if (!amount || amount <= 0) return setStatus("Enter a valid amount", true);

    try {
      setStatus("Building transfer transaction...");
      const txns = await buildTransferTxn(walletAddress, to, amount);

      setStatus("Sign in your wallet...");
      const signedTxns = await signTransactions(txns);

      setStatus("Submitting transaction...");
      const result = await submitSignedTxn(signedTxns[0]);

      setStatus("Transfer confirmed! TxID: " + result.txId.slice(0, 12) + "...");
      transferTo.value = "";
      transferAmount.value = "";
      refreshContractInfo();
    } catch (err) {
      setStatus("Transfer failed: " + err.message, true);
    }
  };
}

// ── Mint NFT (original feature) ─────────────────────────────

if (mintBtn) {
  mintBtn.onclick = async () => {
    if (!walletAddress) return setStatus("Connect wallet first", true);
    try {
      setStatus("Building NFT mint transaction...");
      await mintNFT(walletAddress);
      setStatus("NFT transaction built - check wallet to sign");
    } catch (err) {
      setStatus("Mint failed: " + err.message, true);
    }
  };
}

// ── Init ────────────────────────────────────────────────────

appIdDisplay.textContent = MEME_TOKEN_APP_ID === 0 ? "Not deployed" : MEME_TOKEN_APP_ID;
networkBadge.textContent = "TestNet";
setDisconnectedUI();
refreshContractInfo();
