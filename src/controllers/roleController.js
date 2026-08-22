import Role from '../models/Role.js'
import Permission from '../models/Permission.js'
import { successResponse, errorResponse } from '../utils/response.js'

export const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().populate('permissions').sort({ name: 1 })
    successResponse(res, roles)
  } catch (error) {
    next(error)
  }
}

export const getRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const role = await Role.findById(id).populate('permissions')
    
    if (!role) {
      return errorResponse(res, 'Role not found', [], 404)
    }
    
    successResponse(res, role)
  } catch (error) {
    next(error)
  }
}

export const createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body
    
    console.log('Create role request body:', { name, description, permissions })
    
    // Check if role already exists
    const existingRole = await Role.findOne({ name })
    if (existingRole) {
      return errorResponse(res, 'Role with this name already exists')
    }
    
    // Validate permissions
    if (permissions && permissions.length > 0) {
      console.log('Validating permissions:', permissions)
      const validPermissions = await Permission.find({ _id: { $in: permissions } })
      console.log('Valid permissions found:', validPermissions.length, 'out of', permissions.length)
      if (validPermissions.length !== permissions.length) {
        return errorResponse(res, 'Some permissions are invalid')
      }
    }
    
    const role = await Role.create({
      name,
      description,
      permissions: permissions || []
    })
    
    console.log('Role created:', role)
    
    const populatedRole = await Role.findById(role._id).populate('permissions')
    successResponse(res, populatedRole, 'Role created successfully', 201)
  } catch (error) {
    console.error('Create role error:', error)
    next(error)
  }
}

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, permissions } = req.body
    
    const role = await Role.findById(id)
    if (!role) {
      return errorResponse(res, 'Role not found', [], 404)
    }
    
    // Prevent modification of system roles (including Admin)
    if (role.isSystem) {
      return errorResponse(res, 'Cannot modify system roles')
    }
    
    // Validate permissions
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ _id: { $in: permissions } })
      if (validPermissions.length !== permissions.length) {
        return errorResponse(res, 'Some permissions are invalid')
      }
    }
    
    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { name, description, permissions: permissions || [] },
      { new: true, runValidators: true }
    ).populate('permissions')
    
    successResponse(res, updatedRole, 'Role updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const role = await Role.findById(id)
    
    if (!role) {
      return errorResponse(res, 'Role not found', [], 404)
    }
    
    // Prevent deletion of system roles
    if (role.isSystem) {
      return errorResponse(res, 'Cannot delete system roles')
    }
    
    // Prevent deletion of Admin role specifically
    if (role.name === 'Admin') {
      return errorResponse(res, 'Cannot delete the Admin role')
    }
    
    await Role.findByIdAndDelete(id)
    successResponse(res, null, 'Role deleted successfully')
  } catch (error) {
    next(error)
  }
}