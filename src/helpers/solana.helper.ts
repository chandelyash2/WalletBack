import * as bip39 from 'bip39';
import {derivePath} from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js'
import * as bs58 from 'bs58';

const generateWalletAddress = async () => {
    const newMnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(newMnemonic);
    const derived = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derived);
    const secretKey = bs58.encode(keypair.secretKey);
    const publicKey = keypair.publicKey.toBase58();
  
    return {
      privateKeyArr: keypair?.secretKey,
      secretPhrase: newMnemonic,
      privateKey: secretKey,
      publicKey: publicKey,
    };
  };


  const recoverWalletFromSecretPhrase = async (secretPhrase:string) => {
    if (secretPhrase) {
      const seed = await bip39.mnemonicToSeed(secretPhrase.trim());
      const derived = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
      const keypair = Keypair.fromSeed(derived);
      const secretKey = bs58.encode(keypair.secretKey);
      const publicKey = keypair.publicKey.toBase58();
      return {
        privateKeyArr: keypair?.secretKey,
        secretPhrase: secretPhrase,
        privateKey: secretKey,
        publicKey: publicKey,
      };
    } else {
      return false;
    }
  };


  const recoverWalletByPrivateKey = async (privateKey:string) => {
    try {
      if (privateKey) {
        const privateKeyBase58 = privateKey;
        const privateKeyUint8Array = bs58.decode(privateKeyBase58);
        const keypair = Keypair.fromSecretKey(privateKeyUint8Array);
  
        console.log('Public Key:', keypair.publicKey.toBase58());
        console.log('Private Key Uint8Array:', keypair.secretKey);
        return {
          privateKeyArr: keypair?.secretKey,
          privateKey: privateKey,
          publicKey: keypair.publicKey.toBase58(),
        };
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error in recover by private key >>:', error);
      return false;
    }
  };


  export {
    generateWalletAddress,
    recoverWalletFromSecretPhrase,
    recoverWalletByPrivateKey
  }