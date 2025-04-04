const mongoose = require('mongoose');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const decryptData = (encryptedData) => {
  const [ivHex, encryptedHex, authTagHex] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(authTag); // Set auth tag for authentication

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

// Encryption Helper
const encryptData = (data) => {
  const algorithm = 'aes-256-gcm';
  const secretKey = crypto.randomBytes(32); // Store this securely in env
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex'); // Get auth tag

  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
};

// User Schema
const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4, // Generate a UUID for primary key
  },
  username: {
    type: String,
    required: true,
    unique: true,
    default: () => `user${Math.floor(1000 + Math.random() * 9000)}`, // Random username like user9382
  },
  wallets: { 
    type: [String], // Array of wallet addresses
    required: true,
    default: [],
  },
  password: {
    type: String,
    required: true,
    set: encryptData,
  },
  google2FaSecret: {
    type: String,
    required: false,
    // set: encryptData, // Automatically encrypt before saving
  },
  google2FaStatus: {
    type: Boolean,
    default: false,
  },
  transactionPin: {
    type: String,
    required: false,
    default: '',
  },
  txnGoogle2FaStatus: {
    type: Boolean,
    default: false,
  },
  auth2FaStatus: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;
