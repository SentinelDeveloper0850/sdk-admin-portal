"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";



import { AlertTriangle, Check, Download, FileText, FileUp, Info, Upload } from "lucide-react";



import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Progress } from "@/app/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";



import { CSVDataTable } from "./csv-data-table";
import { extractTextFromPDF } from "./parser";


export default function PDFBankStatementAnalyzer() {
  // State for file and processing
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("upload")
  const [error, setError] = useState<string | null>(null)
  const [rawTextContent, setRawTextContent] = useState<string>("")
  const [csvContent, setCsvContent] = useState<string>("")
  const [pdfJSLoaded, setPdfJSLoaded] = useState(false)
  const [isCheckingPDFJS, setIsCheckingPDFJS] = useState(true)
  const [processingLog, setProcessingLog] = useState<string[]>([])
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [preserveStructure, setPreserveStructure] = useState(true)
  const [skipLines, setSkipLines] = useState(5) // Default to skipping 5 lines
  const [csvViewMode, setCsvViewMode] = useState<"raw" | "table">("table") // Default to table view
  const [isGrouped, setIsGrouped] = useState(true)

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to handle PDF upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) {
      return
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a valid PDF file")
      return
    }
    
    console.log("🚀 ~ handleFileUpload ~ selectedFile:", selectedFile)

    setFile(selectedFile)
    setIsLoading(true)
    setProcessingProgress(10)
    setError(null)
    setRawTextContent("")
    setCsvContent("")
    setProcessingLog(["Starting PDF processing..."])

    try {
      setProcessingProgress(20)

      // Read the file as ArrayBuffer
      addToLog("Reading PDF file...")
      const fileReader = new FileReader()
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as ArrayBuffer)
        fileReader.onerror = reject
        fileReader.readAsArrayBuffer(selectedFile)
      })
      
      console.log("🚀 ~ handleFileUpload ~ arrayBuffer:", arrayBuffer)

      setProcessingProgress(40)
      addToLog("PDF file read successfully")

      // Extract text from PDF
      addToLog("Extracting text from PDF...")
      const pdfText = await extractTextFromPDF(arrayBuffer)
      console.log("🚀 ~ handleFileUpload ~ pdfText:", pdfText)
      setRawTextContent(pdfText)
      setProcessingProgress(70)
      addToLog(`Extracted ${pdfText.length} characters of text from PDF`)

      if (!pdfText || pdfText.trim() === "") {
        throw new Error("No text could be extracted from the PDF. The file might be empty or protected.")
      }

      // Convert the extracted text to CSV format
      addToLog(`Converting text to CSV format (skipping first ${skipLines} lines)...`)
      const csv = preserveStructure
        ? convertTextToStructuredCSV(pdfText, skipLines)
        : convertTextToSimpleCSV(pdfText, skipLines)
      setCsvContent(csv)
      setProcessingProgress(100)
      addToLog("CSV conversion complete")

      // Automatically download the CSV file
      const filename = selectedFile.name.replace(".pdf", "") + "_extracted.csv"
      // downloadFile(csv, filename, "text/csv")
      addToLog(`CSV file "${filename}" downloaded`)

      // Show success message
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)

      // Switch to the raw data tab and enable grouping by default
      setActiveTab("raw")
      setCsvViewMode("table")
      setIsGrouped(false) // Auto-enable grouping
    } catch (error) {
      console.error("PDF processing error:", error)
      setError("Error processing PDF: " + (error instanceof Error ? error.message : String(error)))
      addToLog(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to add to processing log
  const addToLog = (message: string) => {
    setProcessingLog((prev) => [...prev, message])
  }

  // Convert extracted text to simple CSV format (one line = one row)
  const convertTextToSimpleCSV = (text: string, skipLines = 0): string => {
    // Split the text into lines
    const lines = text.split("\n").filter((line) => line.trim() !== "")

    // Skip the specified number of lines
    const processedLines = skipLines > 0 ? lines.slice(skipLines) : lines

    // Process each line to create CSV rows
    const csvRows = processedLines.map((line) => {
      // Replace multiple spaces with a single space
      const cleanedLine = line.replace(/\s+/g, " ").trim()

      // Split the line by spaces to get potential columns
      const columns = cleanedLine.split(" ")

      // Escape any commas in the columns and join with commas
      return columns.map((col) => `"${col.replace(/"/g, '""')}"`).join(",")
    })

    // Join all rows with newlines
    return csvRows.join("\n")
  }

  // Convert extracted text to structured CSV format (tries to preserve tabular structure)
  const convertTextToStructuredCSV = (text: string, skipLines = 0): string => {
    // Split the text into lines
    const lines = text.split("\n").filter((line) => line.trim() !== "")

    // Skip the specified number of lines
    const processedLines = skipLines > 0 ? lines.slice(skipLines) : lines

    // Try to detect date patterns that might indicate transaction rows
    const datePattern =
      /\d{1,2}\/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/\d{4}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i

    // Try to detect amount patterns
    const amountPattern = /R\s*[\d,]+\.\d{2}|[\d,]+\.\d{2}/

    // Try to detect balance patterns (similar to amount patterns but typically at the end of a line)
    const balancePattern = /R\s*[\d,]+\.\d{2}|[\d,]+\.\d{2}/

    // Process each line
    const csvRows = []

    // Add a header row
    csvRows.push('"Date","Description","Amount","Balance"');

    // First pass: identify potential transaction rows and analyze structure
    const potentialTransactions = []
    let maxAmountsPerLine = 0

    for (let i = 0; i < processedLines.length; i++) {
      if (!processedLines[i]) continue
      const line = processedLines[i].trim()
      if (!line) continue

      // Check if this line contains a date (potential transaction)
      const dateMatch = line.match(datePattern)
      if (!dateMatch) continue

      // Count how many amount-like patterns are in this line
      const amountMatches = line.match(new RegExp(amountPattern.source, "g")) || []
      maxAmountsPerLine = Math.max(maxAmountsPerLine, amountMatches.length)

      potentialTransactions.push({
        line,
        dateMatch,
        amountMatches,
        index: i,
      })
    }

    // Second pass: extract structured data based on the analysis
    for (const transaction of potentialTransactions) {
      if (!transaction || !transaction.line || !transaction.dateMatch) continue

      const { line, dateMatch, amountMatches } = transaction

      // Extract the date
      const date = dateMatch[0]

      // If we have multiple amount patterns, assume the last one is the balance
      let amount = ""
      let balance = ""

      if (amountMatches && amountMatches.length >= 2) {
        // If we have at least 2 amount patterns, use the first for amount and last for balance
        amount = amountMatches[0] ?? ""
        balance = amountMatches[amountMatches.length - 1]
      } else if (amountMatches && amountMatches.length === 1) {
        // If we only have one amount pattern, use it for amount
        amount = amountMatches[0]
      }

      // Extract description (everything between date and first amount)
      let description = ""
      const dateIndex = line.indexOf(dateMatch[0]) + dateMatch[0].length
      const amountIndex = amount ? line.indexOf(amount) : -1

      if (amountIndex > dateIndex) {
        description = line.substring(dateIndex, amountIndex).trim()
      } else {
        description = line.replace(dateMatch[0], "").trim()
        if (amount) {
          description = description.replace(amount, "").trim()
        }
        if (balance) {
          description = description.replace(balance, "").trim()
        }
      }

      // Clean up description (remove multiple spaces)
      description = description.replace(/\s+/g, " ").trim()

      // Determine transaction type based on presence of 'Cr' or 'Dr' near the amount
      let type = "Debit" // Default fallback
      const lineAfterAmount = line.substring(line.indexOf(amount) + amount.length).trim()
      if (/^Cr\b/.test(lineAfterAmount)) {
        type = "Credit"
      } else if (/^Dr\b/.test(lineAfterAmount)) {
        type = "Debit"
      }

      // Add to CSV rows (include Type as new column)
      csvRows.push(
        `"${date.replace(/"/g, '""')}","${description.replace(/"/g, '""')}","${amount.replace(/"/g, '""')}","${balance.replace(/"/g, '""')}","${type}"`
      )

    }

    // If we didn't find any transactions with balance, try a simpler approach
    if (maxAmountsPerLine < 2) {
      addToLog("No balance column detected. Using simpler extraction method.")

      // Update the header row to remove Balance column
      csvRows[0] = '"Date","Description","Amount"';

      // Clear the rows and re-process without looking for balance
      csvRows.length = 1 // Keep only the header

      for (let i = 0; i < processedLines.length; i++) {
        const line = processedLines[i].trim()
        if (!line) continue

        // Check if this line contains a date (potential transaction)
        const dateMatch = line.match(datePattern)
        if (!dateMatch) continue

        // Look for an amount in the same line
        const amountMatch = line.match(amountPattern)
        if (!amountMatch) continue

        const date = dateMatch[0]
        const amount = amountMatch[0]

        // Extract description (everything between date and amount)
        let description = ""
        const dateIndex = line.indexOf(dateMatch[0]) + dateMatch[0].length
        const amountIndex = line.indexOf(amountMatch[0])

        if (amountIndex > dateIndex) {
          description = line.substring(dateIndex, amountIndex).trim()
        } else {
          description = line.replace(dateMatch[0], "").replace(amountMatch[0], "").trim()
        }

        // Add to CSV rows
        csvRows.push(
          `"${date.replace(/"/g, '""')}","${description.replace(/"/g, '""')}","${amount.replace(/"/g, '""')}"`,
        )
      }
    }

    // Join all rows with newlines
    return csvRows.join("\n")
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile)

        // Manually trigger file processing since we're not using the input change event
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(droppedFile)

        if (fileInputRef.current) {
          fileInputRef.current.files = dataTransfer.files
          handleFileUpload({ target: { files: dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>)
        }
      } else {
        setError("Please upload a valid PDF file")
      }
    }
  }

  const convertTextToStructuredCSVwithOnlyCredits = (text: string, skipLines = 0): string => {
    const lines = text.split("\n").filter(line => line.trim() !== "");
    const processedLines = skipLines > 0 ? lines.slice(skipLines) : lines;
  
    const csvRows: string[] = [];
    csvRows.push('"Date","Description","Amount"'); // Only interested in these
  
    const datePattern =
      /\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
  
    const amountPattern = /[\d,]+\.\d{2}/g;
  
    for (const line of processedLines) {
      const matchDate = line.match(datePattern);
      if (!matchDate) continue;
  
      const amounts = [...line.matchAll(amountPattern)];
      if (amounts.length < 2) continue;
  
      const secondLastAmount = amounts[amounts.length - 2];
      const afterAmount = line.substring(secondLastAmount.index! + secondLastAmount[0].length).trim();
  
      if (!afterAmount.startsWith("Cr")) continue; // Only keep credits
  
      const date = matchDate[0];
      const amount = secondLastAmount[0];
  
      const descriptionStart = line.indexOf(date) + date.length;
      const descriptionEnd = secondLastAmount.index!;
      const description = line.substring(descriptionStart, descriptionEnd).replace(/\bCr\b/, "").trim();
  
      csvRows.push(
        `"${date.replace(/"/g, '""')}","${description.replace(/"/g, '""')}","${amount}"`
      );
    }
  
    return csvRows.join("\n");
  };
  

  // Handle manual download of CSV
  const handleDownloadCSV = () => {
    if (!csvContent) return

    const filename = file ? file.name.replace(".pdf", "") + "_extracted.csv" : "extracted_data.csv"
    // downloadFile(csvContent, filename, "text/csv")
  }

  // Handle changing the number of lines to skip
  const handleSkipLinesChange = (newValue: number) => {
    setSkipLines(newValue)

    // If we already have raw text content, regenerate the CSV with the new skip value
    if (rawTextContent) {
      const newCsv = preserveStructure
        ? convertTextToStructuredCSVwithOnlyCredits(rawTextContent, newValue)
        : convertTextToSimpleCSV(rawTextContent, newValue);
      setCsvContent(newCsv)
      addToLog(`Updated CSV to skip first ${newValue} lines`)
    }
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        {/* <h1 className="text-3xl font-bold">PDF to CSV Converter</h1> */}

        {csvContent && (
          <Button variant="outline" onClick={handleDownloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        )}
      </div>

      {showSuccessMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            PDF successfully converted to CSV and downloaded!
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="upload">Upload PDF</TabsTrigger>
          <TabsTrigger value="raw" disabled={!rawTextContent}>
            Raw Data
          </TabsTrigger>
          <TabsTrigger value="log" disabled={processingLog.length === 0}>
            Processing Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF File</CardTitle>
              <CardDescription>
                Upload your PDF file to extract its content and convert it to CSV format.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
              {isLoading ? (
                <div className="w-full max-w-md space-y-4">
                  <h3 className="text-lg font-medium text-center">Processing PDF...</h3>
                  <Progress value={processingProgress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    {processingProgress < 30 && "Reading PDF file..."}
                    {processingProgress >= 30 && processingProgress < 60 && "Extracting text content..."}
                    {processingProgress >= 60 && processingProgress < 90 && "Converting to CSV format..."}
                    {processingProgress >= 90 && "Finalizing..."}
                  </p>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center w-full max-w-md"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Drag and drop your PDF file here</h3>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md inline-flex items-center">
                      <FileUp className="mr-2 h-4 w-4" />
                      Browse Files
                    </div>
                    <Input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={!pdfJSLoaded}
                    />
                  </Label>
                  <p className="text-xs text-gray-500 mt-4">Supported format: PDF</p>
                  {file && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>{file.name}</span>
                    </div>
                  )}
                  {error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2 mt-4 w-full max-w-md">
                <div className="flex items-center">
                  <Checkbox
                    id="preserveStructure"
                    checked={preserveStructure}
                    onCheckedChange={(checked: boolean) => setPreserveStructure(checked === true)}
                  />
                  <Label htmlFor="preserveStructure" className="ml-2 text-sm">
                    Try to preserve bank statement structure (recommended for bank statements)
                  </Label>
                </div>

                <div className="flex items-center mt-2">
                  <Label htmlFor="skipLines" className="mr-2 text-sm w-40">
                    Skip first lines:
                  </Label>type
                  <Input
                    id="skipLines"
                    type="number"
                    min="0"
                    max="20"
                    value={skipLines}
                    onChange={(e) => handleSkipLinesChange(Number.parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">(Skip header information)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Data</CardTitle>
              <CardDescription>The raw text extracted from your PDF and the converted CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="table">
                <TabsList className="mb-4">
                  <TabsTrigger value="text">Raw Text</TabsTrigger>
                  <TabsTrigger value="csv">CSV Format</TabsTrigger>
                  <TabsTrigger value="table">Table View</TabsTrigger>
                </TabsList>

                <TabsContent value="text">
                  {rawTextContent ? (
                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                      <pre className="whitespace-pre-wrap text-sm">
                        {rawTextContent.split("\n").map((line, index) => (
                          <div key={index} className={index < skipLines ? "text-muted-foreground line-through" : ""}>
                            {line}
                          </div>
                        ))}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No text content available. Please upload a PDF file.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="csv">
                  {csvContent ? (
                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                      <pre className="whitespace-pre-wrap text-sm">{csvContent}</pre>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No CSV content available. Please upload a PDF file.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="table">
                  {csvContent ? (
                    <CSVDataTable csvContent={csvContent} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No data available. Please upload a PDF file.
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {csvContent && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleDownloadCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newCsv = preserveStructure
                        ? convertTextToSimpleCSV(rawTextContent, skipLines)
                        : convertTextToStructuredCSVwithOnlyCredits(
                            rawTextContent,
                            skipLines
                          );
                      setCsvContent(newCsv)
                      setPreserveStructure(!preserveStructure)
                    }}
                  >
                    Try Alternative Format
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardHeader>
              <CardTitle>Processing Log</CardTitle>
              <CardDescription>Detailed log of the PDF processing steps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md overflow-x-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {processingLog.map((log, index) => (
                    <div key={index} className={log.startsWith("ERROR") ? "text-red-500" : ""}>
                      {log}
                    </div>
                  ))}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Dialog */}
      <Dialog>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PDF to CSV Conversion Help</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This tool extracts text from PDF files and converts it to CSV format. Here are some tips for best
                results:
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="font-medium">For Best Results:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Use text-based PDFs (not scanned documents)</li>
                <li>Ensure the PDF is not password-protected</li>
                <li>PDFs with clear tabular data work best</li>
                <li>Check the "Raw Data" tab to verify the extraction</li>
                <li>Adjust the "Skip first lines" setting to remove headers</li>
                <li>
                  The table view automatically filters out rows that don't follow the "date, description, balance"
                  structure
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Troubleshooting:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>If the CSV format is not ideal, try the "Alternative Format" button</li>
                <li>Some PDFs may have complex layouts that don't convert well to CSV</li>
                <li>Check the Processing Log tab for detailed information about any errors</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}