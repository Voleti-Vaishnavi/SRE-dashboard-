import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Col, Row, Table, Tag, Typography } from "antd";
import { FilterBar } from "../../components/filters/FilterBar";
import { ChartCard } from "../../components/charts/ChartCard";
import { HealthDonut } from "../../components/charts/HealthDonut";
import { HealthTrendChart } from "../../components/charts/HealthTrendChart";
import { ChangesTable } from "../../components/ChangesTable";
import { isTrendEmpty } from "../../components/charts/chartUtils";
import {
  latestHealthByApplication,
  useDailyHealth,
  useHealthSummary,
  useHealthTrend,
} from "../../api/hooks/useAnalytics";
import { useApplications, useTeams } from "../../api/hooks/useReferenceData";
import { HEALTH_COLORS, MEDAL_COLORS } from "../../theme/colors";
import type { ApplicationRef, DashboardFilters } from "../../types";

export function TeamDetail() {
  const { teamId } = useParams();
  const teamIdNum = teamId ? Number(teamId) : undefined;
  const { data: teams } = useTeams();
  const { data: applications } = useApplications(teamIdNum);
  const team = teams?.find((t) => t.id === teamIdNum);

  const [baseFilters, setBaseFilters] = useState<DashboardFilters>({ granularity: "daily" });
  const filters: DashboardFilters = useMemo(
    () => ({ ...baseFilters, teamId: teamIdNum }),
    [baseFilters, teamIdNum]
  );

  const { data: healthSummary, isLoading: healthSummaryLoading } = useHealthSummary(filters);
  const { data: healthTrend, isLoading: healthTrendLoading } = useHealthTrend(filters);
  const { data: dailyHealth } = useDailyHealth(filters);
  const latestHealthByApp = latestHealthByApplication(dailyHealth);

  return (
    <div>
      <Typography.Title level={3}>{team?.name ?? "Team"}</Typography.Title>
      <FilterBar
        filters={baseFilters}
        onChange={setBaseFilters}
        showTeamFilter={false}
        showApplicationFilter={false}
      />

      <Row gutter={[16, 16]} align="stretch" style={{ height: 300 }}>
        <Col xs={24} md={8}>
          <ChartCard
            title="Health Distribution (Latest Day)"
            loading={healthSummaryLoading}
            isEmpty={!healthSummary || Object.values(healthSummary.overall).every((v) => v === 0)}
          >
            <HealthDonut counts={healthSummary?.overall ?? {}} />
          </ChartCard>
        </Col>
        <Col xs={24} md={16}>
          <ChartCard
            title="Health Trend"
            loading={healthTrendLoading}
            isEmpty={isTrendEmpty(healthTrend?.buckets)}
          >
            <HealthTrendChart buckets={healthTrend?.buckets ?? []} />
          </ChartCard>
        </Col>
      </Row>

      <Card size="small" title="Applications" style={{ marginTop: 16 }}>
        <Table<ApplicationRef>
          rowKey="id"
          size="small"
          dataSource={applications ?? []}
          pagination={false}
          columns={[
            {
              title: "Application",
              dataIndex: "name",
              render: (name, record) => <Link to={`/applications/${record.id}`}>{name}</Link>,
            },
            {
              title: "Medal Category",
              dataIndex: "medal_category",
              render: (medal: string) => <Tag color={MEDAL_COLORS[medal]}>{medal}</Tag>,
            },
            {
              title: "Health (Latest Day)",
              dataIndex: "id",
              render: (id: number) => {
                const status = latestHealthByApp.get(id)?.health_status ?? "No Data";
                return <Tag color={HEALTH_COLORS[status]}>{status}</Tag>;
              },
            },
          ]}
        />
      </Card>

      <Card size="small" title="Change Deployments" style={{ marginTop: 16 }}>
        <ChangesTable filters={filters} />
      </Card>
    </div>
  );
}
