import { getCollection } from "@/lib/ai-education/mongodb";
import { COLLECTIONS, USAGE_STATS_FIELDS } from "@/lib/ai-education/models";

function normalizeUserId(userId: any): string {
  if (!userId) return "";
  return typeof userId === "string" ? userId : String(userId);
}

export async function incrementUsageCount(userId: any, model: string) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId || !model) return;

  const collection = await getCollection(COLLECTIONS.usageStats);
  const now = new Date();

  await collection.updateOne(
    {
      [USAGE_STATS_FIELDS.userId]: normalizedUserId,
      [USAGE_STATS_FIELDS.model]: model,
    },
    {
      $inc: { [USAGE_STATS_FIELDS.count]: 1 },
      $set: { [USAGE_STATS_FIELDS.updatedAt]: now },
      $setOnInsert: {
        [USAGE_STATS_FIELDS.createdAt]: now,
      },
    },
    { upsert: true }
  );
}

export async function getUserUsageStats(userId: any) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) return [];

  const collection = await getCollection(COLLECTIONS.usageStats);
  const list = await collection
    .find({
      [USAGE_STATS_FIELDS.userId]: normalizedUserId,
    })
    .toArray();

  return Array.isArray(list) ? list : [];
}

export async function getAllUsageStats() {
  const collection = await getCollection(COLLECTIONS.usageStats);
  const list = await collection.find({}).toArray();
  return Array.isArray(list) ? list : [];
}

