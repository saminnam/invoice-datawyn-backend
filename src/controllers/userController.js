import User from '../models/User.js'
import Role from '../models/Role.js'
import Permission from '../models/Permission.js'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js'

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query
    
    const query = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (role) {
      query.role = role
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true'
    }
    
    const skip = (page - 1) * limit
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('role')
        .populate('permissions')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ])
    
    paginatedResponse(res, users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    next(error)
  }
}

export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
      .select('-password')
      .populate('role')
      .populate('permissions')
      .populate('createdBy', 'name email')
    
    if (!user) {
      return errorResponse(res, 'User not found', [], 404)
    }
    
    successResponse(res, user)
  } catch (error) {
    next(error)
  }
}

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, permissions, isActive } = req.body
    
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists')
    }
    
    // Validate role
    if (role) {
      const validRole = await Role.findById(role)
      if (!validRole) {
        return errorResponse(res, 'Invalid role')
      }
    }
    
    // Validate permissions
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ _id: { $in: permissions } })
      if (validPermissions.length !== permissions.length) {
        return errorResponse(res, 'Some permissions are invalid')
      }
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: role || null,
      permissions: permissions || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    })
    
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('role')
      .populate('permissions')
      .populate('createdBy', 'name email')
    
    successResponse(res, populatedUser, 'User created successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, email, role, permissions, isActive } = req.body
    
    const user = await User.findById(id)
    if (!user) {
      return errorResponse(res, 'User not found', [], 404)
    }
    
    // Prevent modifying own role/permissions
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'Cannot modify your own role or permissions')
    }
    
    // Prevent modifying the main admin user
    if (user.email === 'admin@datawyn.com') {
      return errorResponse(res, 'Cannot modify the main admin user')
    }
    
    // Check email uniqueness
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return errorResponse(res, 'Email already in use')
      }
    }
    
    // Validate role
    if (role) {
      const validRole = await Role.findById(role)
      if (!validRole) {
        return errorResponse(res, 'Invalid role')
      }
    }
    
    // Validate permissions
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ _id: { $in: permissions } })
      if (validPermissions.length !== permissions.length) {
        return errorResponse(res, 'Some permissions are invalid')
      }
    }
    
    const updateData = { name, email, role, permissions, isActive }
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('role')
      .populate('permissions')
      .populate('createdBy', 'name email')
    
    successResponse(res, updatedUser, 'User updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    
    if (!user) {
      return errorResponse(res, 'User not found', [], 404)
    }
    
    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'Cannot delete your own account')
    }
    
    // Prevent deleting the main admin user
    if (user.email === 'admin@datawyn.com') {
      return errorResponse(res, 'Cannot delete the main admin user')
    }
    
    await User.findByIdAndDelete(id)
    successResponse(res, null, 'User deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body
    
    const user = await User.findById(id)
    if (!user) {
      return errorResponse(res, 'User not found', [], 404)
    }
    
    user.password = newPassword
    await user.save()
    
    successResponse(res, null, 'Password reset successfully')
  } catch (error) {
    next(error)
  }
}

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    
    if (!user) {
      return errorResponse(res, 'User not found', [], 404)
    }
    
    // Prevent deactivating yourself
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'Cannot deactivate your own account')
    }
    
    // Prevent deactivating the main admin user
    if (user.email === 'admin@datawyn.com') {
      return errorResponse(res, 'Cannot deactivate the main admin user')
    }
    
    user.isActive = !user.isActive
    await user.save()
    
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('role')
      .populate('permissions')
    
    successResponse(res, populatedUser, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`)
  } catch (error) {
    next(error)
  }
}

export const createBulkUsers = async (req, res, next) => {
  try {
    const { users } = req.body
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return errorResponse(res, 'Users array is required')
    }

    if (users.length > 50) {
      return errorResponse(res, 'Cannot create more than 50 users at once')
    }

    const results = {
      successful: [],
      failed: []
    }

    // Validate role once if all users have the same role
    const commonRole = users[0].role
    let validRole = null
    if (commonRole) {
      validRole = await Role.findById(commonRole)
      if (!validRole) {
        return errorResponse(res, 'Invalid role specified')
      }
    }

    // Validate permissions once if all users have the same permissions
    const commonPermissions = users[0].permissions
    let validPermissions = []
    if (commonPermissions && commonPermissions.length > 0) {
      validPermissions = await Permission.find({ _id: { $in: commonPermissions } })
      if (validPermissions.length !== commonPermissions.length) {
        return errorResponse(res, 'Some permissions are invalid')
      }
    }

    for (const userData of users) {
      try {
        const { name, email, password, role, permissions, isActive } = userData

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
          results.failed.push({
            email,
            reason: 'User with this email already exists'
          })
          continue
        }

        // Validate role if different from common
        if (role && role !== commonRole) {
          const roleCheck = await Role.findById(role)
          if (!roleCheck) {
            results.failed.push({
              email,
              reason: 'Invalid role'
            })
            continue
          }
        }

        // Validate permissions if different from common
        if (permissions && permissions.length > 0) {
          const permCheck = await Permission.find({ _id: { $in: permissions } })
          if (permCheck.length !== permissions.length) {
            results.failed.push({
              email,
              reason: 'Some permissions are invalid'
            })
            continue
          }
        }

        const user = await User.create({
          name,
          email,
          password,
          role: role || null,
          permissions: permissions || [],
          isActive: isActive !== undefined ? isActive : true,
          createdBy: req.user._id
        })

        const populatedUser = await User.findById(user._id)
          .select('-password')
          .populate('role')
          .populate('permissions')
          .populate('createdBy', 'name email')

        results.successful.push(populatedUser)
      } catch (error) {
        results.failed.push({
          email: userData.email,
          reason: error.message
        })
      }
    }

    successResponse(res, results, `Created ${results.successful.length} users successfully. ${results.failed.length} failed.`)
  } catch (error) {
    next(error)
  }
}