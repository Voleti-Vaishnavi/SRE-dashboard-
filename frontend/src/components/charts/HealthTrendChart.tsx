import { Column } from "@ant-design/plots";
import { HEALTH_COLORS } from "../../theme/colors";
import { entityTooltipItems, flattenBuckets } from "./chartUtils";
import type { HealthStatus, TrendBucket } from "../../types";

const ORDER: HealthStatus[] = ["Green", "Amber", "Red", "No Data"];

export interface HealthTrendChartProps {
  buckets: TrendBucket[];
}

export function HealthTrendChart({ buckets }: HealthTrendChartProps) {
  const data = flattenBuckets(buckets, ORDER);

  return (
    <Column
      data={data}
      xField="bucket"
      yField="count"
      colorField="key"
      stack
      scale={{
        color: { type: "ordinal", domain: ORDER, range: ORDER.map((s) => HEALTH_COLORS[s]) },
      }}
      axis={{ x: { labelAutoRotate: true } }}
      legend={{ color: { position: "bottom", layout: { justifyContent: "center" } } }}
      tooltip={{ items: entityTooltipItems("count", "Applications") }}
      autoFit
    />
  );
}
