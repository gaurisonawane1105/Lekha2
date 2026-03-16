const express = require('express');
const { getDB, ObjectId } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const projects = await db.collection('project_groups').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'guide_id',
          foreignField: '_id',
          as: 'guide'
        }
      },
      {
        $project: {
          group_id: '$_id',
          group_name: 1,
          project_topic: 1,
          guide_id: 1,
          guide_name: { $arrayElemAt: ['$guide.full_name', 0] },
          guide_email: { $arrayElemAt: ['$guide.email', 0] },
          created_at: 1
        }
      }
    ]).toArray();
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects', message: error.message });
  }
});

// Get projects by guide
router.get('/guide/:guide_id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const projects = await db.collection('project_groups').find({
      guide_id: new ObjectId(req.params.guide_id)
    }).toArray();
    
    const projectsWithId = projects.map(p => ({ ...p, group_id: p._id }));
    res.json(projectsWithId);
  } catch (error) {
    console.error('Get guide projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects', message: error.message });
  }
});

// Get project by ID
router.get('/:group_id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const project = await db.collection('project_groups').findOne({
      _id: new ObjectId(req.params.group_id)
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get guide info
    let guide = null;
    if (project.guide_id) {
      guide = await db.collection('users').findOne({ _id: project.guide_id });
    }

    // Get students
    const students = await db.collection('student_profiles').aggregate([
      { $match: { group_id: new ObjectId(req.params.group_id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          user_id: 1,
          roll_no: 1,
          full_name: { $arrayElemAt: ['$user.full_name', 0] },
          email: { $arrayElemAt: ['$user.email', 0] }
        }
      }
    ]).toArray();

    res.json({
      ...project,
      group_id: project._id,
      guide_name: guide ? guide.full_name : null,
      guide_email: guide ? guide.email : null,
      students
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project', message: error.message });
  }
});

// Create new project
router.post('/', authenticateToken, authorizeRoles('Admin', 'Guide'), async (req, res) => {
  try {
    const { group_name, project_topic, guide_id, student_ids } = req.body;

    if (!group_name || !project_topic) {
      return res.status(400).json({ error: 'Group name and project topic are required' });
    }

    const db = getDB();
    const result = await db.collection('project_groups').insertOne({
      group_name,
      project_topic,
      guide_id: guide_id ? new ObjectId(guide_id) : null,
      created_at: new Date()
    });

    const groupId = result.insertedId;

    // Assign students
    if (student_ids && student_ids.length > 0) {
      for (const userId of student_ids) {
        await db.collection('student_profiles').updateOne(
          { user_id: new ObjectId(userId) },
          { $set: { group_id: groupId } }
        );
      }
    }

    res.status(201).json({ message: 'Project created successfully', group_id: groupId });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project', message: error.message });
  }
});

module.exports = router;
