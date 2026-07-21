import type { ReactNode } from "react";
import { Card, Empty, Spin } from "antd";

export interface ChartCardProps {
  title: string;
  loading?: boolean;
  isEmpty?: boolean;
  extra?: ReactNode;
  children: ReactNode;
}

/** Fills whatever height its parent gives it (a fixed-height wrapper div, or
 * a flex row with `align="stretch"`) rather than assuming a fixed pixel size —
 * so the same card works both in scrollable pages and in a fill-the-viewport
 * dashboard grid. */
export function ChartCard({ title, loading, isEmpty, extra, children }: ChartCardProps) {
  return (
    <Card
      title={title}
      size="small"
      extra={extra}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
      styles={{ body: { flex: 1, minHeight: 0, padding: 12, display: "flex" } }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <Spin />
        ) : isEmpty ? (
          <Empty description="No Data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ width: "100%", height: "100%" }}>{children}</div>
        )}
      </div>
    </Card>
  );
}
