const express = require("express");
const Moralis = require("moralis").default;
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const cors = require("cors");
require("dotenv").config();
const port = 5000;
const axios = require("axios");
const connectDB = require("./helper/mongoose.helper");
const userRouter = require("./helper/user.helper");

(async () => {
  if (!Moralis.Core.isStarted) {  // ✅ Prevent multiple starts
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
    console.log("Moralis started successfully");
  }
})();

const app = express();
app.use(cors());
app.use(express.json());
connectDB();

const userSecrets = {};

app.get("/getTokens", async (req, res) => {
  const { userAddress, network } = req.query;

  try {
   if(userAddress){
    const tokensResponse = await Moralis.SolApi.account.getSPL({
      network: network,
      address: userAddress.trim(),
    });
    console.log('TOKEN LIST:',JSON.stringify(tokensResponse))
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key":process.env.MORALIS_API_KEY,
      },
    };

    const updatedTokens = await Promise.all(tokensResponse.raw.map(async (token) => {

      try {
        const response = await fetch(
          `https://solana-gateway.moralis.io/token/devnet/${token.mint}/metadata`,
          options
        );
    
        // Check if the response is okay
        if (!response.ok) {
          throw new Error(`Error fetching data for token ${token.mint}: ${response.statusText}`);
        }
    
        const metadata = await response.json();
        
        // Update the token object with metadata
        return { ...token, metadata }; // Merging original token data with fetched metadata
      } catch (err) {
        console.error(`Failed to fetch metadata for token ${token.mint}:`, err);
        return token; // Return original token if fetch fails
      }
    }));

    console.log('UPDATED TOKEN LIST:',tokensResponse)

    const balanceResponse = await Moralis.SolApi.account.getBalance({
      network: network,
      address: userAddress.trim(),
    });

    const nativeSol = {
      associatedTokenAddress: userAddress.trim(),
      mint: "So11111111111111111111111111111111111111112",
      amountRaw: balanceResponse.raw.lamports,
      amount: balanceResponse.raw.solana,
      decimals: "9",
      name: "Solana",
      symbol: "SOL",
    };

    let tokens = [nativeSol, ...updatedTokens];

    let totalUsdBalance = 0;

    if (network === "mainnet") {
      const tokenPricesPromises = tokens.map(async (token) => {
        try {
          const priceResponse = await Moralis.SolApi.token.getTokenPrice({
            network: network,
            address: token.mint,
          });
          const usdPrice = priceResponse.raw.usdPrice || 0;
          const usdBalance = usdPrice * parseFloat(token.amount);

          totalUsdBalance += usdBalance;

          return {
            ...token,
            price: usdPrice,
            usdbal: usdBalance.toFixed(2),
          };
        } catch (error) {
          console.error(`Error fetching price for token ${token.mint}:`, error);
          return { ...token, price: 0, usdbal: "0.00" };
        }
      });

      tokens = await Promise.all(tokenPricesPromises);
    } else {
      tokens = tokens.map((token) => ({
        ...token, 
        price: 0,
        usdbal: "0",
      }));
    }
   console.log('balance :::',balanceResponse)
    const jsonResponse = {
      tokens: tokens,
      nfts: [],
      balance: balanceResponse.raw.solana,
      usdbalance: totalUsdBalance.toFixed(2),
    };
    console.log(jsonResponse);
    return res.status(200).json(jsonResponse);
   }
   else{
    return res.status(400).json({ message: "Invalid Address" });
   }
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching the tokens." });
  }
});

app.get("/getBalance", async (req, res) => {
  const { wallet, network } = req.query;
  try {
    const tokensResponse = await Moralis.SolApi.account.getSPL({
      network: network,
      address: wallet,
    });

    const balanceResponse = await Moralis.SolApi.account.getBalance({
      network: network,
      address: wallet,
    });

    const nativeSol = {
      associatedTokenAddress: wallet,
      mint: "So11111111111111111111111111111111111111112",
      amountRaw: balanceResponse.raw.lamports,
      amount: balanceResponse.raw.solana,
      decimals: "9",
      name: "Solana",
      symbol: "SOL",
    };

    const tokens = [nativeSol, ...tokensResponse.raw];

    const tokenPricesPromises = tokens.map(async (token) => {
      const priceResponse = await Moralis.SolApi.token.getTokenPrice({
        network: network,
        address: token.mint,
      });

      return {
        mint: token.mint,
        price: priceResponse.raw.usdPrice || 0,
        amount: parseFloat(token.amount),
      };
    });

    const tokenPrices = await Promise.all(tokenPricesPromises);

    const totalBalanceUSD = tokenPrices.reduce((acc, token) => {
      return acc + token.price * token.amount;
    }, 0);

    const jsonResponse = {
      balance: totalBalanceUSD.toFixed(2),
    };

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error fetching balance:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching the balance." });
  }
});

app.get("/getTransactions", async (req, res) => {
  const { userAddress, network } = req.query;
  let apiUrl = "";
  if (network === "mainnet") {
    apiUrl = `https://api-mainnet.helius.xyz/v0/addresses/${userAddress}/transactions?api-key=a40dc3a4-ca63-45d4-b196-7952dd75348f`;
  } else if (network === "devnet") {
    apiUrl = `https://api-devnet.helius.xyz/v0/addresses/${userAddress}/transactions?api-key=a40dc3a4-ca63-45d4-b196-7952dd75348f`;
  } else {
    return res.status(400).json({ error: "Invalid network specified" });
  }
  try {
    const response = await axios.get(apiUrl);
    const transactions = response.data;
    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
});


app.use('/user',userRouter);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
