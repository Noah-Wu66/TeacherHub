import { MongoClient, Db, GridFSBucket } from "mongodb";

const uri = process.env.MONGO_URI;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let transactionSupport: boolean | null = null;

// GridFS Bucket 缓存
const gridFSBuckets: Map<string, GridFSBucket> = new Map();

export async function getDb(): Promise<Db> {
  if (!uri) {
    throw new Error("缺少 MongoDB 连接字符串，请在环境变量 MONGO_URI 中配置。");
  }
  if (cachedDb && cachedClient) {
    try {
      await cachedDb.admin().ping();
      return cachedDb;
    } catch {
      cachedClient = null;
      cachedDb = null;
      transactionSupport = null;
    }
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    await cachedClient.connect();
  } catch (error) {
    cachedClient = null;
    throw error;
  }

  cachedDb = cachedClient.db();
  return cachedDb;
}

export async function supportsTransactions(): Promise<boolean> {
  if (transactionSupport !== null) {
    return transactionSupport;
  }

  try {
    const db = await getDb();
    const admin = db.admin();
    const serverInfo = await admin.serverInfo();

    const version = serverInfo.version;
    const majorVersion = parseInt(version.split('.')[0]);

    if (majorVersion < 4) {
      transactionSupport = false;
      return false;
    }

    const isMaster = await admin.command({ isMaster: 1 });
    const isReplicaSet = !!(isMaster.setName || isMaster.msg === 'isdbgrid');

    transactionSupport = isReplicaSet;

    return transactionSupport;
  } catch {
    transactionSupport = false;
    return false;
  }
}

export async function getCollection(name: string) {
  const db = await getDb();
  return db.collection(name);
}

export async function closeMongoClient() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    transactionSupport = null;
    gridFSBuckets.clear();
  }
}

/**
 * 获取 GridFS Bucket 实例
 * @param bucketName bucket 名称，默认为 'media'
 * @param chunkSizeBytes 分块大小，默认为 1MB
 */
export async function getGridFSBucket(
  bucketName = 'media',
  chunkSizeBytes = 1024 * 1024
): Promise<GridFSBucket> {
  const cacheKey = `${bucketName}_${chunkSizeBytes}`;

  if (gridFSBuckets.has(cacheKey)) {
    return gridFSBuckets.get(cacheKey)!;
  }

  const db = await getDb();
  const bucket = new GridFSBucket(db, {
    bucketName,
    chunkSizeBytes,
  });

  gridFSBuckets.set(cacheKey, bucket);
  return bucket;
}

