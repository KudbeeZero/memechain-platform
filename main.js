import { connectWallet } from "./wallet.js";
import { mintNFT } from "./mint.js";

const connectBtn = document.getElementById("connectBtn");
const mintBtn = document.getElementById("mintBtn");
const walletText = document.getElementById("walletAddress");

let walletAddress = null;

connectBtn.onclick = async () => {
  walletAddress = await connectWallet();
  walletText.textContent = "Connected: " + walletAddress;
};

mintBtn.onclick = async () => {
  if (!walletAddress) return alert("Connect wallet first");
  await mintNFT(walletAddress);
};