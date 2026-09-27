import mongoose from 'mongoose'
import { config } from './config/env.js'
import Permission from './models/Permission.js'
import Role from './models/Role.js'
import User from './models/User.js'

const fixUserPermissions = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    // Get all permissions
    const allPermissions = await Permission.find({})
    console.log(`Found ${allPermissions.length} permissions`)

    // Find or create Admin role
    let adminRole = await Role.findOne({ name: 'Admin' })
    
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        description: 'Full system access',
        permissions: allPermissions.map(p => p._id),
        isSystem: true
      })
      console.log('Created Admin role')
    } else {
      // Update existing Admin role with all permissions
      adminRole.permissions = allPermissions.map(p => p._id)
      await adminRole.save()
      console.log('Updated Admin role with all permissions')
    }

    // Update all users to have Admin role
    const users = await User.find({})
    console.log(`Found ${users.length} users`)

    for (const user of users) {
      user.role = adminRole._id
      user.legacyRole = 'admin'
      await user.save()
      console.log(`Updated user: ${user.email}`)
    }

    console.log('\n=== User Permissions Fixed Successfully ===')
    console.log('All users now have Admin role with all permissions')

    process.exit(0)
  } catch (error) {
    console.error('Error fixing user permissions:', error)
    process.exit(1)
  }
}

fixUserPermissions()