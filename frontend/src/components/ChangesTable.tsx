import { useState } from "react";
import { Select, Space, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { useChanges } from "../api/hooks/useAnalytics";
import { CHANGE_STATUS_COLORS, FOUR_EYE_COLORS } from "../theme/colors";
import type { ChangeItem, DashboardFilters } from "../types";

export interface ChangesTableProps {
  filters: DashboardFilters;
  showStatusFilters?: boolean;
}

export function ChangesTable({ filters, showStatusFilters = true }: ChangesTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [changeStatus, setChangeStatus] = useState<string | undefined>();
  const [fourEyeStatus, setFourEyeStatus] = useState<string | undefined>();

  const { data, isLoading } = useChanges({
    ...filters,
    page,
    pageSize,
    changeStatus,
    fourEyeStatus,
    sort: "-date",
  });

  const columns: TableProps<ChangeItem>["columns"] = [
    { title: "CR Number", dataIndex: "cr_number", fixed: "left", width: 130 },
    { title: "Application", dataIndex: "application_name" },
    { title: "Tower", dataIndex: "tower_name" },
    { title: "Assignment Group", dataIndex: "assignment_group" },
    { title: "Description", dataIndex: "description", ellipsis: true },
    { title: "Assigned To", dataIndex: "assigned_to" },
    {
      title: "Change Status",
      dataIndex: "change_status",
      render: (s: string) => <Tag color={CHANGE_STATUS_COLORS[s]}>{s}</Tag>,
    },
    {
      title: "4-Eye Review",
      dataIndex: "four_eye_status",
      render: (s: string) => <Tag color={FOUR_EYE_COLORS[s]}>{s}</Tag>,
    },
    { title: "Date", dataIndex: "date" },
  ];

  return (
    <div>
      {showStatusFilters && (
        <Space style={{ marginBottom: 12 }}>
          <Select
            allowClear
            placeholder="Change Status"
            style={{ minWidth: 160 }}
            value={changeStatus}
            onChange={setChangeStatus}
            options={["Success", "Failure", "WIP"].map((s) => ({ label: s, value: s }))}
          />
          <Select
            allowClear
            placeholder="4-Eye Review Status"
            style={{ minWidth: 180 }}
            value={fourEyeStatus}
            onChange={setFourEyeStatus}
            options={["Completed", "Not Completed", "WIP"].map((s) => ({ label: s, value: s }))}
          />
        </Space>
      )}
      <Table<ChangeItem>
        rowKey="id"
        size="small"
        loading={isLoading}
        dataSource={data?.items ?? []}
        scroll={{ x: 1100 }}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </div>
  );
}
