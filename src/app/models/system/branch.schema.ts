import mongoose, { Document, Schema } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  code: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  phoneExtension?: string;
  email?: string;
  manager?: mongoose.Types.ObjectId;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const branchSchema = new Schema<IBranch>({
  name: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true,
    maxlength: [100, 'Branch name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Branch code is required'],
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [10, 'Branch code cannot exceed 10 characters']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  province: {
    type: String,
    enum: {
      values: [
        'Gauteng',
        'Western Cape',
        'KwaZulu-Natal',
        'Eastern Cape',
        'Free State',
        'Mpumalanga',
        'Limpopo',
        'North West',
        'Northern Cape'
      ],
      message: 'Please select a valid province'
    }
  },
  postalCode: {
    type: String,
    trim: true,
    maxlength: [10, 'Postal code cannot exceed 10 characters']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  phoneExtension: {
    type: String,
    trim: true,
    maxlength: [10, 'Phone extension cannot exceed 10 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [100, 'Email cannot exceed 100 characters'],
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  latitude: {
    type: Number,
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  longitude: {
    type: Number,
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
branchSchema.index({ code: 1 });
branchSchema.index({ city: 1 });
branchSchema.index({ province: 1 });
branchSchema.index({ isActive: 1 });
branchSchema.index({ manager: 1 });
branchSchema.index({ latitude: 1, longitude: 1 }); // For geospatial queries

// Virtual for full address
branchSchema.virtual('fullAddress').get(function () {
  return `${this.address}, ${this.city}, ${this.province}, ${this.postalCode}`;
});

// Virtual for coordinates string
branchSchema.virtual('coordinatesString').get(function () {
  return `${this.latitude}, ${this.longitude}`;
});

// Pre-save middleware to ensure code is uppercase
branchSchema.pre('save', function (next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Static method to find active branches
branchSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to find branches by province
branchSchema.statics.findByProvince = function (province: string) {
  return this.find({ province, isActive: true });
};

// Static method to find branches near coordinates (for future map features)
branchSchema.statics.findNear = function (lat: number, lng: number, maxDistance: number = 10) {
  return this.find({
    isActive: true,
    latitude: { $gte: lat - maxDistance, $lte: lat + maxDistance },
    longitude: { $gte: lng - maxDistance, $lte: lng + maxDistance }
  });
};

export const BranchModel = mongoose.models.Branch || mongoose.model<IBranch>('Branch', branchSchema);
