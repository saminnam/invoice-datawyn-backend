import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import User from '../models/User.js'
import Role from '../models/Role.js'
import Permission from '../models/Permission.js'

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      })
    }
    
    const decoded = jwt.verify(token, config.jwtSecret)
    
    // Get user from database with populated role and permissions
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate({
        path: 'role',
        populate: {
          path: 'permissions'
        }
      })
      .populate('permissions')
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      })
    }
    
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      })
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    })
  }
}

// Helper function to check if user has a specific permission
const hasPermission = (user, permissionName) => {
  // Check direct user permissions
  const userPermissions = user.permissions || []
  if (userPermissions.some(p => p.name === permissionName)) {
    return true
  }
  
  // Check role permissions
  if (user.role && user.role.permissions) {
    const rolePermissions = user.role.permissions
    if (rolePermissions.some(p => p.name === permissionName)) {
      return true
    }
  }
  
  return false
}

// Helper function to get all user permissions (combined from role and direct permissions)
const getAllPermissions = (user) => {
  const permissions = new Set()
  
  // Add direct user permissions
  if (user.permissions) {
    user.permissions.forEach(p => permissions.add(p.name))
  }
  
  // Add role permissions
  if (user.role && user.role.permissions) {
    user.role.permissions.forEach(p => permissions.add(p.name))
  }
  
  return Array.from(permissions)
}

// Middleware to check specific permission
export const permissionMiddleware = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    if (hasPermission(req.user, permissionName)) {
      next()
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. Missing permission: ${permissionName}`
      })
    }
  }
}

// Middleware to check multiple permissions (user needs at least one)
export const anyPermissionMiddleware = (permissionNames) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    const hasAnyPermission = permissionNames.some(perm => hasPermission(req.user, perm))
    
    if (hasAnyPermission) {
      next()
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. Missing one of these permissions: ${permissionNames.join(', ')}`
      })
    }
  }
}

// Middleware to check multiple permissions (user needs all)
export const allPermissionsMiddleware = (permissionNames) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    const hasAllPermissions = permissionNames.every(perm => hasPermission(req.user, perm))
    
    if (hasAllPermissions) {
      next()
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. Missing required permissions: ${permissionNames.join(', ')}`
      })
    }
  }
}

// Legacy role middleware (kept for backward compatibility)
export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    // Check by role name if user has a role
    if (req.user.role && allowedRoles.includes(req.user.role.name)) {
      next()
    } else if (allowedRoles.includes(req.user.legacyRole)) {
      // Fallback to legacy role
      next()
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      })
    }
  }
}

// Export helper functions for use in other parts of the application
export { hasPermission, getAllPermissions }
