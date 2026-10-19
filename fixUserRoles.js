import mongoose from 'mongoose'
import { config } from './src/config/env.js'
import Permission from './src/models/Permission.js'
import Role from './src/models/Role.js'
import User from './src/models/User.js'

const clearRoles = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    // Clear all roles
    const deleteResult = await Role.deleteMany({})
    console.log(`Deleted ${deleteResult.deletedCount} roles`)

    // Clear user role assignments
    const updateResult = await User.updateMany(
      {},
      { $unset: { role: 1, legacyRole: 1 } }
    )
    console.log(`Cleared role assignments from ${updateResult.modifiedCount} users`)

    // Get all permissions
    const permissions = await Permission.find({})
    console.log('Found', permissions.length, 'permissions')

    // List all users and their roles
    const usersWithRoles = await User.find({})
    console.log('\n=== Current Users and Roles ===')
    usersWithRoles.forEach(user => {
      console.log(`User: ${user.email || user.username} - Role: None`)
    })

    console.log('\n=== Roles Cleared Successfully ===')
    console.log('All default roles have been removed')
    console.log('Users can now create custom roles through the Roles page')
    console.log('IMPORTANT: You will need to manually assign roles to users after creating them')
    process.exit(0)
  } catch (error) {
    console.error('Error clearing roles:', error)
    process.exit(1)
  }
}

clearRoles()
