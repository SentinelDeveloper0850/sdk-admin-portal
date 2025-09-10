# Daily Activity Reminders Setup Guide

## Overview

The Daily Activity Reminders system automatically sends email reminders to users who haven't submitted their daily activity reports by the configured cutoff time.

## Features

- **Configurable Schedule**: Set reminder time, cutoff time, and exclusion rules
- **Two-Stage Reminders**: First reminder (configurable offset) and final reminder
- **Flexible Recipients**: Send to all users or specific roles
- **Exclusion Rules**: Skip weekends, holidays, and specific dates
- **Manual Trigger**: Admin can manually trigger reminders
- **Statistics Dashboard**: View compliance rates and system status

## Configuration

### 1. System Configuration

Navigate to **Configurations > Daily Activity Reminders** to configure:

- **Enable/Disable**: Toggle the entire reminder system
- **Schedule Settings**:
  - Reminder Time: When reminders are sent (default: 16:00)
  - Cutoff Time: When reports are due (default: 18:00)
  - Exclude Weekends: Skip weekend reminders
  - Exclude Holidays: Skip holiday reminders (future feature)

- **Reminder Settings**:
  - First Reminder: Minutes before cutoff (default: 120 minutes)
  - Final Reminder: Minutes before cutoff (default: 30 minutes)

- **Recipient Settings**:
  - Send to All Users: Include all active users
  - Exclude Roles: Specific roles to exclude
  - Include Roles: Specific roles to include (if not sending to all)

### 2. Email Configuration

The system uses the existing Resend email service. Email templates are customizable and include:

- Professional HTML formatting
- Different styling for first vs final reminders
- Clear instructions for submitting reports
- Urgency indicators for final reminders

## Cron Job Setup

### Option 1: Vercel Cron Jobs (Recommended)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-activity-reminders?secret=YOUR_SECRET_KEY",
      "schedule": "0 16 * * 1-5"
    }
  ]
}
```

This runs the cron job at 16:00 (4 PM) on weekdays (Monday-Friday).

### Option 2: External Cron Service

Use services like:

- **Cron-job.org**: Free cron job service
- **EasyCron**: Paid service with more features
- **GitHub Actions**: For GitHub-hosted projects

Example cron expression: `0 16 * * 1-5` (4 PM on weekdays)

### Option 3: Server Cron (VPS/Server)

Add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs at 4 PM on weekdays)
0 16 * * 1-5 curl -X GET "https://your-domain.com/api/cron/daily-activity-reminders?secret=YOUR_SECRET_KEY"
```

## Environment Variables

Add these to your `.env.local`:

```env
# Optional: Secret key for cron job security
CRON_SECRET=your-secret-key-here

# Required: Resend API key (already configured)
RESEND_API_KEY=your-resend-api-key
```

## API Endpoints

### Get Reminder Data

```http
GET /api/daily-activity-reminders
GET /api/daily-activity-reminders?action=stats
GET /api/daily-activity-reminders?action=config
```

### Trigger Reminders Manually

```http
POST /api/daily-activity-reminders
Content-Type: application/json

{
  "action": "trigger"
}
```

### Save Configuration

```http
POST /api/daily-activity-reminders
Content-Type: application/json

{
  "action": "save",
  "config": {
    "isEnabled": true,
    "reminderTime": "16:00",
    "cutoffTime": "18:00",
    "excludeWeekends": true,
    "sendFirstReminder": true,
    "firstReminderOffset": 120,
    "sendFinalReminder": true,
    "finalReminderOffset": 30,
    "sendToAllUsers": true,
    "excludeRoles": [],
    "includeRoles": [],
    "emailSubject": "Daily Activity Report Reminder"
  }
}
```

### Cron Job Endpoint

```http
GET /api/cron/daily-activity-reminders?secret=YOUR_SECRET_KEY
```

## How It Works

1. **Scheduled Execution**: Cron job runs at configured time (default: 16:00)
2. **Date Validation**: Checks if reminders should run today (excludes weekends/holidays)
3. **Time Window Check**: Determines if it's time for first or final reminder
4. **Recipient Filtering**: Gets eligible users based on configuration
5. **Submission Check**: Skips users who have already submitted reports
6. **Email Sending**: Sends personalized reminder emails
7. **Statistics Update**: Records sent count and next run time

## Email Templates

### First Reminder

- **Subject**: "Reminder: Daily Activity Report - [Date]"
- **Style**: Warning yellow background
- **Content**: Polite reminder with instructions

### Final Reminder

- **Subject**: "Final Reminder: Daily Activity Report - [Date]"
- **Style**: Urgent red background
- **Content**: Stronger language emphasizing urgency

## Monitoring

### Dashboard Statistics

- System Status (Active/Inactive)
- Total Recipients
- Submitted Today
- Pending Today
- Last Run Time
- Next Run Time
- Total Reminders Sent

### Logs

Check your application logs for:

- Reminder processing results
- Email sending status
- Error messages
- Configuration changes

## Troubleshooting

### Common Issues

1. **Reminders not sending**:
   - Check if system is enabled
   - Verify cron job is running
   - Check email service configuration
   - Review recipient filters

2. **Wrong recipients**:
   - Verify user roles and status
   - Check include/exclude role settings
   - Ensure users have valid email addresses

3. **Timing issues**:
   - Verify timezone settings
   - Check reminder/cutoff time configuration
   - Review exclusion rules

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_REMINDERS=true
```

This will log detailed information about reminder processing.

## Security Considerations

1. **Cron Secret**: Use a strong secret key for cron job authentication
2. **Admin Access**: Only admins can configure and trigger reminders
3. **Email Validation**: System validates email addresses before sending
4. **Rate Limiting**: Consider implementing rate limiting for manual triggers

## Future Enhancements

- **Holiday Calendar**: Integration with holiday API
- **Custom Email Templates**: Admin-configurable email content
- **SMS Reminders**: Add SMS notification option
- **Escalation Rules**: Automatic escalation to managers
- **Analytics Dashboard**: Detailed compliance reporting
- **User Preferences**: Allow users to set reminder preferences

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review application logs
3. Verify configuration settings
4. Test with manual trigger
5. Contact system administrator
