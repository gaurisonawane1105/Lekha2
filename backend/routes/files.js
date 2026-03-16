const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDB, ObjectId } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { group_id } = req.body;
    if (!group_id) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Group ID is required' });
    }

    const db = getDB();
    const result = await db.collection('project_files').insertOne({
      group_id: new ObjectId(group_id),
      file_name: req.file.originalname,
      file_path: req.file.filename,
      uploaded_by: new ObjectId(req.user.user_id),
      is_verified: false,
      comment_from_guide: null,
      upload_date: new Date()
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file_id: result.insertedId,
      file_name: req.file.originalname
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

router.get('/group/:group_id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const files = await db.collection('project_files').aggregate([
      { $match: { group_id: new ObjectId(req.params.group_id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'uploaded_by',
          foreignField: '_id',
          as: 'uploader'
        }
      },
      {
        $project: {
          file_id: '$_id',
          group_id: 1,
          file_name: 1,
          file_path: 1,
          upload_date: 1,
          uploaded_by: 1,
          uploaded_by_name: { $arrayElemAt: ['$uploader.full_name', 0] },
          is_verified: 1,
          comment_from_guide: 1
        }
      },
      { $sort: { upload_date: -1 } }
    ]).toArray();
    res.json(files);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files', message: error.message });
  }
});

router.put('/verify/:file_id', authenticateToken, async (req, res) => {
  try {
    const { is_verified, comment_from_guide } = req.body;
    const db = getDB();

    await db.collection('project_files').updateOne(
      { _id: new ObjectId(req.params.file_id) },
      { $set: { is_verified, comment_from_guide } }
    );

    await db.collection('audit_logs').insertOne({
      table_name: 'project_files',
      record_id: req.params.file_id,
      action: 'verify',
      action_by: new ObjectId(req.user.user_id),
      action_date: new Date()
    });

    res.json({ message: 'File verification updated successfully' });
  } catch (error) {
    console.error('Verify file error:', error);
    res.status(500).json({ error: 'Failed to verify file', message: error.message });
  }
});

router.get('/download/:file_id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const file = await db.collection('project_files').findOne({ _id: new ObjectId(req.params.file_id) });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(__dirname, '../uploads', file.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, file.file_name);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed', message: error.message });
  }
});

module.exports = router;
