export const roleLabels: Record<string, string> = {
  admin: "Admin",
  member: "Member",

  // Claims & Compliance
  claims_officer: "Claims Officer",
  compliance_auditor: "Compliance Auditor",

  // HR & Finance
  hr_manager: "HR Manager",
  finance_officer: "Finance Officer",
  cashier: "Cashier",

  // Funeral Ops
  funeral_coordinator: "Funeral Coordinator",

  // Sales & Client Relations
  society_consultant: "Society Consultant",
  scheme_consultant: "Scheme Consultant",
  scheme_consultant_online: "Scheme Consultant (Online)",

  // Fleet & Logistics
  driver: "Driver",
  fleet_manager: "Fleet Manager",
  logistics_coordinator: "Logistics Coordinator",
};

export const groupedRoles = [
  {
    category: "Core Roles",
    roles: [
      { key: "admin", label: "Admin", description: "Full system access and configuration" },
      { key: "member", label: "Member", description: "Standard access with limited permissions" },
    ],
  },
  {
    category: "Claims & Compliance",
    roles: [
      { key: "claims_officer", label: "Claims Officer", description: "Manages policyholder claims" },
      { key: "compliance_auditor", label: "Compliance Auditor", description: "Audits system and policy compliance" },
    ],
  },
  {
    category: "HR & Finance",
    roles: [
      { key: "hr_manager", label: "HR Manager", description: "Manages employees, leave and contracts" },
      { key: "finance_officer", label: "Finance Officer", description: "Handles payments and reconciliation" },
      { key: "cashier", label: "Cashier", description: "Captures payments and issues receipts" },
    ],
  },
  {
    category: "Funeral Operations",
    roles: [
      { key: "funeral_coordinator", label: "Funeral Coordinator", description: "Oversees funeral logistics and scheduling" },
    ],
  },
  {
    category: "Sales & Client Relations",
    roles: [
      { key: "society_consultant", label: "Society Consultant", description: "Supports and recruits social group leaders" },
      { key: "scheme_consultant", label: "Scheme Consultant", description: "Works with external burial schemes" },
    ],
  },
  {
    category: "Fleet & Logistics",
    roles: [
      { key: "driver", label: "Driver", description: "Operates fleet vehicles such as hearses or staff transport" },
      { key: "fleet_manager", label: "Fleet Manager", description: "Manages vehicles, drivers, and routes" },
      { key: "logistics_coordinator", label: "Logistics Coordinator", description: "Plans and coordinates movement and schedules" },
    ],
  },
];

export const roles = ["admin", "member"];

export const additionalRoles = [
  // Claims & Compliance
  "claims_officer", // Can submit and manage claims
  "compliance_auditor", // Can audit system usage, policy adherence

  // HR & Finance
  "hr_manager", // Handles leave, employees, contracts
  "finance_officer", // Handles payments, reports, reconciliations
  "cashier", // Captures payments, issues receipts

  // Funeral Ops
  "funeral_coordinator", // Oversees funeral arrangements and logistics

  // Sales & Client Relations
  "society_consultant", // Recruits and supports social group leaders
  "scheme_consultant", // Works with external schemes and burial plans

  // Fleet & Logistics
  "driver", // Assigned to transport duties (hearse, staff, goods)
  "fleet_manager", // Manages vehicle assignments, maintenance, route logs
  "logistics_coordinator", // Oversees transport schedules and movement planning
];