import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// 利用 global 缓存连接，避免 Serverless 环境下重复连接
const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache
}

const cached: MongooseCache = globalWithMongoose.mongoose ?? { conn: null, promise: null }

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cached
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  const uri = process.env.MONGO_URI
  if (!uri) {
    throw new Error('请在环境变量中设置 MONGO_URI')
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
