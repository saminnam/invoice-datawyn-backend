import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { config } from './src/config/env.js'
import User from './src/models/User.js'
import Role from './src/models/Role.js'
import Permission from './src/models/Permission.js'

const seed = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    // Don't clear existing users - we'll update them instead
    console.log('Preserving existing users')

    // Get or create admin role with full permissions
    let adminRole = await Role.findOne({ name: 'Admin' }).populate('permissions')
    if (!adminRole) {
      console.log('Warning: Admin role not found. Please run seedRBAC.js first')
      // Get all permissions
      const allPermissions = await Permission.find({})
      adminRole = await Role.create({
        name: 'Admin',
        description: 'Full system access',
        permissions: allPermissions.map(p => p._id),
        isSystem: true
      })
    } else {
      // Ensure admin role has all permissions
      const allPermissions = await Permission.find({})
      const currentPermissionIds = adminRole.permissions.map(p => p._id.toString())
      const allPermissionIds = allPermissions.map(p => p._id.toString())
      
      // Add any missing permissions
      const missingPermissions = allPermissions.filter(p => !currentPermissionIds.includes(p._id.toString()))
      if (missingPermissions.length > 0) {
        adminRole.permissions.push(...missingPermissions.map(p => p._id))
        await adminRole.save()
        console.log('Updated Admin role with missing permissions')
      }
    }

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@datawyn.com' })
    if (existingAdmin) {
      // Update existing admin user with admin role
      existingAdmin.role = adminRole._id
      existingAdmin.legacyRole = 'admin'
      existingAdmin.isActive = true
      await existingAdmin.save()
      console.log('Updated existing admin user with Admin role')
    } else {
      // Create admin user
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@datawyn.com',
        password: 'admin123',
        role: adminRole._id,
        legacyRole: 'admin',
        isActive: true
      })
      console.log('Created admin user with Admin role')
    }

    // Update all existing users to have admin role if they don't have a role
    const usersWithoutRole = await User.find({ role: null })
    for (const user of usersWithoutRole) {
      user.role = adminRole._id
      user.legacyRole = 'admin'
      await user.save()
    }
    if (usersWithoutRole.length > 0) {
      console.log(`Updated ${usersWithoutRole.length} existing users with Admin role`)
    }

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
