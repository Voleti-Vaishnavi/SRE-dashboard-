import { Pie } from "@ant-design/plots";
import { HEALTH_COLORS } from "../../theme/colors";
import type { HealthStatus } from "../../types";

const ORDER: HealthStatus[] = ["Green", "Amber", "Red", "No Data"];

export interface HealthDonutProps {
  counts: Record<string, number>;
}

export function HealthDonut({ counts }: HealthDonutProps) {
  const data = ORDER.filter((status) => (counts[status] ?? 0) > 0).map((status) => ({
    status,
    value: counts[status] ?? 0,
  }));

  return (
    <Pie
      data={data}
      angleField="value"
      colorField="status"
      innerRadius={0.6}
      scale={{
        color: { type: "ordinal", domain: ORDER, range: ORDER.map((s) => HEALTH_COLORS[s]) },
      }}
      label={{ text: "value", style: { fontWeight: 600 } }}
      legend={{ color: { position: "bottom", layout: { justifyContent: "center" } } }}
      autoFit
    />
  );
}
