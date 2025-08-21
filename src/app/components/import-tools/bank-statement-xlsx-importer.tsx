import { useState } from "react";

import { UploadOutlined } from "@ant-design/icons";
import { Button, DatePicker, Space, Upload, notification } from "antd";
import * as XLSX from "xlsx";

export const BankStatementExcelImporter = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statementMonth, setStatementMonth] = useState<any>(undefined);

  const acceptableFileTypes = [".xlsx", ".xls"];

  const bulkCreateTransactions = async (payload: {
    statementMonth: any;
    transactions: any[];
    uuid: any;
  }) => {
    try {
      const response = await fetch("/api/transactions/eft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...payload, source: "Bank Statement" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to bulk create transactions");
        return;
      }

      // console.log("bulkCreateTransactions response", response);
    } catch (err) {
      console.log(err);
      setError("An error occurred while bulk creating transactions.");
    }
  };

  const parseExcelData = (data: any) => {
    const workbook = XLSX.read(data);

    let _sheetData: any[] = [];

    for (let index = 0; index < workbook.SheetNames.length; index++) {
      let sheetName = workbook.SheetNames[index];

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length > 0) {
        _sheetData = [..._sheetData, ...jsonData];
      }
    }

    let payload = {
      statementMonth: statementMonth,
      transactions: _sheetData,
      uuid: statementMonth,
    };

    bulkCreateTransactions(payload);
  };

  const handleBeforeUpload = async (file: File) => {
    try {
      if (!acceptableFileTypes.includes(`.${file.name.split('.').pop()?.toLowerCase()}`)) {
        notification.error({
          message: "Invalid File Type",
          description: "Please upload xlsx or xls files only",
        });
        return Upload.LIST_IGNORE;
      }
      setLoading(true);
      const data = await file.arrayBuffer();
      parseExcelData(data);
      notification.success({ message: "Bank statement parsed. Importing…" });
    } catch (e) {
      notification.error({ message: "Failed to read file" });
    } finally {
      setLoading(false);
    }
    return false; // prevent default upload
  };

  const handleRemoveFile = () => {
    setStatementMonth(undefined);
  };

  const onMonthChange = (_date: any, dateString: string | string[]) => {
    if (dateString.length === 0) {
      setStatementMonth(undefined);
    } else {
      setStatementMonth(dateString);
    }
  };

  return (
    <Space>
      <DatePicker
        placeholder="Statement Month"
        onChange={onMonthChange}
        picker="month"
      />
      <Upload
        accept={acceptableFileTypes.join(',')}
        showUploadList={false}
        beforeUpload={handleBeforeUpload}
        disabled={statementMonth === undefined || loading}
      >
        <Button icon={<UploadOutlined />} loading={loading} disabled={statementMonth === undefined}>
          Import Bank Statement (XLSX)
        </Button>
      </Upload>
    </Space>
  );
};
