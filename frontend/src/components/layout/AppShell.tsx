import { useMemo, useState } from "react";
import { Layout, Menu, Typography } from "antd";
import {
  DashboardOutlined,
  UploadOutlined,
  AppstoreOutlined,
  SwapOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTeams } from "../../api/hooks/useReferenceData";
import type { MenuProps } from "antd";

const { Sider, Header, Content } = Layout;

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: teams } = useTeams();

  const items: MenuProps["items"] = useMemo(
    () => [
      { key: "/", icon: <DashboardOutlined />, label: "Dashboard Overview" },
      {
        key: "teams",
        icon: <TeamOutlined />,
        label: "Teams",
        children: (teams ?? []).map((t) => ({ key: `/teams/${t.id}`, label: t.name })),
      },
      { key: "/applications", icon: <AppstoreOutlined />, label: "Applications" },
      { key: "/changes", icon: <SwapOutlined />, label: "Change Explorer" },
      {
        key: "uploads",
        icon: <UploadOutlined />,
        label: "Upload Data",
        children: [
          { key: "/uploads/change-deployments", label: "Change Deployments" },
          { key: "/uploads/url-availability", label: "URL Availability" },
          { key: "/uploads/job-monitoring", label: "Job Monitoring" },
          { key: "/uploads/interface-monitoring", label: "Interface Monitoring" },
          { key: "/uploads/critical-file-monitoring", label: "Critical File Monitoring" },
        ],
      },
    ],
    [teams]
  );

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={240}>
        <div
          style={{
            height: 48,
            margin: 12,
            color: "#fff",
            fontWeight: 600,
            fontSize: collapsed ? 14 : 16,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {collapsed ? "SRE" : "SRE Dashboard"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={["teams", "uploads"]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <Header
          style={{
            flex: "0 0 auto",
            background: "#fcfcfb",
            borderBottom: "1px solid #e1e0d9",
            display: "flex",
            alignItems: "center",
            height: 56,
            lineHeight: "56px",
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            Application Health &amp; Change Deployment Dashboard
          </Typography.Title>
        </Header>
        <Content style={{ flex: 1, minHeight: 0, overflow: "auto", margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
