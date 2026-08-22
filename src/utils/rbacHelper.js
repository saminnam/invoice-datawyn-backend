import User from '../models/User.js'
import Role from '../models/Role.js'
import Permission from '../models/Permission.js'

/**
 * Create a new user with specific role and permissions
 * @param {Object} userData - User data (name, email, password, etc.)
 * @param {String} roleName - Name of the role to assign
 * @param {Array} additionalPermissionNames - Optional additional permission names (beyond role permissions)
 * @returns {Promise<Object>} Created user with populated role and permissions
 */
export const createUserWithRole = async (userData, roleName, additionalPermissionNames = []) => {
  try {
    // Find the role
    const role = await Role.findOne({ name: roleName })
    if (!role) {
      throw new Error(`Role '${roleName}' not found`)
    }

    // Validate additional permissions if provided
    let additionalPermissionIds = []
    if (additionalPermissionNames.length > 0) {
      const validPermissions = await Permission.find({ name: { $in: additionalPermissionNames } })
      if (validPermissions.length !== additionalPermissionNames.length) {
        const foundNames = validPermissions.map(p => p.name)
        const missingNames = additionalPermissionNames.filter(name => !foundNames.includes(name))
        throw new Error(`Permissions not found: ${missingNames.join(', ')}`)
      }
      additionalPermissionIds = validPermissions.map(p => p._id)
    }

    // Create user with role and additional permissions
    const user = await User.create({
      ...userData,
      role: role._id,
      permissions: additionalPermissionIds,
      isActive: true
    })

    // Populate and return the user
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('role')
      .populate('permissions')

    return populatedUser
  } catch (error) {
    throw new Error(`Failed to create user with role: ${error.message}`)
  }
}

/**
 * Create a new role with specific permissions
 * @param {String} name - Role name
 * @param {String} description - Role description
 * @param {Array} permissionNames - Array of permission names (e.g., ['users.view', 'users.create'])
 * @param {Boolean} isSystem - Whether this is a system role (cannot be deleted)
 * @returns {Promise<Object>} Created role with populated permissions
 */
export const createRoleWithPermissions = async (name, description, permissionNames, isSystem = false) => {
  try {
    // Check if role already exists
    const existingRole = await Role.findOne({ name })
    if (existingRole) {
      throw new Error(`Role '${name}' already exists`)
    }

    // Find permissions by name
    const permissions = await Permission.find({ name: { $in: permissionNames } })
    if (permissions.length !== permissionNames.length) {
      const foundNames = permissions.map(p => p.name)
      const missingNames = permissionNames.filter(name => !foundNames.includes(name))
      throw new Error(`Permissions not found: ${missingNames.join(', ')}`)
    }

    // Create role
    const role = await Role.create({
      name,
      description,
      permissions: permissions.map(p => p._id),
      isSystem
    })

    // Populate and return the role
    const populatedRole = await Role.findById(role._id).populate('permissions')
    return populatedRole
  } catch (error) {
    throw new Error(`Failed to create role: ${error.message}`)
  }
}

/**
 * Add permissions to an existing role
 * @param {String} roleName - Name of the role
 * @param {Array} permissionNames - Array of permission names to add
 * @returns {Promise<Object>} Updated role with populated permissions
 */
export const addPermissionsToRole = async (roleName, permissionNames) => {
  try {
    const role = await Role.findOne({ name: roleName })
    if (!role) {
      throw new Error(`Role '${roleName}' not found`)
    }

    // Find permissions by name
    const permissions = await Permission.find({ name: { $in: permissionNames } })
    if (permissions.length !== permissionNames.length) {
      const foundNames = permissions.map(p => p.name)
      const missingNames = permissionNames.filter(name => !foundNames.includes(name))
      throw new Error(`Permissions not found: ${missingNames.join(', ')}`)
    }

    // Add new permissions (avoiding duplicates)
    const currentPermissionIds = role.permissions.map(p => p.toString())
    const newPermissions = permissions.filter(p => !currentPermissionIds.includes(p._id.toString()))

    if (newPermissions.length > 0) {
      role.permissions.push(...newPermissions.map(p => p._id))
      await role.save()
    }

    const populatedRole = await Role.findById(role._id).populate('permissions')
    return populatedRole
  } catch (error) {
    throw new Error(`Failed to add permissions to role: ${error.message}`)
  }
}

/**
 * Remove permissions from a role
 * @param {String} roleName - Name of the role
 * @param {Array} permissionNames - Array of permission names to remove
 * @returns {Promise<Object>} Updated role with populated permissions
 */
export const removePermissionsFromRole = async (roleName, permissionNames) => {
  try {
    const role = await Role.findOne({ name: roleName })
    if (!role) {
      throw new Error(`Role '${roleName}' not found`)
    }

    // Find permissions by name
    const permissions = await Permission.find({ name: { $in: permissionNames } })
    const permissionIdsToRemove = permissions.map(p => p._id)

    // Remove permissions
    role.permissions = role.permissions.filter(
      permId => !permissionIdsToRemove.includes(permId.toString())
    )
    await role.save()

    const populatedRole = await Role.findById(role._id).populate('permissions')
    return populatedRole
  } catch (error) {
    throw new Error(`Failed to remove permissions from role: ${error.message}`)
  }
}

/**
 * Get all available permissions grouped by module
 * @returns {Promise<Object>} Permissions grouped by module
 */
export const getPermissionsByModule = async () => {
  try {
    const permissions = await Permission.find().sort({ module: 1, action: 1 })
    
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = []
      }
      acc[perm.module].push(perm)
      return acc
    }, {})

    return grouped
  } catch (error) {
    throw new Error(`Failed to get permissions by module: ${error.message}`)
  }
}

/**
 * Get user's effective permissions (role permissions + direct permissions)
 * @param {String} userId - User ID
 * @returns {Promise<Array>} Array of permission names
 */
export const getUserEffectivePermissions = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate({
        path: 'role',
        populate: {
          path: 'permissions'
        }
      })
      .populate('permissions')

    if (!user) {
      throw new Error('User not found')
    }

    const permissions = new Set()

    // Add role permissions
    if (user.role && user.role.permissions) {
      user.role.permissions.forEach(p => permissions.add(p.name))
    }

    // Add direct permissions
    if (user.permissions) {
      user.permissions.forEach(p => permissions.add(p.name))
    }

    return Array.from(permissions)
  } catch (error) {
    throw new Error(`Failed to get user permissions: ${error.message}`)
  }
}

/**
 * Check if user has a specific permission
 * @param {String} userId - User ID
 * @param {String} permissionName - Permission name to check
 * @returns {Promise<Boolean>} True if user has the permission
 */
export const checkUserPermission = async (userId, permissionName) => {
  try {
    const effectivePermissions = await getUserEffectivePermissions(userId)
    return effectivePermissions.includes(permissionName)
  } catch (error) {
    throw new Error(`Failed to check user permission: ${error.message}`)
  }
}