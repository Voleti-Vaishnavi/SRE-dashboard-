import { Pie } from "@ant-design/plots";
import { entityTooltipItems } from "./chartUtils";

export interface StatusDonutProps {
  counts: Record<string, number>;
  order: string[];
  colorMap: Record<string, string>;
  entities?: Record<string, string[]>;
  entityLabel?: string;
}

export function StatusDonut({
  counts,
  order,
  colorMap,
  entities,
  entityLabel = "Applications",
}: StatusDonutProps) {
  const data = order
    .filter((key) => (counts[key] ?? 0) > 0)
    .map((key) => ({ status: key, value: counts[key] ?? 0, entities: entities?.[key] ?? [] }));

  return (
    <Pie
      data={data}
      angleField="value"
      colorField="status"
      innerRadius={0.6}
      scale={{
        color: { type: "ordinal", domain: order, range: order.map((k) => colorMap[k]) },
      }}
      label={{ text: "value", style: { fontWeight: 600 } }}
      legend={{ color: { position: "bottom", layout: { justifyContent: "center" } } }}
      tooltip={{ items: entityTooltipItems("value", entityLabel) }}
      autoFit
    />
  );
}
