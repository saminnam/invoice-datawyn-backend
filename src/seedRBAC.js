import mongoose from 'mongoose'
import { config } from './config/env.js'
import Permission from './models/Permission.js'
import Role from './models/Role.js'
import User from './models/User.js'

const seedRBAC = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    // Clear existing RBAC data
    await Permission.deleteMany({})
    await Role.deleteMany({})
    console.log('Cleared existing RBAC data')

    // Create permissions
    const permissions = await Permission.create([
      // Dashboard permissions
      { name: 'dashboard.view', description: 'View dashboard', module: 'dashboard', action: 'read' },
      
      // Customer permissions
      { name: 'customers.view', description: 'View customers', module: 'customers', action: 'read' },
      { name: 'customers.create', description: 'Create customers', module: 'customers', action: 'create' },
      { name: 'customers.edit', description: 'Edit customers', module: 'customers', action: 'update' },
      { name: 'customers.delete', description: 'Delete customers', module: 'customers', action: 'delete' },
      
      // Product permissions
      { name: 'products.view', description: 'View products', module: 'products', action: 'read' },
      { name: 'products.create', description: 'Create products', module: 'products', action: 'create' },
      { name: 'products.edit', description: 'Edit products', module: 'products', action: 'update' },
      { name: 'products.delete', description: 'Delete products', module: 'products', action: 'delete' },
      
      // Proforma invoice permissions
      { name: 'proforma.view', description: 'View proforma invoices', module: 'proforma', action: 'read' },
      { name: 'proforma.create', description: 'Create proforma invoices', module: 'proforma', action: 'create' },
      { name: 'proforma.edit', description: 'Edit proforma invoices', module: 'proforma', action: 'update' },
      { name: 'proforma.delete', description: 'Delete proforma invoices', module: 'proforma', action: 'delete' },
      { name: 'proforma.convert', description: 'Convert proforma to invoice', module: 'proforma', action: 'manage' },
      
      // Invoice permissions
      { name: 'invoices.view', description: 'View invoices', module: 'invoices', action: 'read' },
      { name: 'invoices.create', description: 'Create invoices', module: 'invoices', action: 'create' },
      { name: 'invoices.edit', description: 'Edit invoices', module: 'invoices', action: 'update' },
      { name: 'invoices.delete', description: 'Delete invoices', module: 'invoices', action: 'delete' },
      
      // Settings permissions
      { name: 'settings.view', description: 'View settings', module: 'settings', action: 'read' },
      { name: 'settings.edit', description: 'Edit settings', module: 'settings', action: 'update' },
      
      // User management permissions
      { name: 'users.view', description: 'View users', module: 'users', action: 'read' },
      { name: 'users.create', description: 'Create users', module: 'users', action: 'create' },
      { name: 'users.edit', description: 'Edit users', module: 'users', action: 'update' },
      { name: 'users.delete', description: 'Delete users', module: 'users', action: 'delete' },
      
      // Role management permissions
      { name: 'roles.view', description: 'View roles', module: 'users', action: 'read' },
      { name: 'roles.create', description: 'Create roles', module: 'users', action: 'create' },
      { name: 'roles.edit', description: 'Edit roles', module: 'users', action: 'update' },
      { name: 'roles.delete', description: 'Delete roles', module: 'users', action: 'delete' },
      
      // Reports permissions
      { name: 'reports.view', description: 'View reports', module: 'reports', action: 'read' },
      { name: 'reports.export', description: 'Export reports', module: 'reports', action: 'manage' }
    ])
    console.log('Created permissions')

    // Create Admin role with all permissions
    const adminRole = await Role.create({
      name: 'Admin',
      description: 'Full system access',
      permissions: permissions.map(p => p._id),
      isSystem: true
    })
    console.log('Created Admin role')

    console.log('\n=== RBAC Data Seeded Successfully ===')
    console.log('Roles created: Admin only')
    console.log('Total permissions:', permissions.length)

    process.exit(0)
  } catch (error) {
    console.error('Error seeding RBAC data:', error)
    process.exit(1)
  }
}

seedRBAC()