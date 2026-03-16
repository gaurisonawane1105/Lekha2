const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB, ObjectId } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role_id, roll_no } = req.body;

    if (!full_name || !email || !password || !role_id) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = getDB();

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await db.collection('users').insertOne({
      full_name,
      email,
      password_hash: hashedPassword,
      role_id: parseInt(role_id),
      is_active: true,
      created_at: new Date()
    });

    const userId = userResult.insertedId;

    // If student, create student profile
    if (parseInt(role_id) === 1 && roll_no) {
      await db.collection('student_profiles').insertOne({
        user_id: userId,
        roll_no,
        group_id: null,
        created_at: new Date()
      });
    }

    res.status(201).json({ message: 'User registered successfully', user_id: userId });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDB();

    // Get user
    const user = await db.collection('users').findOne({ email, is_active: true });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get role name
    const role = await db.collection('roles').findOne({ role_id: user.role_id });
    const role_name = role ? role.role_name : 'Unknown';

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        user_id: user._id, 
        email: user.email, 
        role_id: user.role_id,
        role_name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get additional info based on role
    let additionalInfo = {};
    if (role_name === 'Student') {
      const studentInfo = await db.collection('student_profiles').findOne({ user_id: user._id });
      if (studentInfo) {
        additionalInfo = {
          student_id: studentInfo._id,
          group_id: studentInfo.group_id,
          roll_no: studentInfo.roll_no
        };
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user._id,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id,
        role_name,
        ...additionalInfo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = typeof req.user.user_id === 'string' ? new ObjectId(req.user.user_id) : req.user.user_id;
    const user = await db.collection('users').findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await db.collection('roles').findOne({ role_id: user.role_id });

    res.json({
      user_id: user._id,
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id,
      role_name: role ? role.role_name : 'Unknown'
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info', message: error.message });
  }
});

module.exports = router;
