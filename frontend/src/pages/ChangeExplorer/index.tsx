import { useState } from "react";
import { Card, Typography } from "antd";
import { FilterBar } from "../../components/filters/FilterBar";
import { ChangesTable } from "../../components/ChangesTable";
import type { DashboardFilters } from "../../types";

export function ChangeExplorer() {
  const [filters, setFilters] = useState<DashboardFilters>({ granularity: "daily" });

  return (
    <div>
      <Typography.Title level={3}>Change Explorer</Typography.Title>
      <FilterBar filters={filters} onChange={setFilters} showGranularity={false} />
      <Card size="small">
        <ChangesTable filters={filters} />
      </Card>
    </div>
  );
}
