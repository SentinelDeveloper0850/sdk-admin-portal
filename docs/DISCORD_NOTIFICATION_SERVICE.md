# Discord Notification Service

This document describes the Discord notification service implementation for the SDK Admin Portal.

## Overview

The Discord notification service provides automated notifications to Discord channels when certain events occur in the system, such as daily activity reminders being sent.

## Features

- **Rate Limiting**: Prevents spam by limiting notifications to 5 messages per minute per rate limit key
- **Rich Embeds**: Sends formatted Discord embeds with relevant information
- **Error Handling**: Graceful error handling with detailed logging
- **Configurable**: Uses environment variables for webhook URLs

## Environment Variables

Add the following environment variable to your `.env` file:

```env
DISCORD_GENERAL_WEBHOOK=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
```

## Usage

### 1. Daily Activity Reminders

When the "Send Reminders" button is clicked on the dashboard, the system will:

1. Send email reminders to non-compliant users
2. Send a Discord notification to the General channel with:
   - Number of reminders sent
   - Non-compliant user count
   - Total users
   - Compliance rate
   - Timestamp
   - Who triggered the action

### 2. Manual Testing

You can test the Discord service using the test endpoint:

```bash
POST /api/test-discord
Content-Type: application/json

{
  "message": "Your test message here",
  "type": "info" // or "warning", "error", "success"
}
```

## Rate Limiting

The service implements rate limiting to prevent spam:

- **System reminders**: 5 messages per minute (key: `daily-activity-reminders`)
- **Manual triggers**: 5 messages per minute (key: `daily-activity-reminders-manual`)
- **Test notifications**: 5 messages per minute (key: `test-discord`)

## API Functions

### `sendDiscordNotification(webhookUrl, payload, rateLimitKey?)`

Sends a Discord webhook notification with optional rate limiting.

### `createDailyActivityReminderNotification(...)`

Creates a formatted Discord embed for daily activity reminders.

### `createSystemNotification(title, description, type, fields?)`

Creates a formatted Discord embed for system notifications.

### `getDiscordWebhookUrl()`

Retrieves the Discord webhook URL from environment variables.

## Discord Embed Format

The service sends rich Discord embeds with:

- **Title**: Clear description of the event
- **Description**: Detailed information about what happened
- **Fields**: Key metrics and data points
- **Color**: Color-coded by type (green for success, red for errors, etc.)
- **Timestamp**: When the event occurred
- **Footer**: System identification

## Error Handling

- If the webhook URL is not configured, notifications are skipped gracefully
- If Discord API returns an error, it's logged but doesn't break the main functionality
- Rate limit errors are returned with appropriate messages

## Security Considerations

- Webhook URLs should be kept secure and not exposed in client-side code
- Rate limiting prevents abuse of the notification system
- All notifications are logged for audit purposes

## Troubleshooting

### Discord notifications not sending

1. Check that `DISCORD_GENERAL_WEBHOOK` is set in your environment variables
2. Verify the webhook URL is valid and active
3. Check server logs for any Discord API errors
4. Test using the `/api/test-discord` endpoint

### Rate limit errors

- Wait 1 minute before trying again
- The rate limit is per rate limit key, so different features have separate limits

### Webhook URL issues

- Ensure the webhook URL is complete and valid
- Check that the Discord channel still exists and the webhook is active
- Verify the webhook has permission to send messages to the channel
