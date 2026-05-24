import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import { isValidEmail, normalizeEmail, sanitizeString } from '../src/utils/security.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const adminName = sanitizeString(process.env.SEED_ADMIN_NAME || 'Pathora Admin', 80);
const adminEmail = normalizeEmail(process.env.SEED_ADMIN_EMAIL);
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

const finish = async (code = 0) => {
  await mongoose.disconnect();
  process.exit(code);
};

if (!adminEmail || !adminPassword) {
  console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required.');
  await finish(1);
}

if (!isValidEmail(adminEmail)) {
  console.error('SEED_ADMIN_EMAIL must be a valid email address.');
  await finish(1);
}

if (adminPassword.length < 12 || adminPassword.length > 128) {
  console.error('SEED_ADMIN_PASSWORD must be between 12 and 128 characters.');
  await finish(1);
}

await connectDB();

const existingAdmin = await User.findOne({ role: 'admin' });

if (existingAdmin && existingAdmin.email !== adminEmail) {
  console.error(`An admin already exists for ${existingAdmin.email}. Remove it first if you want to replace the admin account.`);
  await finish(1);
}

let admin = await User.findOne({ email: adminEmail }).select('+password');

if (!admin) {
  admin = await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
  });
  console.log(`Admin account created for ${admin.email}`);
  await finish(0);
}

admin.name = adminName;
admin.password = adminPassword;
admin.role = 'admin';
await admin.save();

console.log(`Admin account updated for ${admin.email}`);
await finish(0);
