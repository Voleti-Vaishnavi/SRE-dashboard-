import type { TrendBucket } from "../../types";

export interface TidyPoint {
  bucket: string;
  key: string;
  count: number;
}

/** Flatten {bucket, counts: {k: n}}[] into a tidy long-format array, zero-filling
 * every key in `allKeys` for every bucket so stacked series stay consistent. */
export function flattenBuckets(buckets: TrendBucket[], allKeys: string[]): TidyPoint[] {
  const out: TidyPoint[] = [];
  for (const b of buckets) {
    for (const key of allKeys) {
      out.push({ bucket: b.bucket, key, count: b.counts[key] ?? 0 });
    }
  }
  return out;
}

export function isTrendEmpty(buckets: TrendBucket[] | undefined): boolean {
  if (!buckets || buckets.length === 0) return true;
  return buckets.every((b) => Object.values(b.counts).every((v) => v === 0));
}
