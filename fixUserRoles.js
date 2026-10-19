import mongoose from 'mongoose'
import { config } from './src/config/env.js'
import Permission from './src/models/Permission.js'
import Role from './src/models/Role.js'
import User from './src/models/User.js'

const fixUserRoles = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    // Get all permissions
    const permissions = await Permission.find({})
    console.log('Found', permissions.length, 'permissions')

    // Get Admin role
    const adminRole = await Role.findOne({ name: 'Admin' })
    if (!adminRole) {
      console.log('Admin role not found, creating...')
      const newAdminRole = await Role.create({
        name: 'Admin',
        description: 'Full system access',
        permissions: permissions.map(p => p._id),
        isSystem: true
      })
      console.log('Created Admin role')
    } else {
      // Update Admin role with all permissions
      adminRole.permissions = permissions.map(p => p._id)
      await adminRole.save()
      console.log('Updated Admin role with all permissions')
    }

    // Get the updated Admin role
    const updatedAdminRole = await Role.findOne({ name: 'Admin' })

    // Update ALL users to have Admin role (force update)
    const allUsers = await User.find({})
    console.log(`Found ${allUsers.length} total users`)
    for (const user of allUsers) {
      user.role = updatedAdminRole._id
      user.legacyRole = 'admin'
      await user.save()
      console.log(`Updated user: ${user.email || user.username}`)
    }
    console.log(`Updated ${allUsers.length} users with Admin role`)

    // List all users and their roles
    const usersWithRoles = await User.find({}).populate('role')
    console.log('\n=== Current Users and Roles ===')
    usersWithRoles.forEach(user => {
      console.log(`User: ${user.email || user.username} - Role: ${user.role?.name || 'No role'}`)
    })

    console.log('\n=== User Roles Fixed Successfully ===')
    process.exit(0)
  } catch (error) {
    console.error('Error fixing user roles:', error)
    process.exit(1)
  }
}

fixUserRoles()
