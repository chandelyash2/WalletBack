import mongoose, { Schema, Document } from 'mongoose';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = crypto.randomBytes(32); // Ideally, load this from environment variables

// TypeScript interface for User document
export interface IUser extends Document {
    _id: string;
    username: string;
    wallets: string[];
    password: string;
    google2FaSecret?: string;
    google2FaStatus: boolean;
    transactionPin?: string;
    txnGoogle2FaStatus: boolean;
    auth2FaStatus: boolean;
}

// 🔐 Decrypt function
const decryptData = (encryptedData: string): string => {
    const [ivHex, encryptedHex, authTagHex] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText).toString('utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};


// 🔒 Encrypt function
const encryptData = (data: string): string => {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
};

// 🧬 User Schema
const UserSchema: Schema = new Schema<IUser>(
    {
        _id: {
            type: String,
            default: uuidv4,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            default: () => `user${Math.floor(1000 + Math.random() * 9000)}`,
        },
        wallets: {
            type: [String],
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
            // set: encryptData, // Uncomment to auto-encrypt
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
    },
    { timestamps: true }
);

const User = mongoose.model<IUser>('user', UserSchema);

export { User, encryptData, decryptData };
