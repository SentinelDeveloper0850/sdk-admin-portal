export interface PolicyData {
  policyNumber: string;
  easyPayNumber: string;
}

/**
 * Parses the policy data file and extracts policy numbers with their corresponding EasyPay numbers
 * @param fileContent - The content of the file.txt
 * @returns Array of objects containing policy number and EasyPay number
 */
export function parsePolicyData(fileContent: string): PolicyData[] {
  const lines = fileContent.split("\n");
  const policyData: PolicyData[] = [];

  for (const line of lines) {
    // Skip empty lines and lines that are just whitespace
    if (!line.trim()) {
      continue;
    }

    // Skip header lines that contain "Policy_Number" or "EasyPayNumber"
    if (line.includes("Policy_Number") || line.includes("EasyPayNumber")) {
      continue;
    }

    // Extract policy number and EasyPay number
    const match = line.match(/^(\S+)\s+['"]?(\d{18})['"]?/);

    if (match) {
      const policyNumber = match[1].trim();
      const easyPayNumber = match[2].trim();

      // Validate that the EasyPay number starts with 9225 and is 18 digits
      if (easyPayNumber.startsWith("9225") && easyPayNumber.length === 18) {
        policyData.push({
          policyNumber,
          easyPayNumber,
        });
      }
    }
  }

  return policyData;
}

/**
 * Reads and parses the policy data file
 * @returns Promise that resolves to array of policy data objects
 */
export async function loadPolicyData(): Promise<PolicyData[]> {
  try {
    const response = await fetch("/file.txt");
    const fileContent = await response.text();
    return parsePolicyData(fileContent);
  } catch (error) {
    console.error("Error loading policy data:", error);
    return [];
  }
}

/**
 * Validates a single policy data entry
 * @param data - The policy data object to validate
 * @returns True if valid, false otherwise
 */
export function validatePolicyData(data: PolicyData): boolean {
  return (
    Boolean(data.policyNumber) &&
    data.policyNumber.trim() !== "" &&
    Boolean(data.easyPayNumber) &&
    data.easyPayNumber.length === 18 &&
    data.easyPayNumber.startsWith("9225") &&
    /^\d{18}$/.test(data.easyPayNumber)
  );
}

/**
 * Utility function to get policy data as a simple array format
 * @param fileContent - The content of the file.txt
 * @returns Array of [policyNumber, easyPayNumber] tuples
 */
export function getPolicyDataAsArray(fileContent: string): [string, string][] {
  const policyData = parsePolicyData(fileContent);
  return policyData.map((item) => [item.policyNumber, item.easyPayNumber]);
}

/**
 * Utility function to get policy data as a map for quick lookups
 * @param fileContent - The content of the file.txt
 * @returns Map with policy number as key and EasyPay number as value
 */
export function getPolicyDataAsMap(fileContent: string): Map<string, string> {
  const policyData = parsePolicyData(fileContent);
  const policyMap = new Map<string, string>();

  policyData.forEach((item) => {
    policyMap.set(item.policyNumber, item.easyPayNumber);
  });

  return policyMap;
}
