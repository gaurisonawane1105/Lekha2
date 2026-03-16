const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'lekha_db';

const client = new MongoClient(uri);
let db;

const connectDB = async () => {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
    await initializeDatabase();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const initializeDatabase = async () => {
  // Create collections if they don't exist
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  if (!collectionNames.includes('roles')) {
    await db.createCollection('roles');
    await db.collection('roles').insertMany([
      { role_id: 1, role_name: 'Student' },
      { role_id: 2, role_name: 'Guide' },
      { role_id: 3, role_name: 'HOD' },
      { role_id: 4, role_name: 'Admin' }
    ]);
  }

  // Create indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('student_profiles').createIndex({ roll_no: 1 }, { unique: true });
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
};

module.exports = { connectDB, getDB, ObjectId };
