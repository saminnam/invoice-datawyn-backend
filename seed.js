import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { config } from './src/config/env.js'
import User from './src/models/User.js'
import Role from './src/models/Role.js'

const seed = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    console.log('Cleared existing data')

    // Get or create admin role
    let adminRole = await Role.findOne({ name: 'Admin' })
    if (!adminRole) {
      console.log('Warning: Admin role not found. Please run seedRBAC.js first')
      adminRole = await Role.create({
        name: 'Admin',
        description: 'Full system access',
        permissions: [],
        isSystem: true
      })
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@datawyn.com',
      password: 'admin123',
      role: adminRole._id,
      legacyRole: 'admin',
      isActive: true
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
