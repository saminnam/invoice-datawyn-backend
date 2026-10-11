import mongoose from 'mongoose'
import { config } from './config/env.js'
import User from './models/User.js'
import Role from './models/Role.js'

const listUsersAndRoles = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB\n')

    const users = await User.find({})
      .select('name email role')
      .populate('role')

    if (users.length === 0) {
      console.log('No users found in the database')
      process.exit(0)
    }

    console.log('=== Users and Their Roles ===\n')

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`)
      if (user.role) {
        console.log(`   Role: ${user.role.name}`)
        console.log(`   Description: ${user.role.description}`)
      } else {
        console.log('   Role: Not assigned')
      }
      console.log('')
    })

    console.log('\n=== Available Roles ===\n')

    const roles = await Role.find({})
    roles.forEach(role => {
      console.log(`- ${role.name}: ${role.description}`)
      console.log(`  Permissions: ${role.permissions.length} permissions`)
    })

    console.log('\n\nTo assign a role to a user, run:')
    console.log('node src/assignRoleToUser.js <user-email> <role-name>')
    console.log('\nExample:')
    console.log('node src/assignRoleToUser.js user@example.com Manager')

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

listUsersAndRoles()
