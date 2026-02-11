import algosdk from "algosdk";
import { ALGOD_SERVER } from "./config.js";

export async function mintNFT(address) {
  const client = new algosdk.Algodv2("", ALGOD_SERVER, "");

  const params = await client.getTransactionParams().do();

  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: address,
    total: 1,
    decimals: 0,
    assetName: "WIFI DJ NFT",
    unitName: "WIFIDJ",
    assetURL: "https://example.com/metadata.json",
    suggestedParams: params
  });

  console.log("NFT txn created:", txn);
  alert("NFT transaction built (sign via wallet)");
}