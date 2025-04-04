const express = require('express');
const User = require('../model/user.model');
const {
  generateWalletAddress,
  recoverWallet,
  recoverWalletByPrivateKey,
} = require('./solana.helper');
const { generate2FA, verify2FA, validate2FaCode } = require('./2fa.helper');
const base58 = require('bs58');

const userRouter = express.Router();

userRouter.post('/create-wallet', async (req, res) => {
  try {
    let walletsArr = [];
    let user;
    const {
      publicKey: walletAddress,
      privateKeyArr,
      secretPhrase,
      privateKey,
    } = await generateWalletAddress();
    const { userId, password } = req.body;
    console.log('walletAddress', walletAddress);
    if (!walletAddress) {
      console.log('wallet address not generated');
    }

    // 1️⃣ **Check if the wallet already exists in any user**
    user = await User.findOne({ wallets: walletAddress });

    if (user) {
      return res.json({ message: 'Wallet already linked to an account', user });
    }

    // 2️⃣ **If userId is provided, check if user exists**
    if (userId) {
      user = await User.findById({ _id: userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Add the new wallet address to the user's wallets array
      user.wallets.push(walletAddress);
      await user.save();
      return res.json({ message: 'Wallet added to existing user', user });
    }

    walletsArr.push(walletAddress);
    // 3️⃣ **If no user exists, create a new one**
    const newUser = await User.create({
      wallets: walletsArr,
      password: password,
    });

    return res.status(201).json({
      message: 'New user created',
      data: {
        user: newUser,
        privateKeyArr,
        secretPhrase,
        privateKey,
        walletAddress,
      },
    });
  } catch (error) {
    console.log('error creating wallet:', error);
    res.status(500).json({ message: 'Error handling wallet', error });
  }
});

userRouter.post('/recover-wallet', async (req, res) => {
  try {
    let user;
    let walletsArr = [];
    const { secretPhrase, password } = req.body;
    console.log('got secret phrase : ', secretPhrase);
    const response = await recoverWallet(secretPhrase);
    if (!response) {
      throw new Error('secret phrase not found');
    }

    user = await User.findOne({ wallets: response?.publicKey });

    if (user) {
      res.status(200).send({
        message: 'wallet recovered successfully',
        data: {
          user: user,
          privateKeyArr: response.privateKeyArr,
          secretPhrase: response.secretPhrase,
          privateKey: response.privateKey,
          publicKey: response.publicKey,
        },
      });
    } else {
      walletsArr.push(response.publicKey);
      const newUser = await User.create({
        wallets: walletsArr,
        password: password,
      });
      if (newUser) {
        res.status(200).send({
          message: 'wallet recovered successfully',
          data: {
            user: user,
            privateKeyArr: response.privateKeyArr,
            secretPhrase: response.secretPhrase,
            privateKey: response.privateKey,
            publicKey: response.publicKey,
          },
        });
      } else {
        res.status(500).json({ error: 'Failed to recover wallet' });
      }
    }
  } catch (error) {
    console.log('error recovering wallet:', error);
    res.status(500).json({ error: 'Failed to recover wallet' });
  }
});

userRouter.post("/recover-by-privatekey", async (req, res) => {
  try {
    let user;
    let walletsArr = [];
    let secretKey = "";

    const { privateKey, password } = req.body;

    if (!privateKey) {
      return res.status(400).send({ status: 400, message: "Private key is required" });
    }
    if (!password) {
      return res.status(400).send({ status: 400, message: "Password is required" });
    }

    if (typeof privateKey !== "string" || !/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(privateKey)) {
      return res.status(400).send({
        status: 400,
        data: { isValid: false },
        message: "Invalid Base58 characters detected",
      });
    }

    try {
      secretKey = base58.decode(privateKey);
    } catch (err) {
      return res.status(400).send({
        status: 400,
        data: { isValid: false },
        message: "Invalid Base58 format",
      });
    }

    if (secretKey.length !== 64) {
      return res.status(400).send({
        status: 400,
        data: { isValid: false },
        message: "Invalid private key length",
      });
    }

    console.log("Decoded Secret Key:", secretKey);

    const response = await recoverWalletByPrivateKey(privateKey);
    if (!response) {
      throw new Error("Wallet not recovered");
    }

    user = await User.findOne({ wallets: response?.publicKey });
    if (user) {
      return res.status(200).send({
        status: 200,
        message: "Wallet recovered successfully",
        data: {
          user,
          privateKeyArr: response.privateKeyArr,
          privateKey: response.privateKey,
          publicKey: response.publicKey,
        },
      });
    }

    walletsArr.push(response.publicKey);
    const newUser = await User.create({
      wallets: walletsArr,
      password: password,
    });

    if (newUser) {
      return res.status(201).send({
        status: 201,
        message: "Wallet recovered successfully",
        data: {
          user: newUser,
          privateKeyArr: response.privateKeyArr,
          privateKey: response.privateKey,
          publicKey: response.publicKey,
        },
      });
    } else {
      return res.status(400).send({ error: "Invalid private key" });
    }
  } catch (error) {
    console.error("Error recovering wallet:", error);
    return res.status(500).send({ error: "Server error while recovering wallet" });
  }
});

userRouter.get('/profile/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    const user = await User.findOne({ wallets: walletAddress });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User profile retrieved', user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile', error });
  }
});

userRouter.post('/set-transaction-pin', async (req, res) => {
  try {
    const { walletAddress, transactionPin } = req.body;

    if (!walletAddress || !transactionPin) {
      return res
        .status(400)
        .json({ message: 'Wallet address and transaction PIN are required' });
    }

    const user = await User.findOne({ wallets: walletAddress });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.transactionPin = transactionPin;
    await user.save();

    res.json({ message: 'Transaction PIN set successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error setting transaction PIN', error: error.message });
  }
});

userRouter.post('/generate-2fa', async (req, res) => {
  try {
    const result = await generate2FA();
    if (!result) {
      return res.status(404).json({ message: 'Error generating 2FA Qr Code' });
    }
    res.json({ message: 'QrCode generated successfully', data: result });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error generating 2FA Qr Code', error: error.message });
  }
});

userRouter.post('/verify-2fa', verify2FA);

userRouter.post('/validate-2fa', validate2FaCode);

userRouter.post('/update-profile', async (req, res) => {
  try {
    let user = null;
    const { walletAddress, username } = req.body;
    console.log('walletAddress', walletAddress, username);
    if (!walletAddress || !username) {
      console.log('Wallet adress and username is required');
    }

    user = await User.findOne({ wallets: walletAddress });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username;
    await user.save();
    return res.status(200).json({
      message: 'User profile updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    console.log('error updating user profile:', error);
    res.status(500).json({ message: 'Error updating user profile', error });
  }
});

module.exports = userRouter;
