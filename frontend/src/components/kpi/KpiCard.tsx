import { Card, Statistic } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { STATUS_COLORS } from "../../theme/colors";

export interface KpiCardProps {
  title: string;
  value: number;
  suffix?: string;
  precision?: number;
  delta?: number;
  deltaGoodDirection?: "up" | "down";
}

export function KpiCard({
  title,
  value,
  suffix,
  precision = 0,
  delta,
  deltaGoodDirection = "up",
}: KpiCardProps) {
  const hasDelta = delta !== undefined && delta !== null && !Number.isNaN(delta);
  const isGood = hasDelta && (deltaGoodDirection === "up" ? delta! >= 0 : delta! <= 0);

  return (
    <Card size="small">
      <Statistic title={title} value={value} precision={precision} suffix={suffix} />
      {hasDelta && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: isGood ? STATUS_COLORS.good : STATUS_COLORS.critical,
          }}
        >
          {delta! >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(delta!).toFixed(1)}
          {suffix ?? ""} vs previous period
        </div>
      )}
    </Card>
  );
}
