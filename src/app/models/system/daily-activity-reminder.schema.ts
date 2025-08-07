import mongoose, { Document, Schema } from "mongoose";

export interface IDailyActivityReminderConfig extends Document {
  _id: string;

  // Basic settings
  isEnabled: boolean;
  reminderTime: string; // Format: "HH:mm" (e.g., "16:00")
  cutoffTime: string; // Format: "HH:mm" (e.g., "18:00")

  // Schedule settings
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  excludeDates: string[]; // Array of dates in "YYYY-MM-DD" format

  // Reminder settings
  sendFirstReminder: boolean;
  firstReminderOffset: number; // Minutes before cutoff time (e.g., 120 for 2 hours)
  sendFinalReminder: boolean;
  finalReminderOffset: number; // Minutes before cutoff time (e.g., 30 for 30 minutes)

  // Recipient settings
  sendToAllUsers: boolean;
  excludeRoles: string[]; // Roles to exclude from reminders
  includeRoles: string[]; // Specific roles to include (if sendToAllUsers is false)

  // Email settings
  emailSubject: string;
  emailTemplate: string; // Custom email template (optional)

  // Tracking
  lastRunAt?: Date;
  nextRunAt?: Date;
  totalRemindersSent: number;

  // Metadata
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateNextRunTime(): void;
  shouldRunToday(): boolean;
}

const dailyActivityReminderConfigSchema = new Schema<IDailyActivityReminderConfig>({
  isEnabled: {
    type: Boolean,
    default: true,
    required: true,
  },
  reminderTime: {
    type: String,
    default: "16:00",
    required: true,
    validate: {
      validator: function (value: string) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: "Reminder time must be in HH:mm format (e.g., 16:00)"
    }
  },
  cutoffTime: {
    type: String,
    default: "18:00",
    required: true,
    validate: {
      validator: function (value: string) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: "Cutoff time must be in HH:mm format (e.g., 18:00)"
    }
  },
  excludeWeekends: {
    type: Boolean,
    default: true,
  },
  excludeHolidays: {
    type: Boolean,
    default: true,
  },
  excludeDates: [{
    type: String,
    validate: {
      validator: function (value: string) {
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      },
      message: "Exclude dates must be in YYYY-MM-DD format"
    }
  }],
  sendFirstReminder: {
    type: Boolean,
    default: true,
  },
  firstReminderOffset: {
    type: Number,
    default: 120, // 2 hours before cutoff
    min: 0,
    max: 1440, // 24 hours
  },
  sendFinalReminder: {
    type: Boolean,
    default: true,
  },
  finalReminderOffset: {
    type: Number,
    default: 30, // 30 minutes before cutoff
    min: 0,
    max: 1440, // 24 hours
  },
  sendToAllUsers: {
    type: Boolean,
    default: true,
  },
  excludeRoles: [{
    type: String,
    enum: ["admin", "manager", "member", "driver", "consultant"]
  }],
  includeRoles: [{
    type: String,
    enum: ["admin", "manager", "member", "driver", "consultant"]
  }],
  emailSubject: {
    type: String,
    default: "Daily Activity Report Reminder",
  },
  emailTemplate: {
    type: String,
    default: "", // Empty means use default template
  },
  lastRunAt: {
    type: Date,
  },
  nextRunAt: {
    type: Date,
  },
  totalRemindersSent: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
  collection: "daily_activity_reminder_configs"
});

// Indexes for performance
dailyActivityReminderConfigSchema.index({ isEnabled: 1 });
dailyActivityReminderConfigSchema.index({ nextRunAt: 1 });

// Pre-save middleware to calculate next run time
dailyActivityReminderConfigSchema.pre("save", function (next) {
  if (this.isModified("reminderTime") || this.isModified("isEnabled")) {
    this.calculateNextRunTime();
  }
  next();
});

// Instance method to calculate next run time
dailyActivityReminderConfigSchema.methods.calculateNextRunTime = function () {
  if (!this.isEnabled) {
    this.nextRunAt = undefined;
    return;
  }

  const now = new Date();
  const [hours, minutes] = this.reminderTime.split(":").map(Number);

  // Set today's reminder time
  const todayReminder = new Date(now);
  todayReminder.setHours(hours, minutes, 0, 0);

  // If today's reminder time has passed, set for tomorrow
  if (todayReminder <= now) {
    todayReminder.setDate(todayReminder.getDate() + 1);
  }

  // Skip weekends if configured
  if (this.excludeWeekends) {
    while (todayReminder.getDay() === 0 || todayReminder.getDay() === 6) {
      todayReminder.setDate(todayReminder.getDate() + 1);
    }
  }

  // Skip excluded dates
  while (this.excludeDates.includes(todayReminder.toISOString().split('T')[0])) {
    todayReminder.setDate(todayReminder.getDate() + 1);
  }

  this.nextRunAt = todayReminder;
};

// Instance method to check if reminder should run today
dailyActivityReminderConfigSchema.methods.shouldRunToday = function () {
  if (!this.isEnabled) return false;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Check if today is excluded
  if (this.excludeDates.includes(todayStr)) return false;

  // Check if today is weekend and weekends are excluded
  if (this.excludeWeekends && (today.getDay() === 0 || today.getDay() === 6)) return false;

  // TODO: Add holiday check when holiday system is implemented
  if (this.excludeHolidays) {
    // Holiday check logic would go here
  }

  return true;
};

export const DailyActivityReminderConfigModel =
  mongoose.models.DailyActivityReminderConfig ||
  mongoose.model<IDailyActivityReminderConfig>("DailyActivityReminderConfig", dailyActivityReminderConfigSchema); 