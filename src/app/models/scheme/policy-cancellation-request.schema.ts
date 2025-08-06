import mongoose, { Document, Schema } from "mongoose";

export interface IPolicyCancellationRequest extends Document {
  policyId: mongoose.Types.ObjectId;
  policyNumber: string;
  memberName: string;
  reason: string;
  cancellationType: "immediate" | "end_of_period" | "specific_date";
  effectiveDate: Date;
  additionalNotes?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  submittedBy: mongoose.Types.ObjectId;
  submittedAt: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  emailSent: boolean;
  emailSentAt?: Date;
}

const PolicyCancellationRequestSchema = new Schema<IPolicyCancellationRequest>({
  policyId: {
    type: Schema.Types.ObjectId,
    ref: "Policy",
    required: [true, "Policy ID is required"],
    index: true,
  },
  policyNumber: {
    type: String,
    required: [true, "Policy number is required"],
    trim: true,
  },
  memberName: {
    type: String,
    required: [true, "Member name is required"],
    trim: true,
  },
  reason: {
    type: String,
    required: [true, "Reason for cancellation is required"],
    enum: {
      values: [
        "financial_hardship",
        "found_better_cover",
        "no_longer_needed",
        "dissatisfied_service",
        "moving_abroad",
        "deceased",
        "other"
      ],
      message: "Invalid cancellation reason"
    },
  },
  cancellationType: {
    type: String,
    required: [true, "Cancellation type is required"],
    enum: {
      values: ["immediate", "end_of_period", "specific_date"],
      message: "Invalid cancellation type"
    },
  },
  effectiveDate: {
    type: Date,
    required: [true, "Effective date is required"],
    validate: {
      validator: function (this: IPolicyCancellationRequest, value: Date) {
        // For immediate cancellation, effective date should be today or in the future
        if (this.cancellationType === "immediate") {
          return value >= new Date(new Date().setHours(0, 0, 0, 0));
        }
        // For other types, effective date should be in the future
        return value > new Date();
      },
      message: "Effective date must be in the future"
    }
  },
  additionalNotes: {
    type: String,
    trim: true,
    maxlength: [1000, "Additional notes cannot exceed 1000 characters"],
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ["pending", "approved", "rejected", "cancelled"],
      message: "Invalid status"
    },
    default: "pending",
    index: true,
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Submitter is required"],
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  reviewedAt: {
    type: Date,
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [500, "Review notes cannot exceed 500 characters"],
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
PolicyCancellationRequestSchema.index({ policyId: 1, status: 1 });
PolicyCancellationRequestSchema.index({ submittedAt: -1 });
PolicyCancellationRequestSchema.index({ status: 1, submittedAt: -1 });

// Virtual for formatted effective date
PolicyCancellationRequestSchema.virtual("effectiveDateFormatted").get(function () {
  return this.effectiveDate?.toLocaleDateString();
});

// Virtual for formatted submitted date
PolicyCancellationRequestSchema.virtual("submittedAtFormatted").get(function () {
  return this.submittedAt?.toLocaleDateString();
});

// Pre-save middleware to validate effective date based on cancellation type
PolicyCancellationRequestSchema.pre("save", function (next) {
  if (this.isModified("effectiveDate") || this.isModified("cancellationType")) {
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    if (this.cancellationType === "immediate" && this.effectiveDate < today) {
      return next(new Error("Immediate cancellation effective date must be today or in the future"));
    }

    if (this.cancellationType !== "immediate" && this.effectiveDate <= new Date()) {
      return next(new Error("Effective date must be in the future for non-immediate cancellations"));
    }
  }
  next();
});

// Static method to get pending requests
PolicyCancellationRequestSchema.statics.getPendingRequests = function () {
  return this.find({ status: "pending" }).sort({ submittedAt: -1 });
};

// Static method to get requests by policy
PolicyCancellationRequestSchema.statics.getByPolicy = function (policyId: string) {
  return this.find({ policyId }).sort({ submittedAt: -1 });
};

// Instance method to approve request
PolicyCancellationRequestSchema.methods.approve = function (reviewerId: string, notes?: string) {
  this.status = "approved";
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
  return this.save();
};

// Instance method to reject request
PolicyCancellationRequestSchema.methods.reject = function (reviewerId: string, notes?: string) {
  this.status = "rejected";
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
  return this.save();
};

// Instance method to mark email as sent
PolicyCancellationRequestSchema.methods.markEmailSent = function () {
  this.emailSent = true;
  this.emailSentAt = new Date();
  return this.save();
};

export default mongoose.models.PolicyCancellationRequest ||
  mongoose.model<IPolicyCancellationRequest>("PolicyCancellationRequest", PolicyCancellationRequestSchema); 