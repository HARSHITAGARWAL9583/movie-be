import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';






const MAIL_HOST = process.env.MAIL_HOST || 'smtp.gmail.com';
const MAIL_USER = process.env.MAIL_USER || process.env.MAlL_USER || process.env.EMAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS || process.env.MAlL_PASS || process.env.EMAIL_PASS;
const MAIL_PASS_CLEAN = (MAIL_PASS || '').replace(/\s+/g, '');

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS_CLEAN
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  if (
    !MAIL_USER ||
    !MAIL_PASS_CLEAN ||
    MAIL_USER.includes('your_email') ||
    MAIL_PASS.includes('your_app_password')
  ) {
    throw new Error('Email OTP is not configured. Set MAIL_USER and MAIL_PASS in backend/.env');
  }

  const mailOptions = {
    from: MAIL_USER,
    to: email,
    subject: 'Your OTP for Movie Recommendation System',
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 5 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending email:', {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command
    });
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

// Signup
const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false
    });

    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: 'User created successfully. Check your email for OTP.',
      userId: user._id
    });
  } catch (error) {
    console.error(`❌ Signup Error: ${error.message}`);
    return res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
      console.looog("first");
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check OTP validity
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
      conosle.log(first)
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(`❌ Verify OTP Error: ${error.message}`);
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error(`❌ Resend OTP Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(`❌ Login Error: ${error.message}`);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

export { signup, verifyOTP, resendOTP, login };
