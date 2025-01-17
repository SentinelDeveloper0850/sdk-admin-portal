export const CsvImportTool = ({
  handleChange,
  label = "Import CSV File",
  allowMultiple = false,
}: any) => {
  return (
    <div>
      <label
        style={{
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: "0.15rem",
        }}
      >
        {label}
      </label>
      <input
        multiple={allowMultiple}
        type="file"
        name="file"
        onChange={handleChange}
        style={{ display: "block", margin: "10px 0" }}
      />
    </div>
  );
};
