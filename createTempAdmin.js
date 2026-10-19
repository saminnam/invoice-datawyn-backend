import mongoose from 'mongoose'
import { config } from './src/config/env.js'
import Permission from './src/models/Permission.js'
import Role from './src/models/Role.js'
import User from './src/models/User.js'

const createTempAdmin = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    // Get all permissions
    const permissions = await Permission.find({})
    console.log('Found', permissions.length, 'permissions')

    if (permissions.length === 0) {
      console.log('No permissions found. Please run seedRBAC.js first.')
      process.exit(1)
    }

    // Create temporary Admin role with all permissions
    const tempAdminRole = await Role.create({
      name: 'Temporary Admin',
      description: 'Temporary role with all permissions. Create your custom roles and delete this one.',
      permissions: permissions.map(p => p._id),
      isSystem: false
    })
    console.log('Created Temporary Admin role with all permissions')

    // Assign this role to all users
    const allUsers = await User.find({})
    console.log(`Found ${allUsers.length} total users`)
    for (const user of allUsers) {
      user.role = tempAdminRole._id
      await user.save()
      console.log(`Assigned Temporary Admin role to: ${user.email || user.username}`)
    }
    console.log(`Assigned Temporary Admin role to ${allUsers.length} users`)

    console.log('\n=== Temporary Admin Role Created Successfully ===')
    console.log('All users now have Temporary Admin role with all permissions')
    console.log('You can now:')
    console.log('1. Go to the Roles page')
    console.log('2. Create your custom roles')
    console.log('3. Assign custom roles to users')
    console.log('4. Delete the Temporary Admin role')
    process.exit(0)
  } catch (error) {
    console.error('Error creating temporary admin:', error)
    process.exit(1)
  }
}

createTempAdmin()
