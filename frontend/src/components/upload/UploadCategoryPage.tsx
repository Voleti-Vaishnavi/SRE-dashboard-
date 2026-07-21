import { useState } from "react";
import { Alert, Button, Card, Table, Typography, Upload, message } from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import dayjs from "dayjs";
import { downloadTemplate, useUploadFile, useUploadHistory } from "../../api/hooks/useUploads";
import type { UploadCategory, UploadResult } from "../../types";

const { Dragger } = Upload;

export interface UploadCategoryPageProps {
  category: UploadCategory;
  title: string;
  description: string;
}

export function UploadCategoryPage({ category, title, description }: UploadCategoryPageProps) {
  const [lastResult, setLastResult] = useState<UploadResult | null>(null);
  const uploadMutation = useUploadFile(category);
  const { data: history, isLoading: historyLoading } = useUploadHistory(category);

  const draggerProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx",
    showUploadList: false,
    customRequest: ({ file, onSuccess, onError }) => {
      uploadMutation.mutate(file as File, {
        onSuccess: (result) => {
          setLastResult(result);
          message.success(`Uploaded: ${result.inserted} inserted, ${result.updated} updated`);
          onSuccess?.(result);
        },
        onError: (err) => {
          message.error("Upload failed");
          onError?.(err as Error);
        },
      });
    },
  };

  return (
    <div>
      <Typography.Title level={3}>{title}</Typography.Title>
      <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Button icon={<DownloadOutlined />} onClick={() => downloadTemplate(category)}>
          Download Template
        </Button>
        <Typography.Text type="secondary" style={{ marginLeft: 12 }}>
          Fill in the downloaded template with today's data, then upload it below.
        </Typography.Text>
      </Card>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Dragger {...draggerProps} disabled={uploadMutation.isPending}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag an .xlsx file here to upload</p>
          <p className="ant-upload-hint">Only .xlsx files matching the template are accepted.</p>
        </Dragger>
      </Card>

      {lastResult && (
        <Card size="small" title="Last Upload Result" style={{ marginBottom: 16 }}>
          <Typography.Paragraph>
            Rows read: {lastResult.rows_read} · Inserted: {lastResult.inserted} · Updated:{" "}
            {lastResult.updated} · Skipped: {lastResult.skipped}
          </Typography.Paragraph>
          {lastResult.errors.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${lastResult.errors.length} row(s) had errors and were skipped`}
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {lastResult.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                  {lastResult.errors.length > 10 && <li>…and {lastResult.errors.length - 10} more</li>}
                </ul>
              }
            />
          )}
        </Card>
      )}

      <Card size="small" title="Recent Uploads">
        <Table
          size="small"
          rowKey="id"
          loading={historyLoading}
          dataSource={history ?? []}
          pagination={false}
          columns={[
            { title: "Uploaded At", dataIndex: "uploaded_at", render: (v) => dayjs(v).format("YYYY-MM-DD HH:mm") },
            { title: "Filename", dataIndex: "filename" },
            { title: "Rows Read", dataIndex: "rows_read" },
            { title: "Inserted", dataIndex: "rows_inserted" },
            { title: "Updated", dataIndex: "rows_updated" },
            { title: "Skipped", dataIndex: "rows_skipped" },
          ]}
        />
      </Card>
    </div>
  );
}
