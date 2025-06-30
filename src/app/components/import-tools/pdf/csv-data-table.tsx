"use client";

import { useState } from "react";

import {
  ChevronDown,
  ChevronRight,
  Download,
  Layers,
  PieChart,
} from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";

interface CSVDataTableProps {
  csvContent: string;
}

interface GroupedRow {
  key: string;
  description: string;
  count: number;
  totalAmount: number;
  rows: string[][];
  isExpanded?: boolean;
}

interface FinancialCategory {
  name: string;
  amount: number;
  groups: string[];
}

// Helper function for smart auto-categorization
const getAutoCategory = (desc: string, isIncome: boolean): string => {
  const d = desc.toLowerCase();

  // INCOME CATEGORIES
  if (d.includes("ikhokha") || d.includes("vswitch"))
    return "Other Income (e.g. Ihokha, VSwitch)";
  if (d.includes("adt cash deposit"))
    return "Consultations - Cash and debit Card";
  if (d.includes("membership")) return "Unjani Membership Cards";
  if (d.includes("interest"))
    return "Interest Received (Business Bank Account)";
  if (
    d.includes("rtc credit") ||
    d.includes("transfer from") ||
    d.includes("pmt unjani") ||
    d.includes("payshap credit") ||
    d.includes("payment from") ||
    d.includes("prime lending rate")
  )
    return "Other Income (e.g. Ihokha, VSwitch)";

  // Medical aid income patterns
  if (
    d.includes("glenco") ||
    d.includes("disc supp") ||
    d.includes("polmed") ||
    d.includes("sasolsupp") ||
    d.includes("lah supp") ||
    d.includes("gemsgovemed") ||
    d.includes("medscheme") ||
    d.includes("discovery health") ||
    d.includes("gems") ||
    d.includes("bonitas")
  )
    return "Consultations - Medical Aid";

  // Check for medbuassist specifically (expense for medical aid admin)
  if (d.includes("medbuassist")) return "Medical Aid Claims (admin)";

  // Telephone and Internet providers
  if (
    d.includes("rain") ||
    d.includes("telkom") ||
    d.includes("mtn") ||
    d.includes("vodacom")
  )
    return "Telephone / Internet";

  // EXPENSE CATEGORIES
  // Medical supplies - explicitly check for City Medical first
  if (
    d.includes("city medical") ||
    d.includes("alafang medical supp") ||
    d.includes("dis-chem") ||
    d.includes("dischem") ||
    d.includes("pharmacy") ||
    d.includes("medical supplies") ||
    (d.includes("medical") && !d.includes("medbuassist"))
  )
    return "Medical Suppliers (Other)";

  // Salaries - only after checking for medical supplies
  if (
    d.includes("unjani clinic") ||
    d.includes("unjani janefurse") ||
    d.includes("magdeline")
  ) {
    // Make sure it's not a payment to City Medical
    if (d.includes("city medical")) return "Medical Suppliers (Other)";
    return "Salary - Clinic Assistant 1";
  }

  if (
    d.includes("salary") ||
    d.includes("mimie") ||
    d.includes("sr kawa") ||
    d.includes("arabella")
  ) {
    // Make sure it's not a payment to City Medical
    if (d.includes("city medical")) return "Medical Suppliers (Other)";
    return "Salary - Clinic Assistant 1";
  }

  if (
    d.includes("fuel") ||
    d.includes("petrol") ||
    d.includes("diesel") ||
    d.includes("engen") ||
    d.includes("shell") ||
    d.includes("total") ||
    d.includes("sasol kings") ||
    d.includes("sasol n17 plaza") ||
    d.includes("viva welverdiend")
  )
    return "Fuel / Maintenance";

  if (
    d.includes("superspar") ||
    d.includes("checkers") ||
    d.includes("woolworths") ||
    d.includes("shoprite") ||
    d.includes("kfc") ||
    d.includes("mcd") ||
    d.includes("nandos") ||
    d.includes("wimpy") ||
    d.includes("bk jackal")
  )
    return "Office Expenses (e.g. coffee, heater, handy andy, etc.)";

  if (
    d.includes("netflix") ||
    d.includes("google") ||
    d.includes("canva") ||
    d.includes("microsoft") ||
    d.includes("disneyplus") ||
    d.includes("youtube")
  )
    return "Office Expenses (e.g. coffee, heater, handy andy, etc.)";

  if (
    d.includes("water supply") ||
    d.includes("electricity") ||
    d.includes("prepaid")
  )
    return "Utilities (electricity, water, etc)";

  if (d.includes("bank charge") || d.includes("service fee"))
    return "Bank Charges";

  if (
    d.includes("old mutual") ||
    d.includes("clientele") ||
    d.includes("budget ins") ||
    d.includes("funeral") ||
    d.includes("naked insurance") ||
    d.includes("denosa") ||
    d.includes("vap") ||
    d.includes("netcash")
  )
    return "Life Insurance";

  if (
    d.includes("transfer to gold") ||
    d.includes("scheduled trf") ||
    d.includes("payment to investment")
  )
    return "Internal Transfers";

  if (d.includes("napongwato") || d.includes("fitness"))
    return "Other expenses (ad hoc expenses) business only";

  if (d.includes("sars paye") || d.includes("tax")) return "PAYE, SDL & UIF";

  if (
    d.includes("truworths") ||
    d.includes("mr price") ||
    d.includes("payflex") ||
    d.includes("hardware") ||
    d.includes("kolo motors")
  )
    return "Office Expenses (e.g. coffee, heater, handy andy, etc.)";

  if (
    d.includes("outsurance") ||
    d.includes("vees gadgets") ||
    d.includes("flm secunda") ||
    d.includes("megatro") ||
    d.includes("cash pos")
  )
    return "Other expenses (ad hoc expenses) business only";

  if (d.includes("studocu") || d.includes("jsa")) return "Training";

  if (
    d.includes("cashb") ||
    d.includes("usave") ||
    d.includes("west pack") ||
    d.includes("takealo")
  )
    return "Office Expenses (e.g. coffee, heater, handy andy, etc.)";

  if (d.includes("pos purchase"))
    return "Office Expenses (e.g. coffee, heater, handy andy, etc.)";

  return isIncome ? "Uncategorized Income" : "Uncategorized Expenses";
};

export function CSVDataTable({ csvContent }: CSVDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isGrouped, setIsGrouped] = useState(true);
  const [groupedRows, setGroupedRows] = useState<GroupedRow[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [userClassifications, setUserClassifications] = useState<
    Record<string, string>
  >({});
  const [showClassificationDialog, setShowClassificationDialog] =
    useState(false);
  const [currentGroupToClassify, setCurrentGroupToClassify] =
    useState<string>("");
  const [newClassification, setNewClassification] = useState<string>("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<
    "all" | "credit" | "debit"
  >("all");

  const [showFinancialReport, setShowFinancialReport] = useState(false);
  const [financialCategories, setFinancialCategories] = useState<
    FinancialCategory[]
  >([]);
  const [reportActiveTab, setReportActiveTab] = useState("summary");

  // Parse CSV content into rows and columns
  const parseCSV = (csv: string) => {
    if (!csv) return { headers: [], rows: [] };

    const lines = csv.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse headers (first line)
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    // Parse data rows
    let rows = lines.slice(1).map((line) => parseCSVLine(line));

    // Filter out rows where:
    // 1. The row doesn't have at least 3 columns (date, description, amount)
    // 2. The first column doesn't look like a date
    // 3. The third column doesn't look like a numeric value (amount)
    const datePattern =
      /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
    const amountPattern = /^[\d,.]+\.?\d*$/; // Pattern for numeric values

    // Check if we have a balance column (4th column)
    const hasBalanceColumn = rows.some(
      (row) =>
        row.length >= 4 &&
        /^[\d,.]+\.?\d*$/.test(row[3].replace(/[R$]/g, "").replace(/,/g, ""))
    );

    // Sort rows by date if possible to ensure chronological order for balance comparison
    if (datePattern.test(rows[0]?.[0] || "")) {
      rows.sort((a, b) => {
        try {
          const dateA = new Date(a[0]);
          const dateB = new Date(b[0]);
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return dateA.getTime() - dateB.getTime();
          }
        } catch (e) {
          // If date parsing fails, maintain original order
        }
        return 0;
      });
    }

    // Filter valid transaction rows
    rows = rows.filter((row) => {
      // Skip empty rows or rows with fewer than 3 columns
      if (row.length < 3) return false;

      // Check if the first column contains a date pattern
      const hasDate = datePattern.test(row[0]);

      // Check if the third column contains a numeric value (amount)
      // First clean up the value by removing currency symbols and commas
      const amountValue = row[2].replace(/[R$]/g, "").replace(/,/g, "").trim();
      const hasAmount = amountPattern.test(amountValue);

      // Only keep rows that have all three required values
      return hasDate && row[1].trim() !== "" && hasAmount;
    });

    // Process rows to determine transaction types based on balance changes
    if (hasBalanceColumn) {
      let previousBalance = null;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].length >= 4) {
          const balanceStr = rows[i][3]
            .replace(/[R$]/g, "")
            .replace(/,/g, "")
            .trim();
          const balance = Number.parseFloat(balanceStr);

          if (!isNaN(balance) && previousBalance !== null) {
            // Add transaction type based on balance change
            const amountStr = rows[i][2]
              .replace(/[R$]/g, "")
              .replace(/,/g, "")
              .trim();
            const amount = Number.parseFloat(amountStr);

            // If balance increased, it's a credit; if decreased, it's a debit
            if (balance > previousBalance) {
              rows[i].push("credit");
            } else if (balance < previousBalance) {
              rows[i].push("debit");
            } else {
              // If balance didn't change, determine by amount sign or description
              rows[i].push(amount >= 0 ? "credit" : "debit");
            }
          } else {
            // For the first row or if balance parsing fails
            const amountStr = rows[i][2]
              .replace(/[R$]/g, "")
              .replace(/,/g, "")
              .trim();
            const amount = Number.parseFloat(amountStr);
            rows[i].push(amount >= 0 ? "credit" : "debit");
          }

          previousBalance = balance;
        } else {
          // If no balance column, determine by amount sign
          const amountStr = rows[i][2]
            .replace(/[R$]/g, "")
            .replace(/,/g, "")
            .trim();
          const amount = Number.parseFloat(amountStr);
          rows[i].push(amount >= 0 ? "credit" : "debit");
        }
      }
    } else {
      // If no balance column, determine transaction type by amount sign
      rows = rows.map((row) => {
        const amountStr = row[2].replace(/[R$]/g, "").replace(/,/g, "").trim();
        const amount = Number.parseFloat(amountStr);
        if (row.length < 5) {
          row.push(amount >= 0 ? "credit" : "debit");
        }
        return row;
      });
    }

    // Apply business rules for transaction type classification
    rows = rows.map((row) => {
      const description = row[1].toLowerCase();
      const amountStr = row[2].replace(/[R$]/g, "").replace(/,/g, "").trim();
      const amount = Number.parseFloat(amountStr);

      // If we already determined type from balance comparison, use that unless overridden by specific rules
      let type = row.length >= 5 ? row[4] : amount >= 0 ? "credit" : "debit";

      // Apply specific business rules
      if (
        description.includes("fuel") ||
        description.includes("petrol") ||
        description.includes("diesel")
      ) {
        type = "debit"; // Fuel is always a debit
      } else if (
        description.includes("medical") ||
        description.includes("pharmacy") ||
        description.includes("supplies")
      ) {
        type = "debit"; // Medical supplies are always expenses
      } else if (
        description.includes("woolworths") ||
        description.includes("checkers") ||
        description.includes("spar") ||
        description.includes("pnp") ||
        description.includes("pos purchase") ||
        description.includes("retail")
      ) {
        type = "debit"; // Retail store purchases are always debits
      } else if (
        description.includes("deposit") ||
        description.includes("payment received")
      ) {
        type = "credit"; // Deposits are always credits
      }

      // If row already has a type field, update it; otherwise add it
      if (row.length >= 5) {
        row[4] = type;
      } else {
        row.push(type);
      }

      return row;
    });

    return { headers, rows };
  };

  // Parse a single CSV line, handling quoted values
  const parseCSVLine = (line: string) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // Handle escaped quotes (two double quotes in a row)
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current);

    return result;
  };

  // Group rows by description, with special handling for user classifications
  const groupRowsByDescription = (rows: string[][]) => {
    const groups: Record<string, GroupedRow> = {};

    rows.forEach((row) => {
      if (row.length < 3) return;

      const description = row[1].trim();
      const amountStr = row[2].replace(/[R$]/g, "").replace(/,/g, "").trim();
      const amount = Number.parseFloat(amountStr) || 0;

      // Get transaction type (either from the 5th column if available, or determine from amount)
      const transactionType =
        row.length >= 5 ? row[4] : amount >= 0 ? "credit" : "debit";

      // Skip based on transaction type filter
      if (transactionTypeFilter === "credit" && transactionType !== "credit")
        return;
      if (transactionTypeFilter === "debit" && transactionType !== "debit")
        return;

      // Use the original description as the group key
      const groupKey = description;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          description: groupKey,
          count: 0,
          totalAmount: 0,
          rows: [],
          isExpanded: expandedGroups[groupKey] || false,
        };
      }

      groups[groupKey].count++;
      groups[groupKey].totalAmount += amount;
      groups[groupKey].rows.push(row);
    });

    // Convert to array and sort by total amount (descending)
    return Object.values(groups).sort(
      (a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount)
    );
  };

  // Toggle group expansion
  const toggleGroup = (description: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [description]: !prev[description],
    }));
  };

  const { headers, rows } = parseCSV(csvContent);

  // Add a note about the date filtering
  const filteredOutCount = csvContent
    ? csvContent.split("\n").length - 1 - rows.length
    : 0;

  // Filter rows based on search term and transaction type
  const filteredRows = rows.filter((row) => {
    // First check transaction type filter
    if (row.length >= 3) {
      const amountStr = row[2].replace(/[R$]/g, "").replace(/,/g, "").trim();
      const amount = Number.parseFloat(amountStr) || 0;

      if (transactionTypeFilter === "credit" && amount < 0) return false;
      if (transactionTypeFilter === "debit" && amount >= 0) return false;
    }

    // Then check search term
    return row.some((cell) =>
      cell.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Group rows if grouping is enabled
  const groupedData = groupRowsByDescription(filteredRows);

  // Format currency amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const generateFinancialReport = () => {
    // Create a map of categories with the comprehensive list provided
    const categories: Record<string, FinancialCategory> = {
      // Income categories
      "Consultations - Cash and debit Card": {
        name: "Consultations - Cash and debit Card",
        amount: 0,
        groups: [],
      },
      "Consultations - Medical Aid": {
        name: "Consultations - Medical Aid",
        amount: 0,
        groups: [],
      },
      "Other Income (e.g. Ihokha, VSwitch)": {
        name: "Other Income (e.g. Ihokha, VSwitch)",
        amount: 0,
        groups: [],
      },
      "Unjani Membership Cards": {
        name: "Unjani Membership Cards",
        amount: 0,
        groups: [],
      },
      "OTC's (Other Sales)": {
        name: "OTC's (Other Sales)",
        amount: 0,
        groups: [],
      },
      "Interest Received (Business Bank Account)": {
        name: "Interest Received (Business Bank Account)",
        amount: 0,
        groups: [],
      },
      "Operational Donation (from NPC)": {
        name: "Operational Donation (from NPC)",
        amount: 0,
        groups: [],
      },
      "TOTAL INCOME": { name: "TOTAL INCOME", amount: 0, groups: [] },

      // Personnel costs
      "PERSONNEL COSTS": { name: "PERSONNEL COSTS", amount: 0, groups: [] },
      "Drawing - Professional Nurse (Salary)": {
        name: "Drawing - Professional Nurse (Salary)",
        amount: 0,
        groups: [],
      },
      "Salary - Permanent Professional Nurse Locum": {
        name: "Salary - Permanent Professional Nurse Locum",
        amount: 0,
        groups: [],
      },
      "Salary - Locum Nurse": {
        name: "Salary - Locum Nurse",
        amount: 0,
        groups: [],
      },
      "Salary - Locum Enrolled Nurse": {
        name: "Salary - Locum Enrolled Nurse",
        amount: 0,
        groups: [],
      },
      "Salary - Locum Clinic Assistant": {
        name: "Salary - Locum Clinic Assistant",
        amount: 0,
        groups: [],
      },
      "Salary - Enrolled Nurse": {
        name: "Salary - Enrolled Nurse",
        amount: 0,
        groups: [],
      },
      "Salary - Health Care Worker": {
        name: "Salary - Health Care Worker",
        amount: 0,
        groups: [],
      },
      "Salary - Clinic Assistant 1": {
        name: "Salary - Clinic Assistant 1",
        amount: 0,
        groups: [],
      },
      "Salary - Clinic Assistant 2": {
        name: "Salary - Clinic Assistant 2",
        amount: 0,
        groups: [],
      },
      "Salary - Clinic Assistant 3": {
        name: "Salary - Clinic Assistant 3",
        amount: 0,
        groups: [],
      },
      "Salary - Clinic Assistant 4": {
        name: "Salary - Clinic Assistant 4",
        amount: 0,
        groups: [],
      },
      "Salary - Casual Worker": {
        name: "Salary - Casual Worker",
        amount: 0,
        groups: [],
      },
      "Salary - Gardener": { name: "Salary - Gardener", amount: 0, groups: [] },
      "Salary - Cleaner": { name: "Salary - Cleaner", amount: 0, groups: [] },
      "Salary - Security Guard": {
        name: "Salary - Security Guard",
        amount: 0,
        groups: [],
      },
      "Bonus / Tax Provision": {
        name: "Bonus / Tax Provision",
        amount: 0,
        groups: [],
      },
      "UIF (1% Employee & 1% Employer)": {
        name: "UIF (1% Employee & 1% Employer)",
        amount: 0,
        groups: [],
      },
      "PAYE, SDL & UIF": { name: "PAYE, SDL & UIF", amount: 0, groups: [] },
      "Medical Aid": { name: "Medical Aid", amount: 0, groups: [] },
      "Life Insurance": { name: "Life Insurance", amount: 0, groups: [] },

      // Other operating expenses
      "OTHER OPERATING EXPENSES": {
        name: "OTHER OPERATING EXPENSES",
        amount: 0,
        groups: [],
      },
      "Bank Charges": { name: "Bank Charges", amount: 0, groups: [] },
      Donations: { name: "Donations", amount: 0, groups: [] },
      "Fuel / Maintenance": {
        name: "Fuel / Maintenance",
        amount: 0,
        groups: [],
      },
      "Laboratory Fees": { name: "Laboratory Fees", amount: 0, groups: [] },
      "Lisences (e.g. BHF, SPNP, SAHIV, SANC, etc.)": {
        name: "Lisences (e.g. BHF, SPNP, SAHIV, SANC, etc.)",
        amount: 0,
        groups: [],
      },
      Maintenance: { name: "Maintenance", amount: 0, groups: [] },
      "Medical Aid Claims (admin)": {
        name: "Medical Aid Claims (admin)",
        amount: 0,
        groups: [],
      },
      "Medical Suppliers (Other)": {
        name: "Medical Suppliers (Other)",
        amount: 0,
        groups: [],
      },
      "Office Expenses (e.g. coffee, heater, handy andy, etc.)": {
        name: "Office Expenses (e.g. coffee, heater, handy andy, etc.)",
        amount: 0,
        groups: [],
      },
      "Other expenses (ad hoc expenses) business only": {
        name: "Other expenses (ad hoc expenses) business only",
        amount: 0,
        groups: [],
      },
      "Plumbing / Labor Expenses": {
        name: "Plumbing / Labor Expenses",
        amount: 0,
        groups: [],
      },
      Rental: { name: "Rental", amount: 0, groups: [] },
      "Repairs & Maintenance": {
        name: "Repairs & Maintenance",
        amount: 0,
        groups: [],
      },
      "Security Service Company": {
        name: "Security Service Company",
        amount: 0,
        groups: [],
      },
      Stationery: { name: "Stationery", amount: 0, groups: [] },
      "Tax Consultant Fee": {
        name: "Tax Consultant Fee",
        amount: 0,
        groups: [],
      },
      "Telephone / Internet": {
        name: "Telephone / Internet",
        amount: 0,
        groups: [],
      },
      Training: { name: "Training", amount: 0, groups: [] },
      "Unjani Membership Card (Vswitch)": {
        name: "Unjani Membership Card (Vswitch)",
        amount: 0,
        groups: [],
      },
      "Utilities (electricity, water, etc)": {
        name: "Utilities (electricity, water, etc)",
        amount: 0,
        groups: [],
      },

      // Uncategorized
      "Uncategorized Expenses": {
        name: "Uncategorized Expenses",
        amount: 0,
        groups: [],
      },
      "Uncategorized Income": {
        name: "Uncategorized Income",
        amount: 0,
        groups: [],
      },
      "TOTAL EXPENSES": { name: "TOTAL EXPENSES", amount: 0, groups: [] },
    };

    // Process all grouped data
    groupedData.forEach((group) => {
      // Determine if this is income or expense based on the transaction type or amount
      const isIncome =
        group.rows[0].length >= 5 && group.rows[0][4] === "credit";

      // Get the user classification if available
      const userClassification = userClassifications[group.description];

      // Use either user classification or auto-categorization
      const categoryKey =
        userClassification || getAutoCategory(group.description, isIncome);

      if (categories[categoryKey]) {
        // Add to the appropriate category
        categories[categoryKey].amount += group.totalAmount;
        categories[categoryKey].groups.push(group.description);
      }

      if (isIncome) {
        // Add to TOTAL INCOME
        categories["TOTAL INCOME"].amount += group.totalAmount;
      } else {
        // Add to TOTAL EXPENSES
        categories["TOTAL EXPENSES"].amount += Math.abs(group.totalAmount);

        // Add to appropriate parent category if applicable
        if (
          categoryKey.startsWith("Salary") ||
          [
            "Drawing - Professional Nurse (Salary)",
            "Bonus / Tax Provision",
            "UIF (1% Employee & 1% Employer)",
            "PAYE, SDL & UIF",
            "Medical Aid",
            "Life Insurance",
          ].includes(categoryKey)
        ) {
          categories["PERSONNEL COSTS"].amount += group.totalAmount;
        } else if (
          ![
            "PERSONNEL COSTS",
            "OTHER OPERATING EXPENSES",
            "TOTAL EXPENSES",
          ].includes(categoryKey)
        ) {
          categories["OTHER OPERATING EXPENSES"].amount += group.totalAmount;
        }
      }
    });

    // Convert to array and filter out empty categories
    const categoriesArray = Object.values(categories)
      .filter((cat) => cat.amount !== 0 || cat.groups.length > 0)
      .sort((a, b) => {
        // First sort by category type
        const getCategoryOrder = (name: string) => {
          if (name === "TOTAL INCOME") return -100;
          if (name === "TOTAL EXPENSES") return -50;
          if (name === "PERSONNEL COSTS") return -40;
          if (name === "OTHER OPERATING EXPENSES") return -30;

          // Income categories first
          if (
            name.includes("Consultations") ||
            name.includes("Other Income") ||
            name.includes("Unjani Membership Cards") ||
            name.includes("OTC's") ||
            name.includes("Interest") ||
            name.includes("Donation")
          ) {
            return -90;
          }

          // Personnel costs next
          if (
            name.includes("Salary") ||
            name.includes("Drawing") ||
            name.includes("UIF") ||
            name.includes("PAYE") ||
            name.includes("Medical Aid") ||
            name.includes("Life Insurance")
          ) {
            return -35;
          }

          // Other expenses last
          return 0;
        };

        const orderA = getCategoryOrder(a.name);
        const orderB = getCategoryOrder(b.name);

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // Then sort by absolute amount (highest first)
        return Math.abs(b.amount) - Math.abs(a.amount);
      });

    setFinancialCategories(categoriesArray);
    setShowFinancialReport(true);
  };

  const downloadFinancialReport = () => {
    // Create CSV content
    let csvContent = "Category,Amount,Type,Groups\n";

    financialCategories.forEach((category) => {
      const amount = formatAmount(category.amount).replace(/[R,]/g, "");
      const type = category.amount >= 0 ? "Credit" : "Debit";
      const groups = category.groups.join("; ");
      csvContent += `"${category.name}","${amount}","${type}","${groups}"\n`;
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "financial_report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (headers.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No data available
      </div>
    );
  }

  const ClassificationDialog = () => (
    <Dialog
      open={showClassificationDialog}
      onOpenChange={setShowClassificationDialog}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Classify Transaction Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group</Label>
            <Input
              id="groupName"
              value={currentGroupToClassify}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="classification">Classification</Label>
            <Select
              value={newClassification}
              onValueChange={setNewClassification}
            >
              <SelectTrigger id="classification">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {/* Income Categories */}
                <SelectItem value="Consultations - Cash and debit Card">
                  Consultations - Cash and debit Card
                </SelectItem>
                <SelectItem value="Consultations - Medical Aid">
                  Consultations - Medical Aid
                </SelectItem>
                <SelectItem value="Other Income (e.g. Ihokha, VSwitch)">
                  Other Income (e.g. Ihokha, VSwitch)
                </SelectItem>
                <SelectItem value="Unjani Membership Cards">
                  Unjani Membership Cards
                </SelectItem>
                <SelectItem value="OTC's (Other Sales)">
                  OTC's (Other Sales)
                </SelectItem>
                <SelectItem value="Interest Received (Business Bank Account)">
                  Interest Received (Business Bank Account)
                </SelectItem>
                <SelectItem value="Operational Donation (from NPC)">
                  Operational Donation (from NPC)
                </SelectItem>

                {/* Personnel Costs */}
                <SelectItem value="Drawing - Professional Nurse (Salary)">
                  Drawing - Professional Nurse (Salary)
                </SelectItem>
                <SelectItem value="Salary - Permanent Professional Nurse Locum">
                  Salary - Permanent Professional Nurse Locum
                </SelectItem>
                <SelectItem value="Salary - Locum Nurse">
                  Salary - Locum Nurse
                </SelectItem>
                <SelectItem value="Salary - Locum Enrolled Nurse">
                  Salary - Locum Enrolled Nurse
                </SelectItem>
                <SelectItem value="Salary - Locum Clinic Assistant">
                  Salary - Locum Clinic Assistant
                </SelectItem>
                <SelectItem value="Salary - Enrolled Nurse">
                  Salary - Enrolled Nurse
                </SelectItem>
                <SelectItem value="Salary - Health Care Worker">
                  Salary - Health Care Worker
                </SelectItem>
                <SelectItem value="Salary - Clinic Assistant 1">
                  Salary - Clinic Assistant 1
                </SelectItem>
                <SelectItem value="Salary - Clinic Assistant 2">
                  Salary - Clinic Assistant 2
                </SelectItem>
                <SelectItem value="Salary - Clinic Assistant 3">
                  Salary - Clinic Assistant 3
                </SelectItem>
                <SelectItem value="Salary - Clinic Assistant 4">
                  Salary - Clinic Assistant 4
                </SelectItem>
                <SelectItem value="Salary - Casual Worker">
                  Salary - Casual Worker
                </SelectItem>
                <SelectItem value="Salary - Gardener">
                  Salary - Gardener
                </SelectItem>
                <SelectItem value="Salary - Cleaner">
                  Salary - Cleaner
                </SelectItem>
                <SelectItem value="Salary - Security Guard">
                  Salary - Security Guard
                </SelectItem>
                <SelectItem value="Bonus / Tax Provision">
                  Bonus / Tax Provision
                </SelectItem>
                <SelectItem value="UIF (1% Employee & 1% Employer)">
                  UIF (1% Employee & 1% Employer)
                </SelectItem>
                <SelectItem value="PAYE, SDL & UIF">PAYE, SDL & UIF</SelectItem>
                <SelectItem value="Medical Aid">Medical Aid</SelectItem>
                <SelectItem value="Life Insurance">Life Insurance</SelectItem>

                {/* Operating Expenses */}
                <SelectItem value="Bank Charges">Bank Charges</SelectItem>
                <SelectItem value="Donations">Donations</SelectItem>
                <SelectItem value="Fuel / Maintenance">
                  Fuel / Maintenance
                </SelectItem>
                <SelectItem value="Laboratory Fees">Laboratory Fees</SelectItem>
                <SelectItem value="Lisences (e.g. BHF, SPNP, SAHIV, SANC, etc.)">
                  Lisences (e.g. BHF, SPNP, SAHIV, SANC, etc.)
                </SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Medical Aid Claims (admin)">
                  Medical Aid Claims (admin)
                </SelectItem>
                <SelectItem value="Medical Suppliers (Other)">
                  Medical Suppliers (Other)
                </SelectItem>
                <SelectItem value="Office Expenses (e.g. coffee, heater, handy andy, etc.)">
                  Office Expenses (e.g. coffee, heater, handy andy, etc.)
                </SelectItem>
                <SelectItem value="Other expenses (ad hoc expenses) business only">
                  Other expenses (ad hoc expenses) business only
                </SelectItem>
                <SelectItem value="Plumbing / Labor Expenses">
                  Plumbing / Labor Expenses
                </SelectItem>
                <SelectItem value="Rental">Rental</SelectItem>
                <SelectItem value="Repairs & Maintenance">
                  Repairs & Maintenance
                </SelectItem>
                <SelectItem value="Security Service Company">
                  Security Service Company
                </SelectItem>
                <SelectItem value="Stationery">Stationery</SelectItem>
                <SelectItem value="Tax Consultant Fee">
                  Tax Consultant Fee
                </SelectItem>
                <SelectItem value="Telephone / Internet">
                  Telephone / Internet
                </SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Unjani Membership Card (Vswitch)">
                  Unjani Membership Card (Vswitch)
                </SelectItem>
                <SelectItem value="Utilities (electricity, water, etc)">
                  Utilities (electricity, water, etc)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (currentGroupToClassify && newClassification) {
                setUserClassifications((prev) => ({
                  ...prev,
                  [currentGroupToClassify]: newClassification,
                }));
                setShowClassificationDialog(false);
              }
            }}
          >
            Save Classification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const FinancialReportDialog = () => (
    <Dialog open={showFinancialReport} onOpenChange={setShowFinancialReport}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Financial Report</DialogTitle>
        </DialogHeader>

        <Tabs value={reportActiveTab} onValueChange={setReportActiveTab}>
          <TabsList className="mb-4 grid grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Income (Credit)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatAmount(
                        financialCategories
                          .filter((c) => c.name === "TOTAL INCOME")
                          .reduce((sum, c) => sum + c.amount, 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Expenses (Debit)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatAmount(
                        financialCategories
                          .filter((c) => c.name === "TOTAL EXPENSES")
                          .reduce((sum, c) => sum + c.amount, 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Income Categories First */}
                    {financialCategories
                      .filter((c) => c.amount >= 0)
                      .map((category) => {
                        const totalIncome = financialCategories
                          .filter((c) => c.name === "TOTAL INCOME")
                          .reduce((sum, c) => sum + c.amount, 0);
                        const percentage =
                          totalIncome === 0
                            ? 0
                            : (Math.abs(category.amount) / totalIncome) * 100;

                        return (
                          <TableRow key={category.name}>
                            <TableCell className="font-medium">
                              {category.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                              >
                                Income
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {formatAmount(category.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}

                    {/* Expense Categories Next */}
                    {financialCategories
                      .filter((c) => c.amount < 0)
                      .map((category) => {
                        const totalExpenses = financialCategories
                          .filter((c) => c.name === "TOTAL EXPENSES")
                          .reduce((sum, c) => sum + c.amount, 0);
                        const percentage =
                          totalExpenses === 0
                            ? 0
                            : (Math.abs(category.amount) / totalExpenses) * 100;

                        return (
                          <TableRow key={category.name}>
                            <TableCell className="font-medium">
                              {category.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                              >
                                Expense
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-red-600">
                              {formatAmount(Math.abs(category.amount))}
                            </TableCell>
                            <TableCell className="text-right">
                              {percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-4">
              {financialCategories.map((category) => (
                <Card key={category.name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{category.name}</span>
                        <Badge
                          variant="outline"
                          className={
                            category.amount >= 0
                              ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                              : "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                          }
                        >
                          {category.amount >= 0 ? "Credit" : "Debit"}
                        </Badge>
                      </div>
                      <span
                        className={
                          category.amount >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatAmount(category.amount)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <strong>Groups included:</strong>
                      <ul className="mt-1 list-disc pl-5">
                        {category.groups.map((group, index) => (
                          <li key={index}>{group}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            {financialCategories.filter(
              (c) => c.name === "Uncategorized" && c.groups.length > 0
            ).length > 0 && (
              <span className="text-amber-600">
                Warning: Some transactions are uncategorized
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadFinancialReport}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button onClick={() => setShowFinancialReport(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={transactionTypeFilter}
            onValueChange={(value) =>
              setTransactionTypeFilter(value as "all" | "credit" | "debit")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="credit">Credits Only</SelectItem>
              <SelectItem value="debit">Debits Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="group-mode"
              checked={isGrouped}
              onCheckedChange={setIsGrouped}
            />
            <Label htmlFor="group-mode">Group similar transactions</Label>
          </div>
          <div className="text-muted-foreground text-sm">
            {filteredOutCount > 0 && (
              <span className="mr-4">
                Filtered out {filteredOutCount} non-transaction rows
              </span>
            )}
            Showing {filteredRows.length} of {rows.length} rows
          </div>
        </div>
      </div>

      {isGrouped && (
        <div className="flex justify-end">
          <Button onClick={generateFinancialReport} className="mb-2">
            <PieChart className="mr-2 h-4 w-4" />
            Generate Financial Report
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        {isGrouped ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedData.length > 0 ? (
                groupedData.map((group) => (
                  <>
                    <TableRow key={group.key} className="hover:bg-muted/50">
                      <TableCell
                        onClick={() => toggleGroup(group.description)}
                        className="cursor-pointer"
                      >
                        {expandedGroups[group.description] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {userClassifications[group.description] ? (
                            <>
                              <span>{group.description}</span>
                              <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
                                {userClassifications[group.description]}
                              </Badge>
                            </>
                          ) : (
                            <>
                              {group.description}
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentGroupToClassify(group.description);
                                  setNewClassification("");
                                  setShowClassificationDialog(true);
                                }}
                              >
                                Classify
                              </Button>
                            </>
                          )}
                          <Badge variant="outline" className="ml-2">
                            <Layers className="mr-1 h-3 w-3" />
                            {group.count}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{group.count}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            (group.rows[0].length >= 5 &&
                              group.rows[0][4] === "credit") ||
                            group.totalAmount >= 0
                              ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                              : "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                          }
                        >
                          {group.rows[0].length >= 5 && group.rows[0][4]
                            ? group.rows[0][4].charAt(0).toUpperCase() +
                              group.rows[0][4].slice(1)
                            : group.totalAmount >= 0
                              ? "Credit"
                              : "Debit"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${group.totalAmount >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatAmount(group.totalAmount)}
                      </TableCell>
                    </TableRow>
                    {expandedGroups[group.description] &&
                      group.rows.map((row, rowIndex) => (
                        <TableRow
                          key={`${group.key}-${rowIndex}`}
                          className="bg-muted/30"
                        >
                          <TableCell></TableCell>
                          <TableCell colSpan={2} className="text-sm">
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">
                                {row[0]}
                              </span>
                              {/* Show original description for grouped items */}
                              {(group.description === "ADT Cash Deposits" ||
                                group.description === "Cash Deposits") && (
                                <span>{row[1]}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge
                              variant="outline"
                              className={
                                (row.length >= 5 && row[4] === "credit") ||
                                Number.parseFloat(
                                  row[2].replace(/[R$]/g, "").replace(/,/g, "")
                                ) >= 0
                                  ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                                  : "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                              }
                            >
                              {row.length >= 5
                                ? row[4].charAt(0).toUpperCase() +
                                  row[4].slice(1)
                                : Number.parseFloat(
                                      row[2]
                                        .replace(/[R$]/g, "")
                                        .replace(/,/g, "")
                                    ) >= 0
                                  ? "Credit"
                                  : "Debit"}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right text-sm ${Number.parseFloat(row[2].replace(/[R$]/g, "").replace(/,/g, "")) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {row[2]}
                          </TableCell>
                        </TableRow>
                      ))}
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={index}>{header}</TableHead>
                ))}
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.slice(0, headers.length).map((cell, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        className={
                          cellIndex === 2
                            ? `${Number.parseFloat(cell.replace(/[R$]/g, "").replace(/,/g, "")) >= 0 ? "text-green-600" : "text-red-600"}`
                            : ""
                        }
                      >
                        {cell}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          row.length >= 5 && row[4] === "credit"
                            ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                            : "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {row.length >= 5
                          ? row[4].charAt(0).toUpperCase() + row[4].slice(1)
                          : Number.parseFloat(
                                row[2].replace(/[R$]/g, "").replace(/,/g, "")
                              ) >= 0
                            ? "Credit"
                            : "Debit"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={headers.length + 1}
                    className="h-24 text-center"
                  >
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      {/* Add the classification dialog */}
      <ClassificationDialog />

      {/* Add the financial report dialog */}
      <FinancialReportDialog />
    </div>
  );
}
