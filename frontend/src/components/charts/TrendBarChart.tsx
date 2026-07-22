import { Column } from "@ant-design/plots";
import { entityTooltipItems, flattenBuckets } from "./chartUtils";
import type { TrendBucket } from "../../types";

export interface TrendBarChartProps {
  buckets: TrendBucket[];
  order: string[];
  colorMap: Record<string, string>;
  entityLabel?: string;
}

/** Stacked column chart for status composition per period bucket — used where
 * a multi-series line chart would be too visually busy for the available
 * space (e.g. compact monitoring-category cards). */
export function TrendBarChart({ buckets, order, colorMap, entityLabel = "Contributors" }: TrendBarChartProps) {
  const data = flattenBuckets(buckets, order);

  return (
    <Column
      data={data}
      xField="bucket"
      yField="count"
      colorField="key"
      stack
      scale={{
        color: { type: "ordinal", domain: order, range: order.map((k) => colorMap[k]) },
      }}
      axis={{ x: { labelAutoRotate: true } }}
      legend={{ color: { position: "bottom", layout: { justifyContent: "center" } } }}
      tooltip={{ items: entityTooltipItems("count", entityLabel) }}
      autoFit
    />
  );
}
