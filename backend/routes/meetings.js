const express = require('express');
const { getDB, ObjectId } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { group_id, meet_date, topic, suggestions } = req.body;

    if (!group_id || !meet_date || !topic) {
      return res.status(400).json({ error: 'Group ID, date, and topic are required' });
    }

    const db = getDB();
    const result = await db.collection('meeting_logs').insertOne({
      group_id: new ObjectId(group_id),
      meet_date: new Date(meet_date),
      topic,
      suggestions: suggestions || null,
      comment_from_guide: null,
      is_verified: false,
      created_at: new Date()
    });

    res.status(201).json({
      message: 'Meeting log created successfully',
      meet_id: result.insertedId
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Failed to create meeting log', message: error.message });
  }
});

router.get('/group/:group_id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const meetings = await db.collection('meeting_logs')
      .find({ group_id: new ObjectId(req.params.group_id) })
      .sort({ meet_date: -1 })
      .toArray();
    
    const meetingsWithId = meetings.map(m => ({ ...m, meet_id: m._id }));
    res.json(meetingsWithId);
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ error: 'Failed to fetch meetings', message: error.message });
  }
});

router.put('/verify/:meet_id', authenticateToken, async (req, res) => {
  try {
    const { is_verified, comment_from_guide } = req.body;
    const db = getDB();

    await db.collection('meeting_logs').updateOne(
      { _id: new ObjectId(req.params.meet_id) },
      { $set: { is_verified, comment_from_guide } }
    );

    await db.collection('audit_logs').insertOne({
      table_name: 'meeting_logs',
      record_id: req.params.meet_id,
      action: 'verify',
      action_by: new ObjectId(req.user.user_id),
      action_date: new Date()
    });

    res.json({ message: 'Meeting verification updated successfully' });
  } catch (error) {
    console.error('Verify meeting error:', error);
    res.status(500).json({ error: 'Failed to verify meeting', message: error.message });
  }
});

module.exports = router;
