const express = require('express');
const { getDB, ObjectId } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    const db = getDB();
    let stats = {};

    if (role_name === 'Student') {
      const studentProfile = await db.collection('student_profiles').findOne({ user_id: new ObjectId(user_id) });
      
      if (studentProfile && studentProfile.group_id) {
        const group = await db.collection('project_groups').findOne({ _id: studentProfile.group_id });
        let guide = null;
        if (group && group.guide_id) {
          guide = await db.collection('users').findOne({ _id: group.guide_id });
        }

        const [totalFiles, verifiedFiles, totalMeetings, verifiedMeetings] = await Promise.all([
          db.collection('project_files').countDocuments({ group_id: studentProfile.group_id }),
          db.collection('project_files').countDocuments({ group_id: studentProfile.group_id, is_verified: true }),
          db.collection('meeting_logs').countDocuments({ group_id: studentProfile.group_id }),
          db.collection('meeting_logs').countDocuments({ group_id: studentProfile.group_id, is_verified: true })
        ]);

        stats = {
          group_info: {
            group_id: group?._id,
            group_name: group?.group_name,
            project_topic: group?.project_topic,
            guide_name: guide?.full_name
          },
          total_files: totalFiles,
          verified_files: verifiedFiles,
          total_meetings: totalMeetings,
          verified_meetings: verifiedMeetings
        };
      } else {
        stats = { message: 'No group assigned yet' };
      }
    } else if (role_name === 'Guide') {
      const [projects, pendingFiles, pendingMeetings] = await Promise.all([
        db.collection('project_groups').countDocuments({ guide_id: new ObjectId(user_id) }),
        db.collection('project_files').aggregate([
          { $lookup: { from: 'project_groups', localField: 'group_id', foreignField: '_id', as: 'group' } },
          { $match: { 'group.guide_id': new ObjectId(user_id), is_verified: false } }
        ]).toArray(),
        db.collection('meeting_logs').aggregate([
          { $lookup: { from: 'project_groups', localField: 'group_id', foreignField: '_id', as: 'group' } },
          { $match: { 'group.guide_id': new ObjectId(user_id), is_verified: false } }
        ]).toArray()
      ]);

      stats = {
        total_projects: projects,
        pending_file_verifications: pendingFiles.length,
        pending_meeting_verifications: pendingMeetings.length
      };
    } else if (role_name === 'HOD' || role_name === 'Admin') {
      const [totalProjects, totalStudents, totalGuides, totalFiles, totalMeetings] = await Promise.all([
        db.collection('project_groups').countDocuments(),
        db.collection('users').countDocuments({ role_id: 1 }),
        db.collection('users').countDocuments({ role_id: 2 }),
        db.collection('project_files').countDocuments(),
        db.collection('meeting_logs').countDocuments()
      ]);

      stats = {
        total_projects: totalProjects,
        total_students: totalStudents,
        total_guides: totalGuides,
        total_files: totalFiles,
        total_meetings: totalMeetings
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

module.exports = router;
