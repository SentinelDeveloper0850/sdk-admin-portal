# Policy Signup Requests Action System

## Overview

This document describes the comprehensive action system implemented for policy signup requests. The system provides a complete workflow for managing signup requests from submission to final disposition.

## Features Implemented

### 1. Core Actions

| Action              | Description                                                                                  | Status Required | Admin Only |
| ------------------- | -------------------------------------------------------------------------------------------- | --------------- | ---------- |
| `view`              | Open and inspect the full request details                                                    | Any             | No         |
| `assign_consultant` | Assign an internal user (e.g. Scheme Consultant) to handle the request                       | submitted       | No         |
| `mark_as_reviewed`  | Tag as reviewed without deciding yet                                                         | submitted       | No         |
| `approve`           | Accept the request and start onboarding (e.g. generate policy number, create client profile) | reviewed        | No         |
| `reject`            | Deny the application (optionally with a reason)                                              | reviewed        | No         |
| `request_more_info` | Ask the applicant for missing/unclear information                                            | submitted       | No         |
| `add_notes`         | Add internal notes/comments about the request                                                | Any             | No         |
| `escalate`          | Escalate to a supervisor/manager if the request is complex or requires approval              | submitted       | No         |
| `archive`           | Move to archive if no further action is needed (e.g. duplicate or abandoned)                 | approved/rejected | No         |
| `delete`            | Permanently delete the request (soft delete with audit trail)                                | submitted/rejected/archived | Yes |

### 2. Status Workflow

The system implements a clear status workflow:

```
submitted → reviewed → approved/rejected
    ↓           ↓           ↓
pending_info  escalated   archived
    ↓           ↓           ↓
    └───────────┴───────────┘
                ↓
             deleted
```

- **submitted**: Initial state when request is created
- **reviewed**: Request has been reviewed but not yet decided
- **approved**: Request approved, policy created
- **rejected**: Request denied with reason
- **pending_info**: Waiting for additional information from applicant
- **escalated**: Escalated to higher authority
- **archived**: No further action needed
- **deleted**: Request permanently deleted (admin only)

### 3. Data Model Enhancements

The `IPolicySignUp` interface has been enhanced with new fields:

```typescript
interface IPolicySignUp {
  // ... existing fields ...
  
  // Assignment tracking
  assignedConsultant?: string;
  assignedConsultantName?: string;
  assignedAt?: Date;
  
  // Status and workflow
  currentStatus: "submitted" | "reviewed" | "approved" | "rejected" | "pending_info" | "escalated" | "archived" | "deleted";
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: Date;
    notes?: string;
  }>;
  
  // Notes and comments
  internalNotes: Array<{
    author: string;
    authorName: string;
    text: string;
    createdAt: Date;
    isPrivate?: boolean;
  }>;
  
  // Rejection and escalation details
  rejectionReason?: string;
  rejectionNotes?: string;
  escalatedTo?: string;
  escalatedToName?: string;
  escalatedAt?: Date;
  escalationReason?: string;
  
  // Policy creation details
  generatedPolicyNumber?: string;
  policyCreatedAt?: Date;
  policyCreatedBy?: string;
  
  // Request for more info
  requestedInfo?: Array<{
    field: string;
    description: string;
    requestedAt: Date;
    requestedBy: string;
    providedAt?: Date;
    providedValue?: string;
  }>;
  
  // Deletion details
  deletedAt?: Date;
  deletedBy?: string;
}
```

## Components

### 1. PolicySignupActions Component

Located at: `src/app/components/policy-signup-actions.tsx`

- Displays action buttons based on current status
- Shows status tag and assigned consultant
- Provides dropdown menu for all available actions
- Handles loading states for each action

### 2. PolicySignupViewModal Component

Located at: `src/app/components/policy-signup-view-modal.tsx`

- Comprehensive view of all request details
- Displays status history timeline
- Shows internal notes and requested information
- Displays assignment, escalation, and policy information

### 3. PolicySignupActionModals Component

Located at: `src/app/components/policy-signup-action-modals.tsx`

- Handles all action forms in a single modal
- Dynamic form rendering based on action type
- Validates required fields
- Integrates with API endpoints

## API Endpoints

### 1. Main Signup Requests API

**GET** `/api/policies/signup-requests`
- Fetches all signup requests (excluding deleted ones)
- Supports optional `id` parameter for specific request

**POST** `/api/policies/signup-requests`
- Creates new signup request
- Automatically sets initial status and history

**DELETE** `/api/policies/signup-requests`
- Deletes a signup request (soft delete)
- Requires admin privileges
- Only allows deletion of submitted, rejected, or archived requests

### 2. Individual Request Actions API

**GET** `/api/policies/signup-requests/[id]`
- Fetches specific signup request by ID

**PATCH** `/api/policies/signup-requests/[id]`
- Performs actions on specific request
- Supports all action types via `action` parameter

### 3. Users API

**GET** `/api/policies/signup-requests/users?type=consultants`
- Fetches available consultants for assignment

**GET** `/api/policies/signup-requests/users?type=escalation`
- Fetches users available for escalation

## Usage Examples

### 1. Assigning a Consultant

```typescript
const response = await fetch(`/api/policies/signup-requests/${requestId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'assign_consultant',
    consultantId: 'consultant-user-id',
    userId: 'current-user-id'
  })
});
```

### 2. Approving a Request

```typescript
const response = await fetch(`/api/policies/signup-requests/${requestId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'approve',
    policyNumber: 'POL-2024-001', // optional
    userId: 'current-user-id'
  })
});
```

### 3. Adding Notes

```typescript
const response = await fetch(`/api/policies/signup-requests/${requestId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add_notes',
    text: 'Internal note content',
    isPrivate: true,
    userId: 'current-user-id',
    authorName: 'User Name'
  })
});
```

### 4. Deleting a Request

```typescript
const response = await fetch('/api/policies/signup-requests', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'request-id',
    deletedBy: 'admin-user-id'
  })
});
```

## Testing

A test form is included in the main page for creating sample signup requests:

- Located at: `src/app/(protected)/policies/signup-requests/test-form.tsx`
- Accessible via collapsible section on the main page
- Allows testing of all action workflows

## Security and Permissions

- All actions require proper authentication
- Role-based access control via `withRoleGuard`
- Delete action restricted to admin users only
- Actions are logged with user information
- Status changes are tracked in history
- Deleted requests are soft-deleted with audit trail

## Error Handling

- Comprehensive error handling in all API endpoints
- User-friendly error messages
- Loading states for all actions
- Validation for required fields

## Future Enhancements

Potential improvements for future versions:

1. **Email Notifications**: Send emails to applicants when status changes
2. **SMS Notifications**: Send SMS for urgent updates
3. **Document Upload**: Allow file attachments to requests
4. **Bulk Actions**: Process multiple requests simultaneously
5. **Advanced Filtering**: Filter by status, date, consultant, etc.
6. **Reporting**: Generate reports on request processing times
7. **Workflow Automation**: Auto-assign based on rules
8. **Integration**: Connect with external systems

## Database Migration

If you have existing signup requests, you may need to migrate them to include the new fields:

```javascript
// Migration script example
db.policy_signup_requests.updateMany(
  { currentStatus: { $exists: false } },
  { 
    $set: { 
      currentStatus: "submitted",
      statusHistory: [{
        status: "submitted",
        changedBy: "system",
        changedAt: new Date(),
        notes: "Migrated from legacy system"
      }]
    }
  }
);
```

## Conclusion

This action system provides a comprehensive solution for managing policy signup requests with full audit trails, status tracking, and workflow management. The modular design allows for easy extension and customization based on specific business requirements.