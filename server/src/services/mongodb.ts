import mongoose, { Schema, Model, Document } from 'mongoose';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface CacheEntry {
  key: string;
  data: unknown;
  createdAt: Date;
}

interface CacheDocument extends Document, CacheEntry {}

let CacheModel: Model<CacheDocument> | null = null;
let connected = false;
let connecting: Promise<void> | null = null;

export function isConnected(): boolean {
  return connected;
}

export async function connect(): Promise<void> {
  if (connected || connecting) return;
  if (!config.mongodb.uri) {
    logger.warn('MONGODB_URI not set — skipping MongoDB connection');
    return;
  }

  connecting = (async () => {
    try {
      const dbName = config.mongodb.dbName || 'tradeai';
      await mongoose.connect(config.mongodb.uri!, { dbName });
      connected = true;

      const cacheSchema = new Schema<CacheDocument>({
        key: { type: String, required: true, unique: true, index: true },
        data: { type: Schema.Types.Mixed, required: true },
        createdAt: { type: Date, default: Date.now },
      });

      const ttlSeconds = config.mongodb.ttlSeconds || 3600;
      cacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: ttlSeconds });

      CacheModel = mongoose.model<CacheDocument>('CacheEntry', cacheSchema);
      logger.info({ dbName, ttlSeconds }, 'MongoDB connected');
    } catch (err) {
      logger.warn({ err }, 'MongoDB connection failed — continuing without persistence');
      connected = false;
    } finally {
      connecting = null;
    }
  })();

  await connecting;
}

export async function get<T>(key: string): Promise<T | null> {
  if (!connected || !CacheModel) return null;
  try {
    const entry = await CacheModel.findOne({ key }).lean();
    if (!entry) return null;
    return (entry as any).data as T;
  } catch {
    return null;
  }
}

export async function set(key: string, data: unknown): Promise<void> {
  if (!connected || !CacheModel) return;
  try {
    await CacheModel.findOneAndUpdate(
      { key },
      { key, data, createdAt: new Date() },
      { upsert: true, new: true },
    );
  } catch {
    // silently fail — cache is optional
  }
}
