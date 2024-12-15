import { useRef, useState } from "react";

import { CloseCircleFilled } from "@ant-design/icons";
import { DatePicker, Space, notification } from "antd";
import * as XLSX from "xlsx";

export const ExcelImportTool = () => {
  const fileRef = useRef() as React.MutableRefObject<HTMLInputElement>;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [fileName, setFileName] = useState(null);
  const [statementMonth, setStatementMonth] = useState<any>(undefined);

  const acceptableFileTypes = ["xlsx", "xls"];

  const isAcceptableFile = (name: string) => {
    let extension = name.split(".").pop()?.toLowerCase();

    if (extension) return acceptableFileTypes.includes(extension);

    return false;
  };

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
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to bulk create transactions");
        return;
      }

      console.log("bulkCreateTransactions response", response);
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

  const handleFile = async (event: any) => {
    const _file = event.target.files[0];

    if (!_file) return;

    if (!isAcceptableFile(_file.name)) {
      notification.error({
        message: "Invalid File Type",
        description: "Please upload xlsx or xls files only",
      });
      return;
    }

    setFileName(_file.name);

    const data = await _file.arrayBuffer();

    parseExcelData(data);
  };

  const handleRemoveFile = () => {
    setStatementMonth(undefined);
    setFileName(null);
    fileRef.current.value = "";
  };

  const onMonthChange = (_date: any, dateString: string | string[]) => {
    if (dateString.length === 0) {
      setStatementMonth(undefined);
    } else {
      setStatementMonth(dateString);
    }
  };

  return (
    <div>
      {fileName && (
        <label
          style={{
            color: "#999",
            textTransform: "uppercase",
            letterSpacing: "0.15rem",
          }}
        >
          File Name: <span style={{}}>{fileName}</span>{" "}
          <CloseCircleFilled
            onClick={handleRemoveFile}
            style={{ color: "#ff4d4f", cursor: "pointer" }}
          />
        </label>
      )}
      {!fileName && (
        <label
          style={{
            color: "#999",
            textTransform: "uppercase",
            letterSpacing: "0.15rem",
          }}
        >
          Import Excel File
        </label>
      )}
      <Space style={{ display: "flex", justifyContent: "flex-end" }}>
        <DatePicker
          placeholder="Statement Month"
          onChange={onMonthChange}
          picker="month"
        />
        <input
          type="file"
          name="file"
          multiple={false}
          accept="xlsx, xls"
          ref={fileRef}
          disabled={statementMonth === undefined}
          onChange={handleFile}
          style={{ display: "block", margin: "10px 0" }}
        />
      </Space>
    </div>
  );
};
