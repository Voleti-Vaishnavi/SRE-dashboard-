import { useParams } from "react-router-dom";
import { Card, Col, Row, Select, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { useApplication } from "../../api/hooks/useReferenceData";
import {
  latestByItemName,
  useHealthCalendar,
  useMonitoringItems,
} from "../../api/hooks/useAnalytics";
import { ChangesTable } from "../../components/ChangesTable";
import { HealthCalendarHeatmap } from "../../components/charts/HealthCalendarHeatmap";
import { HEALTH_COLORS, MEDAL_COLORS, RUN_STATUS_COLORS } from "../../theme/colors";
import type { MonitoringItem } from "../../types";

const CURRENT_YEAR = new Date().getUTCFullYear();

function ItemStatusTable({ title, items, loading }: { title: string; items: MonitoringItem[]; loading: boolean }) {
  return (
    <Card size="small" title={title}>
      <Table<MonitoringItem>
        rowKey="item_name"
        size="small"
        loading={loading}
        dataSource={items}
        pagination={false}
        locale={{ emptyText: "No named items configured for this application" }}
        columns={[
          { title: "Name", dataIndex: "item_name" },
          {
            title: "Latest Status",
            dataIndex: "status",
            render: (s: string) => <Tag color={RUN_STATUS_COLORS[s]}>{s}</Tag>,
          },
          { title: "As of", dataIndex: "date" },
        ]}
      />
    </Card>
  );
}

export function ApplicationDetail() {
  const { appId } = useParams();
  const applicationId = appId ? Number(appId) : undefined;
  const [year, setYear] = useState(CURRENT_YEAR);

  const { data: application } = useApplication(applicationId);
  const { data: calendar, isLoading: calendarLoading } = useHealthCalendar(applicationId, year);
  const { data: jobs, isLoading: jobsLoading } = useMonitoringItems("job", applicationId);
  const { data: interfaces, isLoading: interfacesLoading } = useMonitoringItems(
    "interface",
    applicationId
  );
  const { data: files, isLoading: filesLoading } = useMonitoringItems("critical_file", applicationId);

  return (
    <div>
      <Typography.Title level={3}>
        {application?.name ?? "Application"}{" "}
        {application && (
          <>
            <Tag color={MEDAL_COLORS[application.medal_category]}>{application.medal_category}</Tag>
            <Tag>{application.team_name}</Tag>
          </>
        )}
      </Typography.Title>

      <Card
        size="small"
        title="Health Calendar"
        extra={
          <Select
            size="small"
            value={year}
            onChange={setYear}
            options={[year - 1, year, year + 1].map((y) => ({ label: y, value: y }))}
          />
        }
        style={{ marginBottom: 16 }}
        loading={calendarLoading}
      >
        <HealthCalendarHeatmap entries={calendar ?? []} year={year} />
        <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12 }}>
          {(["Green", "Amber", "Red", "No Data"] as const).map((s) => (
            <span key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: HEALTH_COLORS[s],
                  display: "inline-block",
                }}
              />
              {s}
            </span>
          ))}
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <ItemStatusTable
            title="Job Monitoring (per job)"
            items={latestByItemName(jobs)}
            loading={jobsLoading}
          />
        </Col>
        <Col xs={24} md={8}>
          <ItemStatusTable
            title="Interface Monitoring (per interface)"
            items={latestByItemName(interfaces)}
            loading={interfacesLoading}
          />
        </Col>
        <Col xs={24} md={8}>
          <ItemStatusTable
            title="Critical File Monitoring (per file)"
            items={latestByItemName(files)}
            loading={filesLoading}
          />
        </Col>
      </Row>

      <Card size="small" title="Change History" style={{ marginTop: 16 }}>
        <ChangesTable filters={{ granularity: "daily", applicationId }} showStatusFilters={false} />
      </Card>
    </div>
  );
}
