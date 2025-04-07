import * as express from 'express';
import { ResponseHelper, SolanaHelper } from '../../helpers';
import userHelper from './user.helper';
import { GenericError } from 'interfaces/responses.interface';
import { User } from '../../models/user.model';
import * as bs58 from 'bs58';
import moralisHelper from '../../helpers/moralis.helper';
import TwoFAHelper from "../../helpers/2fa.helper";
import { SolanaToken } from './user.interface';

const setResponse = ResponseHelper;

class UserMiddleware {


  generateNewWallet = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const wallet = await userHelper.generateWallet();
      if (!wallet) {
        throw {
          field: 'generate_wallet',
          message: 'Failed to generate wallet'
        }
      }

      req.body.result = {
        message: 'New wallet generated successfully',
        data: wallet
      }
      next();
    } catch (error) {
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }


  isUserExist = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { walletAddress } = req.body;
      const wallet = await userHelper.findOne(walletAddress);
      if (wallet) {
        throw {
          field: 'user_exist',
          message: 'user already exist'
        }
      }
      else {
        next();
      }
    } catch (error) {
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }


  createUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { walletAddress, password, username } = req.body;
      const wallet = await userHelper.createOne(walletAddress, password, username);
      if (!wallet) {
        throw {
          field: 'error_user_creation',
          message: 'Failed to create wallet'
        }
      }
      else {
        req.body.result = {
          message: 'New user created successfully',
          data: wallet
        }
        next();
      }
    } catch (error) {
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }

  recoverWalletByPhrase = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let walletsArr = []
    try {
      const { secretPhrase, password } = req.body;
      const wallet = await SolanaHelper.recoverWalletFromSecretPhrase(secretPhrase);
      if (!wallet) {
        throw {
          field: 'error_secret_phrase',
          message: 'Invalid secret phrase'
        }
      }
      else {
        const user = await userHelper.findOne(wallet?.publicKey);
        if (user) {
          req.body.result = {
            message: 'Wallet recovered successfully',
            data: {
              user: user,
              privateKeyArr: wallet?.privateKeyArr,
              secretPhrase: wallet?.secretPhrase,
              privateKey: wallet?.privateKey,
              publicKey: wallet?.publicKey,
            },
          }
        } else {
          walletsArr.push(wallet?.publicKey);
          const userCreated = await User.create({
            wallets: walletsArr,
            password: password,
          });
          if (userCreated) {
            res.status(200).send({
              message: 'wallet recovered successfully',
              data: {
                user: user,
                privateKeyArr: wallet?.privateKeyArr,
                secretPhrase: wallet?.secretPhrase,
                privateKey: wallet?.privateKey,
                publicKey: wallet?.publicKey,
              },
            });
          } else {
            throw {
              field: 'error_operation',
              message: 'Error in performing operation'
            }
          }
        }
      }
      next();
    } catch (error) {
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }


  updateUsername = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { walletAddress, username } = req.body;
      const user = await User.findOne({ wallets : walletAddress });
      if (!user) {
        throw {
          field: 'error_user_found',
          message: 'User not exist'
        }
      }
      else {
        user.username = username;
        await user.save();
        req.body.result = {
          message: 'username updated successfully',
          data: user
        }
        next();
      }
    } catch (error) {
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }

 recoverByPrivateKey = async (
    req: express.Request, res: express.Response, next: express.NextFunction
  ) => {
    try {
      let user;
      let walletsArr = [];
      let secretKey = null;
  
      const { privateKey, password } = req.body;
  
      if (typeof privateKey !== "string" || !/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(privateKey)) {
        throw {
          message : "Invalid Base58 characters detected",
          field: 'error_invalid_private_key'
        }
      }
  
      try {
        secretKey = bs58.decode(privateKey);
        console.log('secretKey',secretKey);
      } catch (err) {
        throw {
          message : "Invalid Base58 characters detected",
          field: 'error_invalid_private_key'
        }
      }
  
      if (secretKey.length !== 64) {
        throw {
          message : "Invalid private key length",
          field: 'error_invalid_private_key'
        }
      }
  
      console.log("Decoded Secret Key:", secretKey);
  
      const wallet = await SolanaHelper.recoverWalletByPrivateKey(privateKey);
      if (!wallet) {
         throw {
          message : " Failed to recover wallet",
          field: 'error_recover_wallet'
        }
      }
  
      user = await User.findOne({ wallets: wallet?.publicKey });
       
      if (user) {
        req.body.result = {
          message: 'Wallet recovered successfully',
          data: {
            user: user,
            privateKeyArr: wallet?.privateKeyArr,
            privateKey: wallet?.privateKey,
            publicKey: wallet?.publicKey,
          },
        }
      } else {
        walletsArr.push(wallet?.publicKey);
        const userCreated = await User.create({
          wallets: walletsArr,
          password: password,
        });
        if (userCreated) {
          res.status(200).send({
            message: 'wallet recovered successfully',
            data: {
              user: user,
              privateKeyArr: wallet?.privateKeyArr,
              privateKey: wallet?.privateKey,
              publicKey: wallet?.publicKey,
            },
          });
        } else {
          throw {
            field: 'error_operation',
            message: 'Error in performing operation'
          }
        }
      }
      next();
    } catch (error) {
      console.error("Error recovering wallet:", error);
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }


  getUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { walletAddress } = req.body;
      const user = await userHelper.findOne(walletAddress);
      if (!user) {
        throw {
          field: 'user_exist',
          message: 'user not exist'
        }
      }
      else {
        req.body.result = {
          message : 'User found successfully',
          data : user
        }
        next();
      }
    } catch (error) {
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }


  getTokens = async (req: express.Request, res: express.Response,next:express.NextFunction) => {
  
    try {
      const { walletAddress, network } = req.body ;
      const tokensResponse = await moralisHelper.getTokens(walletAddress,network);
  
      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          "X-API-Key": process.env.MORALIS_API_KEY ?? "",
        },
      };
  
      const updatedTokens: SolanaToken[] = await Promise.all(
        tokensResponse.raw.map(async (token: any) => {
          try {
            const response = await fetch(
              `https://solana-gateway.moralis.io/token/${network}/${token.mint}/metadata`,
              options
            );
  
            if (!response.ok) {
              throw new Error(
                `Error fetching data for token ${token.mint}: ${response.statusText}`
              );
            }
  
            const metadata = await response.json();
            return { ...token, metadata };
          } catch (err) {
            console.error(`Failed to fetch metadata for token ${token.mint}:`, err);
            return token;
          }
        })
      );
  
      const balanceResponse = await moralisHelper.getBalance(walletAddress,network);
  
      const nativeSol: SolanaToken = {
        associatedTokenAddress: walletAddress.trim(),
        mint: "So11111111111111111111111111111111111111112",
        amountRaw: balanceResponse.raw.lamports,
        amount: balanceResponse.raw.solana,
        decimals: "9",
        name: "Solana",
        symbol: "SOL",
      };
  
      let tokens: SolanaToken[] = [nativeSol, ...updatedTokens];
      let totalUsdBalance = 0;
  
      if (network === "mainnet") {
        tokens = await Promise.all(
          tokens.map(async (token) => {
            try {
              const priceResponse = await moralisHelper.getTokenPrice(network,token);
              const usdPrice = priceResponse.raw.usdPrice ?? 0;
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
          })
        );
      } else {
        tokens = tokens.map((token) => ({
          ...token,
          price: 0,
          usdbal: "0",
        }));
      }
  
      const jsonResponse = {
        tokens,
        nfts: [],
        balance: balanceResponse.raw.solana,
        usdbalance: totalUsdBalance.toFixed(2),
      };
      
      req.body.result = {
        message : '' , 
        data : jsonResponse
      }
      next();
    } catch (error) {
      console.error("Error fetching tokens:", error);
      return res
        .status(500)
        .json({ error: "An error occurred while fetching the tokens." });
    }
  }


  setPin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { walletAddress, pin } = req.body;
      const user = await userHelper.findOne(walletAddress);
      if (!user) {
        throw {
          field: 'error_user_found',
          message: 'User not exist'
        }
      }
      else {
        user.transactionPin = pin;
        await user.save();
        req.body.result = {
          message: 'Transaction pin setup successfully',
          data: user
        }
        next();
      }
    } catch (error) {
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }


  generate2FA = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
  
      const twoFA = await TwoFAHelper.generate2FA();
      if (!twoFA) {
        throw {
          field: 'error_generate_2fa',
          message: 'Error while generating 2FA'
        }
      }
      else {
        req.body.result = {
          message: 'Transaction pin setup successfully',
          data: twoFA
        }
        next();
      }
    } catch (error) {
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }


  verify2FA = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
  
      const { token, userSecret, walletAddress } = req.body;

      
      const isVerified = await TwoFAHelper.verify2FA(token,userSecret);
      if (!isVerified) {
        throw {
          field: 'error_generate_2fa',
          message: 'Invalid 2FA code'
        }
      }
      else {
        if (isVerified) {
          const user = await userHelper.findOne(walletAddress);
          if (!user) throw{
            message : 'User not found',
            field : 'user_not_found'
          }
          user.google2FaSecret = userSecret;
          user.google2FaStatus = true;
          await user.save();
          req.body.result = {
            message : '2FA enabled successfully',
            data : {}
          }
        }
        next();
      }
    } catch (error) {
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }


  validate2FA = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
  
      const { token ,walletAddress } = req.body;

      const user = await userHelper.findOne(walletAddress);

      if (!user.google2FaStatus) {
        throw {
          message : '2FA is not enabled for this user',
          field:'error_validate_2fa'
        }
      }
      
      const isVerified = await TwoFAHelper.validate2FaCode(user,token);
      if (!isVerified) {
        throw {
          field: 'error_generate_2fa',
          message: 'Invalid 2FA code'
        }
      }
      else {
        if (isVerified) {
          req.body.result = {
            message : 'Login successful with 2FA',
            data : {}
          }
        }
        next();
      }
    } catch (error) {
      return setResponse.error400(req, res, {
        error: error as GenericError,
      });
    }
  }

}

export default new UserMiddleware();
