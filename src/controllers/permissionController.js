import Permission from '../models/Permission.js'
import { successResponse, errorResponse } from '../utils/response.js'

export const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, action: 1 })
    successResponse(res, permissions)
  } catch (error) {
    next(error)
  }
}

export const createPermission = async (req, res, next) => {
  try {
    const { name, description, module, action } = req.body
    
    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name })
    if (existingPermission) {
      return errorResponse(res, 'Permission with this name already exists')
    }
    
    const permission = await Permission.create({
      name,
      description,
      module,
      action
    })
    
    successResponse(res, permission, 'Permission created successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, module, action } = req.body
    
    const permission = await Permission.findByIdAndUpdate(
      id,
      { name, description, module, action },
      { new: true, runValidators: true }
    )
    
    if (!permission) {
      return errorResponse(res, 'Permission not found', [], 404)
    }
    
    successResponse(res, permission, 'Permission updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params
    const permission = await Permission.findByIdAndDelete(id)
    
    if (!permission) {
      return errorResponse(res, 'Permission not found', [], 404)
    }
    
    successResponse(res, null, 'Permission deleted successfully')
  } catch (error) {
    next(error)
  }
}