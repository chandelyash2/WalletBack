const bip39 = require('bip39');
const { Keypair } = require('@solana/web3.js');
const { derivePath } = require('ed25519-hd-key');
const bs58 = require('bs58');

const generateWalletAddress = async () => {
  const newMnemonic = bip39.generateMnemonic();
  console.log('newMnemonic', newMnemonic);
  const seed = await bip39.mnemonicToSeed(newMnemonic);
  console.log('seed', JSON.stringify(seed));
  console.log('see string', seed.toString('hex'));
  const derived = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
  const keypair = Keypair.fromSeed(derived);
  console.log('keypair', keypair.secretKey);
  const secretKey = bs58.encode(keypair.secretKey);
  console.log('secretPhrase', secretKey);
  const publicKey = keypair.publicKey.toBase58();

  return {
    privateKeyArr: keypair?.secretKey,
    secretPhrase: newMnemonic,
    privateKey: secretKey,
    publicKey: publicKey,
  };
};

const recoverWallet = async (secretPhrase) => {
  console.log('got secret phrase : ', secretPhrase);
  if (secretPhrase) {
    const seed = await bip39.mnemonicToSeed(secretPhrase.trim());
    console.log('seed', JSON.stringify(seed));
    console.log('see string', seed.toString('hex'));
    const derived = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derived);
    console.log('keypair', keypair.secretKey);
    const secretKey = bs58.encode(keypair.secretKey);
    console.log('secretPhrase', secretKey);
    const publicKey = keypair.publicKey.toBase58();
    return {
      privateKeyArr: keypair?.secretKey,
      secretPhrase: secretPhrase,
      privateKey: secretKey,
      publicKey: publicKey,
    };
  } else {
    return;
  }
};

const recoverWalletByPrivateKey = async (privateKey) => {
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

module.exports = {
  generateWalletAddress,
  recoverWallet,
  recoverWalletByPrivateKey
};
