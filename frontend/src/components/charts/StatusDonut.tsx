import { Pie } from "@ant-design/plots";

export interface StatusDonutProps {
  counts: Record<string, number>;
  order: string[];
  colorMap: Record<string, string>;
}

export function StatusDonut({ counts, order, colorMap }: StatusDonutProps) {
  const data = order
    .filter((key) => (counts[key] ?? 0) > 0)
    .map((key) => ({ status: key, value: counts[key] ?? 0 }));

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
      autoFit
    />
  );
}
