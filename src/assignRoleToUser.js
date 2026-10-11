import mongoose from 'mongoose'
import { config } from './config/env.js'
import User from './models/User.js'
import Role from './models/Role.js'

const assignRoleToUser = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    const userEmail = process.argv[2]
    const roleName = process.argv[3]

    if (!userEmail || !roleName) {
      console.log('Usage: node src/assignRoleToUser.js <user-email> <role-name>')
      console.log('Example: node src/assignRoleToUser.js user@example.com Manager')
      console.log('\nAvailable roles: Admin, Manager, Staff, Viewer')
      process.exit(1)
    }

    // Find the user
    const user = await User.findOne({ email: userEmail })
    if (!user) {
      console.error(`User with email '${userEmail}' not found`)
      process.exit(1)
    }

    // Find the role
    const role = await Role.findOne({ name: roleName }).populate('permissions')
    if (!role) {
      console.error(`Role '${roleName}' not found`)
      console.log('Available roles:')
      const roles = await Role.find({})
      roles.forEach(r => console.log(`  - ${r.name}: ${r.description}`))
      process.exit(1)
    }

    // Assign role to user
    user.role = role._id
    await user.save()

    console.log(`\n✓ Successfully assigned role '${roleName}' to user '${userEmail}'`)
    console.log(`\nUser: ${user.name} (${user.email})`)
    console.log(`Role: ${role.name}`)
    console.log(`Role Permissions: ${role.permissions.length} permissions`)
    console.log(`\nPermissions:`)
    role.permissions.forEach(p => {
      console.log(`  - ${p.name}: ${p.description}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

assignRoleToUser()
