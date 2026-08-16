import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { config } from './src/config/env.js'
import User from './src/models/User.js'

const seed = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    console.log('Cleared existing data')

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@datawyn.com',
      password: 'admin123',
      role: 'admin'
    })
    console.log('Created admin user')

    console.log('\n=== Seed Data Created Successfully ===')
    console.log('Admin Login:')
    console.log('  Email: admin@datawyn.com')
    console.log('  Password: admin123')

    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seed()
