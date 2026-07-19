import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Complaint from './models/Complaint.js';
import mongoose from 'mongoose';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    await Complaint.deleteMany();
    await User.deleteMany();

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    const agent = await User.create({
      name: 'Agent Smith',
      email: 'agent@example.com',
      password: 'password123',
      role: 'agent',
    });

    const user = await User.create({
      name: 'John Citizen',
      email: 'user@example.com',
      password: 'password123',
      role: 'user',
    });

    await Complaint.create([
      {
        title: 'Street light not working',
        description: 'The street light on Main Road has been off for a week.',
        category: 'Electricity',
        priority: 'medium',
        location: 'Main Road',
        createdBy: user._id,
      },
      {
        title: 'Water leakage near park',
        description: 'Continuous water leakage from the main pipe near the city park.',
        category: 'Water',
        priority: 'high',
        location: 'City Park',
        status: 'assigned',
        createdBy: user._id,
        assignedTo: agent._id,
      },
    ]);

    console.log('Seed data created:');
    console.log('  admin@example.com / password123');
    console.log('  agent@example.com / password123');
    console.log('  user@example.com  / password123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
