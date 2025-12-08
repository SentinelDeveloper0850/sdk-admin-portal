import mongoose, { Schema } from "mongoose";

export interface IDailyActivity {
  _id?: string;
  userId: string;
  userName: string;
  createdAt?: Date;
  activities: {
    name: string;
    policyNumber?: string;
    claimNumber?: string;
  }[];
  isWhatsAppGroupCreated: boolean;
  areDocumentsSubmittedToDiscord: boolean;
  speedPointsUpload?: string; // base64 or file URL
  massReceipts?: boolean;
  date: string; // typically in YYYY-MM-DD
  time: string; // e.g., '14:30'
  branch: string; // Represents the branch name
  branchId?: string; // Represents the branch ID (MongoDB ObjectId)
  comments?: string;
}

// Define schema for Daily Activity
const dailyActivitySchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
    default: "Anonymous", // This should be auto-filled based on the logged-in user in the front-end
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  activities: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      societyName: {
        type: String,
        required: false,
        trim: true,
      },
      policyNumber: {
        type: String,
        required: false,
        trim: true,
        validate: {
          validator: function (value: any) {
            return value === undefined || /^[A-Za-z0-9]+$/.test(value); // Optional and alphanumeric validation
          },
          message: "Invalid policy number format.",
        },
      },
      claimNumber: {
        type: String,
        required: false,
        trim: true,
      },
    },
  ],
  isWhatsAppGroupCreated: {
    type: Boolean,
    default: false,
  },
  areDocumentsSubmittedToDiscord: {
    type: Boolean,
    default: false,
  },
  speedPointsUpload: {
    type: String, // Base64 string of the file
    required: false,
  },
  massReceipts: {
    type: Boolean,
    required: false,
    validate: {
      validator: function (value: boolean) {
        return value === true || value === false;
      },
      message: "Mass Receipts should be a boolean value.",
    },
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    description: "The branch ID",
    ref: "Branch",
    required: false,
  },
  branch: {
    type: String,
    description: "The branch name. This way even if the branch is deleted, we can still get the branch name",
    required: false,
  },
  comments: {
    type: String,
    required: false,
    trim: true,
  },
});

// Ensure unique fields where necessary (e.g., userName with date combination)
// dailyActivitySchema.index({ userName: 1, currentDate: 1 }, { unique: true });

// Populate branch
// dailyActivitySchema.pre("find", function (next) {
//   this.populate({
//     path: "branchId",
//     select: "name",
//     strictPopulate: false
//   });
//   next();
// });

// Create Mongoose model
export const DailyActivityModel =
  mongoose.models.daily_activities ||
  mongoose.model("daily_activities", dailyActivitySchema, "daily_activities");
