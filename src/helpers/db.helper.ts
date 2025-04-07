import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI as string;
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions); // Cast to ConnectOptions for TypeScript

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1); // Exit process if connection fails
  }
};

export default connectMongoDB;
