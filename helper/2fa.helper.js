const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../model/user.model');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const decryptData = (encryptedData) => {
  const [ivHex, encryptedHex, authTagHex] = encryptedData.split(':');
  const algorithm = 'aes-256-gcm';
  const secretKey = crypto.randomBytes(32); // Store this securely in env
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  decipher.setAuthTag(authTag); // Set auth tag for authentication

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

const generate2FA = async (req, res) => {
  try {
    const secret = await speakeasy.generateSecret({
      name: 'MarvelX',
    });
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    console.log('qrCodeUrl', qrCodeUrl);
    return { secret: secret.base32, qrCodeUrl };
  } catch (error) {
    console.log('error generating 2fa qr url:', error);
    return false;
  }
};

const verify2FA = async (req, res) => {
  try {
    const { token, userSecret, walletAddress } = req.body;
    console.log(
      'token, userSecret,walletAddress',
      token,
      userSecret,
      walletAddress
    );
    const isVerified = speakeasy.totp.verify({
      secret: userSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    console.log('isVerified', isVerified);

    if (isVerified) {
      const user = await User.findOne({ wallets: walletAddress });
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.google2FaSecret = userSecret;
      user.google2FaStatus = true;
      await user.save();
      res.status(200).json({ message: '2FA enabled successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }
  } catch (error) {
    console.log('error', error);
    res
      .status(500)
      .json({ message: 'Error verifying 2FA', error: error.message });
  }
};

const validate2FaCode = async (req, res) => {
  try {
    const { walletAddress, token } = req.body;
    console.log(' walletAddress, token', walletAddress, token);
    const user = await User.findOne({ wallets: walletAddress });

    console.log(' user', user);

    if (!user || !user.google2FaStatus) {
      return res
        .status(403)
        .json({ message: '2FA is not enabled for this user' });
    }
    console.log('user.google2FaSecret', user?.google2FaSecret);

    let secret  = user?.google2FaSecret;
    console.log('secret',secret)
    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token,
      window: 1,
    });
    console.log('isValid', isValid);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid 2FA code' });
    }
    res.status(200).json({ message: 'Login successful with 2FA' });
  } catch (error) {
    console.log('error in validate 2FA:', error);
    res
      .status(500)
      .json({ message: 'Error verifying 2FA on login', error: error.message });
  }
};

module.exports = { generate2FA, verify2FA, validate2FaCode };
