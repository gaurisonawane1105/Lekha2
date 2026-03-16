const express = require('express');
const { getDB, ObjectId } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authenticateToken, authorizeRoles('Admin', 'HOD'), async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection('users').aggregate([
      {
        $lookup: {
          from: 'roles',
          localField: 'role_id',
          foreignField: 'role_id',
          as: 'role'
        }
      },
      {
        $project: {
          user_id: '$_id',
          full_name: 1,
          email: 1,
          is_active: 1,
          created_at: 1,
          role_name: { $arrayElemAt: ['$role.role_name', 0] }
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

router.get('/students/unassigned', authenticateToken, authorizeRoles('Admin', 'Guide'), async (req, res) => {
  try {
    const db = getDB();
    const students = await db.collection('student_profiles').aggregate([
      { $match: { group_id: null } },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $match: { 'user.is_active': true } },
      {
        $project: {
          user_id: 1,
          roll_no: 1,
          full_name: { $arrayElemAt: ['$user.full_name', 0] },
          email: { $arrayElemAt: ['$user.email', 0] }
        }
      },
      { $sort: { roll_no: 1 } }
    ]).toArray();
    res.json(students);
  } catch (error) {
    console.error('Get unassigned students error:', error);
    res.status(500).json({ error: 'Failed to fetch students', message: error.message });
  }
});

router.get('/guides', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const db = getDB();
    const guides = await db.collection('users')
      .find({ role_id: 2, is_active: true })
      .project({ user_id: '$_id', full_name: 1, email: 1 })
      .sort({ full_name: 1 })
      .toArray();
    res.json(guides);
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({ error: 'Failed to fetch guides', message: error.message });
  }
});

router.put('/users/:user_id/toggle', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.user_id) });
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.user_id) },
      { $set: { is_active: !user.is_active } }
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({ error: 'Failed to update user status', message: error.message });
  }
});

router.get('/audit-logs', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const db = getDB();
    const logs = await db.collection('audit_logs').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'action_by',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          audit_id: '$_id',
          table_name: 1,
          record_id: 1,
          action: 1,
          action_date: 1,
          action_by_name: { $arrayElemAt: ['$user.full_name', 0] }
        }
      },
      { $sort: { action_date: -1 } },
      { $limit: 100 }
    ]).toArray();
    res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs', message: error.message });
  }
});

module.exports = router;
