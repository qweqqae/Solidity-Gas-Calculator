const { ethers } = require("ethers");
const axios = require("axios");
const readline = require("readline");

const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/34abb3d4a9a948a5823db59412a42ed4");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getEthToKZT() {
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=kzt");
    return response.data.ethereum.kzt || 1_800_000;
  } catch (error) {
    return 1_800_000;
  }
}

async function calculateGasCost(gasLimit) {
  try {
    const gasPriceData = await provider.getFeeData();
    const gasPriceGwei = parseFloat(ethers.formatUnits(gasPriceData.gasPrice, "gwei")).toFixed(1);

    const [coingeckoResponse, ethPriceKZT] = await Promise.all([
      axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"),
      getEthToKZT(),
    ]);
    const ethPriceUSD = coingeckoResponse.data.ethereum.usd;

    const gasCostETH = (gasPriceGwei * gasLimit) / 1e9;
    const gasCostUSD = gasCostETH * ethPriceUSD;
    const gasCostKZT = gasCostETH * ethPriceKZT;

    console.log(`\n Calculation Results:`);
    console.log(` Gas Price: ${gasPriceGwei} Gwei`);
    console.log(` Gas Limit: ${gasLimit}`);
    console.log(`\n Transaction Cost:`);
    console.log(`Ξ ${gasCostETH.toFixed(6)} ETH`);
    console.log(`$ ${gasCostUSD.toFixed(2)}`);
    console.log(`₸ ${gasCostKZT.toFixed(2)}`);
    console.log("\n");

  } catch (error) {
    console.error("Error in calculation:", error);
  }
}

function askGasLimit() {
  rl.question("\nEnter gas limit (default 21000): ", (input) => {
    const gasLimit = input.trim() === "" ? 21000 : parseInt(input);
    
    if (isNaN(gasLimit) || gasLimit <= 0) {
      console.log(" Error: please enter a valid number (e.g. 21000)");
      askGasLimit();
    } else {
      calculateGasCost(gasLimit).finally(() => askGasLimit());
    }
  });
}

console.log(" Ethereum Gas Cost Calculator\n");
console.log(" Common Gas Limits:");
console.log("   - 21000: Simple ETH transfer");
console.log("   - 50000-100000: Basic contract operations");
console.log("   - 200000+: Complex contract interactions\n");

askGasLimit();

rl.on("close", () => {
  console.log("\n Program terminated");
  process.exit(0);
});