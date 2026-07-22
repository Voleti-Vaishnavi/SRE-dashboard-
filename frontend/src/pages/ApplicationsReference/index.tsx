import { Card, Table, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import { useApplications } from "../../api/hooks/useReferenceData";
import { MEDAL_COLORS } from "../../theme/colors";
import type { ApplicationRef } from "../../types";

export function ApplicationsReference() {
  const { data, isLoading } = useApplications();

  return (
    <div>
      <Typography.Title level={3}>Applications Reference</Typography.Title>
      <Typography.Paragraph type="secondary">
        Master data: application name, owning team, and Medal Category. This is fixed reference
        data, not part of the daily uploads.
      </Typography.Paragraph>
      <Card size="small">
        <Table<ApplicationRef>
          rowKey="id"
          loading={isLoading}
          dataSource={data ?? []}
          pagination={false}
          columns={[
            {
              title: "Application",
              dataIndex: "name",
              sorter: (a, b) => a.name.localeCompare(b.name),
              render: (name, record) => <Link to={`/applications/${record.id}`}>{name}</Link>,
            },
            {
              title: "Tower",
              dataIndex: "team_name",
              filters: Array.from(new Set((data ?? []).map((a) => a.team_name))).map((t) => ({
                text: t,
                value: t,
              })),
              onFilter: (value, record) => record.team_name === value,
            },
            {
              title: "Medal Category",
              dataIndex: "medal_category",
              filters: ["Gold", "Silver", "Bronze", "Tin"].map((m) => ({ text: m, value: m })),
              onFilter: (value, record) => record.medal_category === value,
              render: (medal: string) => <Tag color={MEDAL_COLORS[medal]}>{medal}</Tag>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
