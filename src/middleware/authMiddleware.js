import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import User from '../models/User.js'

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
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password')
    
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

export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      })
    }
    
    next()
  }
}
