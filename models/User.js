import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String,
      default: null
    },
    otpExpiry: {
      type: Date,
      default: null
    },
    favorites: [
      {
        type: String
      }
    ],
    wishlist: [
      {
        type: String
      }
    ],
    history: [
      {
        type: String
      }
    ]
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
