import { validationResult } from 'express-validator';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, phone, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  // Only allow self-registration as a regular user or agent, never admin
  const safeRole = role === 'agent' ? 'agent' : 'user';

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: safeRole,
  });

  return res.status(201).json({
    user: sanitize(user),
    token: generateToken(user._id),
  });
};

// @desc    Authenticate user and return a token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({
    user: sanitize(user),
    token: generateToken(user._id),
  });
};

// @desc    Get the current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  return res.json({ user: sanitize(req.user) });
};
