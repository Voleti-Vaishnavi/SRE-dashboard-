import { useState } from "react";
import { Col, Row } from "antd";
import { FilterBar } from "../../components/filters/FilterBar";
import { KpiCard } from "../../components/kpi/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { HealthDonut } from "../../components/charts/HealthDonut";
import { HealthTrendChart } from "../../components/charts/HealthTrendChart";
import { TeamComparisonBar } from "../../components/charts/TeamComparisonBar";
import { StatusDonut } from "../../components/charts/StatusDonut";
import { TrendLineChart } from "../../components/charts/TrendLineChart";
import { MonitoringCategoryCard } from "../../components/charts/MonitoringCategoryCard";
import { isTrendEmpty } from "../../components/charts/chartUtils";
import {
  useChangeSummary,
  useChangeTrend,
  useHealthSummary,
  useHealthTrend,
  useKpis,
} from "../../api/hooks/useAnalytics";
import { useTeams } from "../../api/hooks/useReferenceData";
import { CHANGE_STATUS_COLORS, FOUR_EYE_COLORS } from "../../theme/colors";
import type { DashboardFilters } from "../../types";

const rowStyle = { flex: 1, minHeight: 0 };

export function DashboardOverview() {
  const [filters, setFilters] = useState<DashboardFilters>({ granularity: "daily" });

  const { data: teams } = useTeams();
  const { data: kpis } = useKpis(filters);
  const { data: healthSummary, isLoading: healthSummaryLoading } = useHealthSummary(filters);
  const { data: healthTrend, isLoading: healthTrendLoading } = useHealthTrend(filters);
  const { data: changeSummary, isLoading: changeSummaryLoading } = useChangeSummary(filters);
  const { data: changeTrend, isLoading: changeTrendLoading } = useChangeTrend(filters);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
      <div style={{ flex: "0 0 auto" }}>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <Row gutter={12} style={{ flex: "0 0 auto" }}>
        <Col span={6}>
          <KpiCard title="Total Applications" value={kpis?.total_applications ?? 0} />
        </Col>
        <Col span={6}>
          <KpiCard
            title="% Green (Latest Day)"
            value={kpis?.pct_green_latest ?? 0}
            suffix="%"
            precision={1}
          />
        </Col>
        <Col span={6}>
          <KpiCard
            title="Change Success Rate"
            value={kpis?.change_success_rate ?? 0}
            suffix="%"
            precision={1}
            delta={kpis?.change_success_rate_delta}
          />
        </Col>
        <Col span={6}>
          <KpiCard
            title="4-Eye Completion Rate"
            value={kpis?.four_eye_completion_rate ?? 0}
            suffix="%"
            precision={1}
            delta={kpis?.four_eye_completion_rate_delta}
          />
        </Col>
      </Row>

      <Row gutter={12} align="stretch" style={rowStyle}>
        <Col span={6} style={{ height: "100%" }}>
          <ChartCard
            title="Health Distribution (Latest Day)"
            loading={healthSummaryLoading}
            isEmpty={!healthSummary || Object.values(healthSummary.overall).every((v) => v === 0)}
          >
            <HealthDonut counts={healthSummary?.overall ?? {}} />
          </ChartCard>
        </Col>
        <Col span={10} style={{ height: "100%" }}>
          <ChartCard
            title="Health Trend"
            loading={healthTrendLoading}
            isEmpty={isTrendEmpty(healthTrend?.buckets)}
          >
            <HealthTrendChart buckets={healthTrend?.buckets ?? []} />
          </ChartCard>
        </Col>
        <Col span={8} style={{ height: "100%" }}>
          <ChartCard
            title="Health by Team (Latest Day)"
            loading={healthSummaryLoading}
            isEmpty={!healthSummary || Object.keys(healthSummary.per_team).length === 0}
          >
            <TeamComparisonBar perTeam={healthSummary?.per_team ?? {}} teams={teams ?? []} />
          </ChartCard>
        </Col>
      </Row>

      <Row gutter={12} align="stretch" style={rowStyle}>
        <Col span={6} style={{ height: "100%" }}>
          <ChartCard
            title="Change Status Breakdown"
            loading={changeSummaryLoading}
            isEmpty={!changeSummary || changeSummary.total_changes === 0}
          >
            <StatusDonut
              counts={changeSummary?.change_status ?? {}}
              order={["Success", "Failure", "WIP"]}
              colorMap={CHANGE_STATUS_COLORS}
            />
          </ChartCard>
        </Col>
        <Col span={6} style={{ height: "100%" }}>
          <ChartCard
            title="4-Eye Review Breakdown"
            loading={changeSummaryLoading}
            isEmpty={!changeSummary || changeSummary.total_changes === 0}
          >
            <StatusDonut
              counts={changeSummary?.four_eye_status ?? {}}
              order={["Completed", "Not Completed", "WIP"]}
              colorMap={FOUR_EYE_COLORS}
            />
          </ChartCard>
        </Col>
        <Col span={12} style={{ height: "100%" }}>
          <ChartCard
            title="Change Trend (Success vs Failure vs WIP)"
            loading={changeTrendLoading}
            isEmpty={isTrendEmpty(changeTrend?.buckets)}
          >
            <TrendLineChart
              buckets={changeTrend?.buckets ?? []}
              order={["Success", "Failure", "WIP"]}
              colorMap={CHANGE_STATUS_COLORS}
            />
          </ChartCard>
        </Col>
      </Row>

      <Row gutter={12} align="stretch" style={{ ...rowStyle, flex: 0.85 }}>
        <Col span={6} style={{ height: "100%" }}>
          <MonitoringCategoryCard category="url" title="URL Availability" filters={filters} />
        </Col>
        <Col span={6} style={{ height: "100%" }}>
          <MonitoringCategoryCard category="job" title="Job Monitoring" filters={filters} />
        </Col>
        <Col span={6} style={{ height: "100%" }}>
          <MonitoringCategoryCard
            category="interface"
            title="Interface Monitoring"
            filters={filters}
          />
        </Col>
        <Col span={6} style={{ height: "100%" }}>
          <MonitoringCategoryCard
            category="critical_file"
            title="Critical File Monitoring"
            filters={filters}
          />
        </Col>
      </Row>
    </div>
  );
}
