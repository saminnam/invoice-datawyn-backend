import mongoose from 'mongoose'
import { config } from './config/env.js'
import Permission from './models/Permission.js'
import Role from './models/Role.js'

const addPaymentPermissions = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    // Check if payment permissions already exist
    const existingPermissions = await Permission.find({ module: 'payment' })
    if (existingPermissions.length > 0) {
      console.log('Payment permissions already exist:')
      existingPermissions.forEach(p => console.log(`  - ${p.name}`))
    } else {
      // Create payment permissions
      const paymentPermissions = await Permission.create([
        { name: 'payment.view', description: 'View payment plans and transactions', module: 'payment', action: 'read' },
        { name: 'payment.create', description: 'Create payment plans', module: 'payment', action: 'create' },
        { name: 'payment.edit', description: 'Edit payment plans and record payments', module: 'payment', action: 'update' },
        { name: 'payment.delete', description: 'Delete payment plans', module: 'payment', action: 'delete' }
      ])
      console.log('Created payment permissions:', paymentPermissions.length)

      // Add to Admin role
      const adminRole = await Role.findOne({ name: 'Admin' })
      if (adminRole) {
        const currentPermissionIds = adminRole.permissions.map(p => p.toString())
        const newPermissionIds = paymentPermissions.map(p => p._id.toString())

        // Add only new permissions
        const permissionsToAdd = newPermissionIds.filter(id => !currentPermissionIds.includes(id))

        if (permissionsToAdd.length > 0) {
          adminRole.permissions.push(...permissionsToAdd)
          await adminRole.save()
          console.log(`Added ${permissionsToAdd.length} payment permissions to Admin role`)
        } else {
          console.log('Admin role already has all payment permissions')
        }
      }
    }

    console.log('\n=== Payment Permissions Added Successfully ===')
    process.exit(0)
  } catch (error) {
    console.error('Error adding payment permissions:', error)
    process.exit(1)
  }
}

addPaymentPermissions()
