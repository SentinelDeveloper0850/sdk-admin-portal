# System Configurations

This document describes the system configurations feature that allows administrators to manage various system settings and policies.

## Overview

The configurations system provides a centralized way to manage:

- General system settings
- Security configurations
- Email and notification settings
- Policy configurations
- Payment settings

## Features

### 1. General Settings

- **Configuration Management**: Add, edit, and delete system configurations
- **Categories**: Organize configurations by category (system, security, email, notification, payment, policy)
- **Key-Value Pairs**: Store configuration values as strings, numbers, or booleans
- **Active/Inactive Status**: Enable or disable configurations

### 2. Policy Configurations

- **Policy Management**: Create and manage policy-specific configurations
- **Data Types**: Support for string, number, boolean, and JSON values
- **Validation**: Automatic validation for JSON type values
- **Policy Rules**: Define business rules and constraints

### 3. Security Settings

- **Authentication**: Two-factor authentication settings
- **Session Management**: Session timeout configurations
- **Password Policy**: Password complexity requirements
- **Access Control**: IP whitelisting and rate limiting

### 4. Notification Settings

- **Email Notifications**: Configure email notification preferences
- **SMS Notifications**: Set up SMS notification rules
- **Event-Based**: Different notifications for different events

## API Endpoints

### Configurations

#### GET `/api/configurations`

Fetch all configurations

#### POST `/api/configurations`

Create a new configuration

```json
{
  "key": "MAX_LOGIN_ATTEMPTS",
  "value": 5,
  "category": "security",
  "description": "Maximum number of failed login attempts",
  "isActive": true,
  "updatedBy": "user_id"
}
```

#### PUT `/api/configurations/[id]`

Update an existing configuration

#### DELETE `/api/configurations/[id]`

Delete a configuration

### Policy Configurations

#### GET `/api/configurations/policies`

Fetch all policy configurations

#### POST `/api/configurations/policies`

Create a new policy configuration

```json
{
  "name": "Max Claims Per Month",
  "type": "number",
  "value": 3,
  "description": "Maximum number of claims allowed per month",
  "isActive": true,
  "createdBy": "user_id"
}
```

#### PUT `/api/configurations/policies/[id]`

Update an existing policy configuration

#### DELETE `/api/configurations/policies/[id]`

Delete a policy configuration

## Database Schema

### Configurations Collection

```javascript
{
  _id: ObjectId,
  key: String,           // Unique, uppercase
  value: Mixed,          // String, Number, or Boolean
  category: String,      // system, security, email, notification, payment, policy
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,
  updatedBy: String
}
```

### Policy Configurations Collection

```javascript
{
  _id: ObjectId,
  name: String,          // Unique
  type: String,          // string, number, boolean, json
  value: Mixed,          // String, Number, Boolean, or JSON
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,
  updatedBy: String
}
```

## Usage Examples

### Using the Configuration Service

```typescript
import { configurationService } from "@/services/configuration.service";

// Get a configuration value
const maxLoginAttempts = await configurationService.getConfigValue(
  "MAX_LOGIN_ATTEMPTS",
  5
);

// Get a policy value
const maxClaimsPerMonth = await configurationService.getPolicyValue(
  "Max Claims Per Month",
  3
);

// Set a configuration
await configurationService.setConfiguration(
  "SESSION_TIMEOUT",
  30,
  "security",
  "Session timeout in minutes",
  userId
);

// Get all configurations by category
const securityConfigs =
  await configurationService.getConfigurationsByCategory("security");
```

### Frontend Usage

```typescript
// In a React component
const [configurations, setConfigurations] = useState([]);

useEffect(() => {
  const fetchConfigurations = async () => {
    const response = await fetch("/api/configurations");
    const data = await response.json();
    if (data.success) {
      setConfigurations(data.data);
    }
  };

  fetchConfigurations();
}, []);
```

## Access Control

- **Admin Only**: The configurations page is restricted to users with the `Admin` role
- **Role-Based Access**: Different configuration categories may have different access requirements
- **Audit Trail**: All changes are logged with user information and timestamps

## Caching

The configuration service includes a built-in caching mechanism:

- **Cache Duration**: 5 minutes
- **Automatic Invalidation**: Cache is cleared when configurations are updated
- **Performance**: Reduces database queries for frequently accessed configurations

## Best Practices

1. **Naming Convention**: Use UPPERCASE for configuration keys
2. **Descriptions**: Always provide clear descriptions for configurations
3. **Categories**: Use appropriate categories to organize configurations
4. **Validation**: Validate configuration values before saving
5. **Backup**: Regularly backup configuration data
6. **Testing**: Test configuration changes in a development environment first

## Default Configurations

The system includes several default configurations:

### Security

- `MAX_LOGIN_ATTEMPTS`: 5
- `SESSION_TIMEOUT`: 30 (minutes)
- `PASSWORD_MIN_LENGTH`: 8
- `REQUIRE_2FA`: false

### Email

- `SMTP_HOST`: smtp.example.com
- `SMTP_PORT`: 587
- `EMAIL_FROM`: noreply@example.com

### Notifications

- `EMAIL_NOTIFICATIONS_ENABLED`: true
- `SMS_NOTIFICATIONS_ENABLED`: false
- `SYSTEM_ALERTS_ENABLED`: true

## Troubleshooting

### Common Issues

1. **Configuration Not Found**: Check if the configuration key exists and is active
2. **Permission Denied**: Ensure the user has Admin role
3. **Cache Issues**: Clear the configuration cache if values seem stale
4. **Validation Errors**: Check the data type and format of configuration values

### Debug Mode

Enable debug logging by setting the `DEBUG_CONFIGURATIONS` environment variable:

```bash
DEBUG_CONFIGURATIONS=true npm run dev
```

## Future Enhancements

- **Configuration Templates**: Pre-defined configuration templates
- **Environment-Specific**: Different configurations for different environments
- **Import/Export**: Bulk import and export of configurations
- **Version Control**: Track configuration changes over time
- **API Rate Limiting**: Configurable API rate limits
- **Webhook Notifications**: Notify external systems of configuration changes
