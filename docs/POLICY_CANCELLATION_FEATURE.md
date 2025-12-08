# Policy Cancellation Request Feature

## Overview

The Policy Cancellation Request feature allows users to submit requests to cancel insurance policies through a user-friendly interface. The system includes comprehensive validation, email notifications, and administrative review capabilities.

## Features

### 🎯 Core Functionality

- **Request Submission**: Users can submit cancellation requests with detailed information
- **Validation**: Comprehensive client-side and server-side validation
- **Email Notifications**: Automatic email confirmations and status updates
- **Administrative Review**: Admins can approve or reject requests
- **Status Tracking**: Full audit trail of request lifecycle

### 📋 Form Fields

- **Policy Information**: Pre-filled policy ID, number, and member name
- **Cancellation Type**: Immediate, End of Period, or Specific Date
- **Effective Date**: Date when cancellation should take effect
- **Reason**: Dropdown with common cancellation reasons
- **Additional Notes**: Optional text area for additional context

### 🔧 Technical Features

- **Right Drawer Interface**: 60% width drawer following user preferences
- **Form Validation**: Real-time validation with helpful error messages
- **Accessibility**: ARIA labels and keyboard navigation support
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful error handling with user-friendly messages

## Database Schema

### PolicyCancellationRequest Model

```typescript
interface IPolicyCancellationRequest {
  policyId: mongoose.Types.ObjectId; // Reference to policy
  policyNumber: string; // Policy number
  memberName: string; // Member name
  reason: string; // Cancellation reason
  cancellationType: "immediate" | "end_of_period" | "specific_date";
  effectiveDate: Date; // When cancellation takes effect
  additionalNotes?: string; // Optional notes
  status: "pending" | "approved" | "rejected" | "cancelled";
  submittedBy: mongoose.Types.ObjectId; // User who submitted
  submittedAt: Date; // Submission timestamp
  reviewedBy?: mongoose.Types.ObjectId; // Admin who reviewed
  reviewedAt?: Date; // Review timestamp
  reviewNotes?: string; // Admin review notes
  emailSent: boolean; // Email notification sent
  emailSentAt?: Date; // Email timestamp
}
```

## API Endpoints

### POST `/api/policies/easipol/cancellation-request`

Submit a new cancellation request

**Request Body:**

```json
{
  "policyId": "string",
  "policyNumber": "string",
  "memberName": "string",
  "reason": "financial_hardship",
  "cancellationType": "immediate",
  "effectiveDate": "2024-01-15",
  "additionalNotes": "Optional notes"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cancellation request submitted successfully",
  "data": {
    "requestId": "string",
    "status": "pending",
    "submittedAt": "2024-01-15T10:30:00Z"
  }
}
```

### GET `/api/policies/easipol/cancellation-request`

Fetch cancellation requests with pagination and filtering

**Query Parameters:**

- `status`: Filter by status (pending, approved, rejected)
- `policyId`: Filter by policy ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### PATCH `/api/policies/easipol/cancellation-request/[id]`

Approve or reject a cancellation request

**Request Body:**

```json
{
  "action": "approve|reject",
  "reviewNotes": "Optional review notes"
}
```

### DELETE `/api/policies/easipol/cancellation-request/[id]`

Delete a pending cancellation request

## Email Notifications

### 1. Request Confirmation Email

Sent when a cancellation request is submitted

- **Subject**: `Policy Cancellation Request Submitted - [PolicyNumber]`
- **Content**: Request details, status, and next steps

### 2. Status Update Email

Sent when a request is approved or rejected

- **Subject**: `Policy Cancellation Request [Approved|Rejected] - [PolicyNumber]`
- **Content**: Decision, review notes, and contact information

## Validation Rules

### Client-Side Validation

- **Required Fields**: All mandatory fields must be filled
- **Date Validation**: Effective date must be appropriate for cancellation type
- **Character Limits**: Additional notes limited to 1000 characters

### Server-Side Validation

- **Policy Existence**: Verify policy exists in database
- **Duplicate Requests**: Prevent multiple pending requests for same policy
- **Date Logic**: Ensure effective dates make business sense
- **User Permissions**: Verify user has permission to submit requests

## User Interface

### Policy Table Integration

- **Action Menu**: "Request Cancellation" option in policy actions dropdown
- **Icon**: CloseOutlined icon for visual clarity
- **State Management**: Proper drawer state management

### Cancellation Request Drawer

- **Layout**: Right drawer with 60% width
- **Form Design**: Clean, organized form with helpful descriptions
- **Accessibility**: ARIA labels and screen reader support
- **Responsive**: Works on all device sizes

## Error Handling

### Client-Side Errors

- **Validation Errors**: Real-time form validation with clear messages
- **Network Errors**: Graceful handling of API failures
- **User Feedback**: SweetAlert confirmations and Ant Design messages

### Server-Side Errors

- **400 Bad Request**: Invalid data or validation failures
- **401 Unauthorized**: User not authenticated
- **404 Not Found**: Policy or request not found
- **409 Conflict**: Duplicate requests or already processed
- **500 Internal Server Error**: Server-side issues

## Testing

### Unit Tests

- **Component Tests**: Test form rendering and validation
- **API Tests**: Test endpoint functionality
- **Email Tests**: Test email sending functionality

### Test Coverage

- Form validation scenarios
- API error handling
- User interaction flows
- Accessibility features

## Security Considerations

### Authentication

- All endpoints require valid user session
- User ID tracked for audit trail

### Authorization

- Users can only submit requests for policies they have access to
- Only admins can approve/reject requests

### Data Validation

- Input sanitization and validation
- SQL injection prevention through Mongoose
- XSS prevention through proper encoding

## Performance Optimizations

### Database

- **Indexes**: Optimized indexes for common queries
- **Pagination**: Efficient pagination for large datasets
- **Population**: Selective field population to reduce data transfer

### Frontend

- **Lazy Loading**: Drawer loads only when needed
- **Form Optimization**: Efficient form state management
- **Error Boundaries**: Graceful error handling

## Future Enhancements

### Planned Features

- **Bulk Operations**: Process multiple requests at once
- **Advanced Filtering**: More sophisticated search and filter options
- **Workflow Integration**: Integration with approval workflows
- **Analytics**: Request analytics and reporting

### Potential Improvements

- **Real-time Updates**: WebSocket notifications for status changes
- **Document Upload**: Support for supporting documents
- **Mobile App**: Native mobile application support
- **API Rate Limiting**: Prevent abuse through rate limiting

## Deployment Notes

### Environment Variables

```env
RESEND_API_KEY=your_resend_api_key
MONGODB_URI=your_mongodb_connection_string
MONGODB_ATLAS_URI=your_mongodb_atlas_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
```

### Database Migration

No migration required - new collection will be created automatically.

### Email Configuration

Ensure Resend API key is configured for email notifications.

## Support and Maintenance

### Monitoring

- Monitor API response times
- Track email delivery rates
- Monitor error rates and types

### Maintenance

- Regular database cleanup of old requests
- Email template updates as needed
- Performance monitoring and optimization

## Troubleshooting

### Common Issues

1. **Email Not Sending**: Check Resend API key configuration
2. **Validation Errors**: Verify date formats and business rules
3. **Permission Errors**: Check user roles and permissions
4. **Database Errors**: Verify MongoDB connection and indexes

### Debug Mode

Enable debug logging for detailed error information:

```typescript
console.log("Cancellation request error:", error);
```

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintainer**: SDK Admin Portal Team
