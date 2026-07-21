import { useMonitoringSummary } from "../../api/hooks/useAnalytics";
import { RUN_STATUS_COLORS, URL_STATUS_COLORS } from "../../theme/colors";
import type { DashboardFilters } from "../../types";
import { ChartCard } from "./ChartCard";
import { TrendLineChart } from "./TrendLineChart";
import { isTrendEmpty } from "./chartUtils";

const RUN_ORDER = ["Success", "Failure", "Yet to Run"];
const URL_ORDER = ["Operational", "Non Operational"];

export interface MonitoringCategoryCardProps {
  category: "url" | "job" | "interface" | "critical_file";
  title: string;
  filters: DashboardFilters;
}

export function MonitoringCategoryCard({ category, title, filters }: MonitoringCategoryCardProps) {
  const { data, isLoading } = useMonitoringSummary(category, filters);
  const isUrl = category === "url";
  const order = isUrl ? URL_ORDER : RUN_ORDER;
  const colorMap = isUrl ? URL_STATUS_COLORS : RUN_STATUS_COLORS;

  return (
    <ChartCard title={title} loading={isLoading} isEmpty={isTrendEmpty(data?.buckets)}>
      <TrendLineChart buckets={data?.buckets ?? []} order={order} colorMap={colorMap} />
    </ChartCard>
  );
}
