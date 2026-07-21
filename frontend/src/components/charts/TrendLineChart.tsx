import { Line } from "@ant-design/plots";
import { flattenBuckets } from "./chartUtils";
import type { TrendBucket } from "../../types";

export interface TrendLineChartProps {
  buckets: TrendBucket[];
  order: string[];
  colorMap: Record<string, string>;
}

export function TrendLineChart({ buckets, order, colorMap }: TrendLineChartProps) {
  const data = flattenBuckets(buckets, order);

  return (
    <Line
      data={data}
      xField="bucket"
      yField="count"
      colorField="key"
      shapeField="smooth"
      scale={{
        color: { type: "ordinal", domain: order, range: order.map((k) => colorMap[k]) },
      }}
      point={{ shapeField: "circle", sizeField: 4 }}
      axis={{ x: { labelAutoRotate: true } }}
      legend={{ color: { position: "bottom", layout: { justifyContent: "center" } } }}
      autoFit
    />
  );
}
