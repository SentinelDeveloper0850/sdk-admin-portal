export enum ERoles {
  Admin = "admin",
  Member = "member",

  // Management
  BranchManager = "branch_manager",
  RegionalManager = "regional_manager",
  DepartmentManager = "department_manager",
  TeamLeader = "team_leader",
  Supervisor = "supervisor",

  // Claims & Compliance
  ClaimsOfficer = "claims_officer",
  ComplianceOfficer = "compliance_officer",
  ComplianceAuditor = "compliance_auditor",

  // HR & Finance
  HRManager = "hr_manager",
  FinanceOfficer = "finance_officer",
  Cashier = "cashier",
  CashupReviewer = "cashup_reviewer",
  EFTReviewer = "eft_reviewer",
  EFTAllocator = "eft_allocator",
  EasypayReviewer = "easypay_reviewer",
  EasypayAllocator = "easypay_allocator",

  // Funeral Operations
  FuneralCoordinator = "funeral_coordinator",

  // Sales & Client Relations
  SocietyConsultant = "society_consultant",
  SchemeConsultant = "scheme_consultant",
  SchemeConsultantOnline = "scheme_consultant_online",

  // Fleet & Logistics
  Driver = "driver",
  FleetManager = "fleet_manager",
  LogisticsCoordinator = "logistics_coordinator",
}
