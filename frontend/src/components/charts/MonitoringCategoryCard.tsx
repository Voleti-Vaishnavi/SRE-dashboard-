import { useMonitoringSummary } from "../../api/hooks/useAnalytics";
import { RUN_STATUS_COLORS, URL_STATUS_COLORS } from "../../theme/colors";
import type { DashboardFilters } from "../../types";
import { ChartCard } from "./ChartCard";
import { TrendBarChart } from "./TrendBarChart";
import { isTrendEmpty } from "./chartUtils";

const RUN_ORDER = ["Success", "Failure", "Yet to Run"];
const URL_ORDER = ["Operational", "Non Operational"];

const ENTITY_LABEL: Record<MonitoringCategoryCardProps["category"], string> = {
  url: "Applications",
  job: "Jobs",
  interface: "Interfaces",
  critical_file: "Files",
};

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
      <TrendBarChart
        buckets={data?.buckets ?? []}
        order={order}
        colorMap={colorMap}
        entityLabel={ENTITY_LABEL[category]}
      />
    </ChartCard>
  );
}
