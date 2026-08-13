import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { config } from '../config/env.js'
import { successResponse, errorResponse } from '../utils/response.js'

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists')
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'staff'
    })
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    
    // Remove password from response
    user.password = undefined
    
    successResponse(res, { user, token }, 'User registered successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    
    // Find user and include password
    const user = await User.findOne({ email }).select('+password')
    
    if (!user) {
      return errorResponse(res, 'Invalid email or password')
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password')
    }
    
    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, 'User account is inactive')
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    
    // Remove password from response
    user.password = undefined
    
    successResponse(res, { user, token }, 'Login successful')
  } catch (error) {
    next(error)
  }
}

export const logout = async (req, res) => {
  // For JWT-based auth, logout is handled client-side by removing the token
  successResponse(res, null, 'Logout successful')
}

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    
    if (!user) {
      return errorResponse(res, 'User not found', [], 404)
    }
    
    successResponse(res, user, 'User retrieved successfully')
  } catch (error) {
    next(error)
  }
}
