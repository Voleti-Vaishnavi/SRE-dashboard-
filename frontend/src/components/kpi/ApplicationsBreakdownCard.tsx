import { Card, Statistic } from "antd";
import { useApplications } from "../../api/hooks/useReferenceData";
import { MEDAL_COLORS } from "../../theme/colors";

const MEDAL_ORDER = ["Gold", "Silver", "Bronze", "Tin"] as const;

export interface ApplicationsBreakdownCardProps {
  teamId?: number;
}

export function ApplicationsBreakdownCard({ teamId }: ApplicationsBreakdownCardProps) {
  const { data: applications } = useApplications(teamId);
  const apps = applications ?? [];

  const counts: Record<string, number> = { Gold: 0, Silver: 0, Bronze: 0, Tin: 0 };
  for (const app of apps) {
    counts[app.medal_category] = (counts[app.medal_category] ?? 0) + 1;
  }

  return (
    <Card size="small">
      <Statistic title="Total Applications" value={apps.length} />
      <div
        style={{
          marginTop: 6,
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 12px",
          fontSize: 12,
        }}
      >
        {MEDAL_ORDER.map((medal) => (
          <span key={medal} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: MEDAL_COLORS[medal],
                display: "inline-block",
              }}
            />
            {medal} {counts[medal] ?? 0}
          </span>
        ))}
      </div>
    </Card>
  );
}
