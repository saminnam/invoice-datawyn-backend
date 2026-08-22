/**
 * RBAC Usage Examples
 * 
 * This file demonstrates how to use the dynamic RBAC system to:
 * 1. Create custom roles with specific permissions
 * 2. Assign roles to users
 * 3. Add/remove permissions from roles
 * 4. Grant additional permissions to individual users
 */

import mongoose from 'mongoose'
import { config } from '../src/config/env.js'
import Role from '../src/models/Role.js'
import User from '../src/models/User.js'
import {
  createUserWithRole,
  createRoleWithPermissions,
  addPermissionsToRole,
  removePermissionsFromRole,
  getPermissionsByModule,
  getUserEffectivePermissions,
  checkUserPermission
} from '../src/utils/rbacHelper.js'

const exampleUsage = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB\n')

    // Example 1: Create a custom role for Sales Manager
    console.log('=== Example 1: Creating Sales Manager Role ===')
    let salesManagerRole
    try {
      salesManagerRole = await createRoleWithPermissions(
        'Sales Manager',
        'Can manage customers and create proforma invoices',
        [
          'dashboard.view',
          'customers.view',
          'customers.create',
          'customers.edit',
          'products.view',
          'proforma.view',
          'proforma.create',
          'proforma.edit',
          'invoices.view'
        ],
        false // Not a system role
      )
      console.log('Created Sales Manager role with permissions:', 
        salesManagerRole.permissions.map(p => p.name))
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Sales Manager role already exists, using existing role')
        salesManagerRole = await Role.findOne({ name: 'Sales Manager' }).populate('permissions')
      } else {
        throw error
      }
    }
    console.log()

    // Example 2: Create a custom role for Accountant
    console.log('=== Example 2: Creating Accountant Role ===')
    let accountantRole
    try {
      accountantRole = await createRoleWithPermissions(
        'Accountant',
        'Can manage invoices and financial reports',
        [
          'dashboard.view',
          'customers.view',
          'invoices.view',
          'invoices.create',
          'invoices.edit',
          'invoices.delete',
          'reports.view',
          'reports.export'
        ],
        false
      )
      console.log('Created Accountant role with permissions:', 
        accountantRole.permissions.map(p => p.name))
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Accountant role already exists, using existing role')
        accountantRole = await Role.findOne({ name: 'Accountant' }).populate('permissions')
      } else {
        throw error
      }
    }
    console.log()

    // Example 3: Create a user with Sales Manager role
    console.log('=== Example 3: Creating Sales Manager User ===')
    let salesManager
    try {
      salesManager = await createUserWithRole(
        {
          name: 'John Smith',
          email: 'john.smith@datawyn.com',
          password: 'password123'
        },
        'Sales Manager'
      )
      console.log('Created Sales Manager user:', salesManager.name, salesManager.email)
      console.log('Role:', salesManager.role.name)
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        console.log('Sales Manager user already exists, using existing user')
        salesManager = await User.findOne({ email: 'john.smith@datawyn.com' })
          .select('-password')
          .populate('role')
          .populate('permissions')
      } else {
        throw error
      }
    }
    console.log()

    // Example 4: Create a user with Accountant role + additional permissions
    console.log('=== Example 4: Creating Accountant User with Extra Permissions ===')
    let accountant
    try {
      accountant = await createUserWithRole(
        {
          name: 'Jane Doe',
          email: 'jane.doe@datawyn.com',
          password: 'password123'
        },
        'Accountant',
        // Additional permissions beyond the Accountant role
        ['products.view']
      )
      console.log('Created Accountant user:', accountant.name, accountant.email)
      console.log('Role:', accountant.role.name)
      console.log('Additional permissions:', 
        accountant.permissions.map(p => p.name))
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        console.log('Accountant user already exists, using existing user')
        accountant = await User.findOne({ email: 'jane.doe@datawyn.com' })
          .select('-password')
          .populate('role')
          .populate('permissions')
      } else {
        throw error
      }
    }
    console.log()

    // Example 5: Add permissions to existing role
    console.log('=== Example 5: Adding Permissions to Sales Manager Role ===')
    const updatedSalesManager = await addPermissionsToRole(
      'Sales Manager',
      ['proforma.delete', 'proforma.convert']
    )
    console.log('Updated Sales Manager role permissions:', 
      updatedSalesManager.permissions.map(p => p.name))
    console.log()

    // Example 6: Remove permissions from role
    console.log('=== Example 6: Removing Permission from Accountant Role ===')
    const updatedAccountant = await removePermissionsFromRole(
      'Accountant',
      ['invoices.delete']
    )
    console.log('Updated Accountant role permissions:', 
      updatedAccountant.permissions.map(p => p.name))
    console.log()

    // Example 7: Get all permissions grouped by module
    console.log('=== Example 7: Getting All Permissions by Module ===')
    const permissionsByModule = await getPermissionsByModule()
    Object.keys(permissionsByModule).forEach(module => {
      console.log(`\n${module.toUpperCase()}:`)
      permissionsByModule[module].forEach(perm => {
        console.log(`  - ${perm.name}: ${perm.description}`)
      })
    })
    console.log()

    // Example 8: Get user's effective permissions
    console.log('=== Example 8: Getting User Effective Permissions ===')
    const johnPermissions = await getUserEffectivePermissions(salesManager._id)
    console.log(`John Smith's effective permissions (${johnPermissions.length}):`)
    johnPermissions.forEach(perm => console.log(`  - ${perm}`))
    console.log()

    // Example 9: Check specific permission
    console.log('=== Example 9: Checking Specific Permissions ===')
    const canCreateProforma = await checkUserPermission(salesManager._id, 'proforma.create')
    const canDeleteUsers = await checkUserPermission(salesManager._id, 'users.delete')
    console.log(`John Smith can create proforma invoices: ${canCreateProforma}`)
    console.log(`John Smith can delete users: ${canDeleteUsers}`)
    console.log()

    console.log('=== Examples completed successfully ===')
    console.log('\nSummary:')
    console.log('- Created custom roles: Sales Manager, Accountant')
    console.log('- Created users with these roles')
    console.log('- Demonstrated dynamic permission management')
    console.log('- Showed permission checking capabilities')

    process.exit(0)
  } catch (error) {
    console.error('Error in examples:', error)
    process.exit(1)
  }
}

// Run the examples
exampleUsage()