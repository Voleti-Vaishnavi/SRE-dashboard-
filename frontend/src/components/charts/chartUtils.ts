import type { Granularity, TrendBucket } from "../../types";

const GRANULARITY_PERIOD_LABEL: Record<Granularity, string> = {
  daily: "Day",
  weekly: "Week",
  monthly: "Month",
  yearly: "Year",
};

/** "Latest Day" / "Latest Week" / "Latest Month" / "Latest Year" depending on
 * the currently selected granularity, for snapshot-style chart titles. */
export function latestPeriodLabel(granularity: Granularity): string {
  return `Latest ${GRANULARITY_PERIOD_LABEL[granularity]}`;
}

export interface TidyPoint {
  bucket: string;
  key: string;
  count: number;
  entities: string[];
}

/** Flatten {bucket, counts: {k: n}, entities: {k: [...]}}[] into a tidy long-format
 * array, zero-filling every key in `allKeys` for every bucket so stacked series
 * stay consistent. Carries the contributing entity names through per point, for
 * tooltip drill-down ("which applications/jobs caused this count"). */
export function flattenBuckets(buckets: TrendBucket[], allKeys: string[]): TidyPoint[] {
  const out: TidyPoint[] = [];
  for (const b of buckets) {
    for (const key of allKeys) {
      out.push({
        bucket: b.bucket,
        key,
        count: b.counts[key] ?? 0,
        entities: b.entities?.[key] ?? [],
      });
    }
  }
  return out;
}

export function isTrendEmpty(buckets: TrendBucket[] | undefined): boolean {
  if (!buckets || buckets.length === 0) return true;
  return buckets.every((b) => Object.values(b.counts).every((v) => v === 0));
}

/** Renders a contributing-entity list for tooltips, truncated so a bucket with
 * many applications/jobs doesn't produce an unreadably long tooltip. */
export function formatEntityList(names: string[] | undefined, max = 6): string {
  if (!names || names.length === 0) return "—";
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")}, +${names.length - max} more`;
}

/** A tooltip items config (for @ant-design/plots' `tooltip` prop) that shows the
 * raw count plus the list of contributing entities, reading both off the datum
 * itself (so it works whether the count field is named "count" or "value"). */
export function entityTooltipItems(countField: string, entityLabel: string) {
  return [
    { field: countField, name: "Count" },
    { name: entityLabel, value: (d: { entities?: string[] }) => formatEntityList(d.entities) },
  ];
}
