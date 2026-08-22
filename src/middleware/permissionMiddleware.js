import User from '../models/User.js'
import Role from '../models/Role.js'
import Permission from '../models/Permission.js'

/**
 * Check if user has a specific permission
 * @param {string} permissionName - The permission name to check (e.g., 'users.create')
 */
export const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      // Get fresh user data with populated role and permissions
      const user = await User.findById(req.user._id)
        .populate('role')
        .populate('permissions')

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        })
      }

      // Check if user has the permission directly
      const hasDirectPermission = user.permissions.some(
        p => p.name === permissionName
      )

      // Check if user has permission through role
      let hasRolePermission = false
      if (user.role) {
        const populatedRole = await Role.findById(user.role._id).populate('permissions')
        hasRolePermission = populatedRole.permissions.some(
          p => p.name === permissionName
        )
      }

      if (!hasDirectPermission && !hasRolePermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${permissionName} required`
        })
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      })
    }
  }
}

/**
 * Check if user has any of the specified permissions
 * @param {string[]} permissionNames - Array of permission names (user needs at least one)
 */
export const requireAnyPermission = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      const user = await User.findById(req.user._id)
        .populate('role')
        .populate('permissions')

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        })
      }

      // Check direct permissions
      const hasDirectPermission = user.permissions.some(
        p => permissionNames.includes(p.name)
      )

      // Check role permissions
      let hasRolePermission = false
      if (user.role) {
        const populatedRole = await Role.findById(user.role._id).populate('permissions')
        hasRolePermission = populatedRole.permissions.some(
          p => permissionNames.includes(p.name)
        )
      }

      if (!hasDirectPermission && !hasRolePermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: One of ${permissionNames.join(', ')} required`
        })
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      })
    }
  }
}

/**
 * Check if user has all specified permissions
 * @param {string[]} permissionNames - Array of permission names (user needs all of them)
 */
export const requireAllPermissions = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      const user = await User.findById(req.user._id)
        .populate('role')
        .populate('permissions')

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        })
      }

      // Collect all user permissions (direct + role)
      const allPermissions = [...user.permissions]
      if (user.role) {
        const populatedRole = await Role.findById(user.role._id).populate('permissions')
        allPermissions.push(...populatedRole.permissions)
      }

      // Check if user has all required permissions
      const hasAllPermissions = permissionNames.every(requiredPerm =>
        allPermissions.some(p => p.name === requiredPerm)
      )

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: All of ${permissionNames.join(', ')} required`
        })
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      })
    }
  }
}

/**
 * Check if user is an admin (has Admin role)
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    const user = await User.findById(req.user._id).populate('role')

    if (!user || !user.role) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      })
    }

    // Check if role name contains 'admin' (case-insensitive)
    const isAdmin = user.role.name.toLowerCase().includes('admin')
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      })
    }

    next()
  } catch (error) {
    console.error('Admin check error:', error)
    return res.status(500).json({
      success: false,
      message: 'Error checking admin status'
    })
  }
}
