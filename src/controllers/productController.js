import Product from '../models/Product.js'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js'

export const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, type } = req.query
    
    const query = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (status === 'active' || status === 'inactive') {
      query.status = status
    }
    
    if (type === 'product' || type === 'service') {
      query.type = type
    }
    
    const skip = (page - 1) * limit
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email'),
      Product.countDocuments(query)
    ])
    
    paginatedResponse(res, products, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    next(error)
  }
}

export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email')
    
    if (!product) {
      return errorResponse(res, 'Product not found', [], 404)
    }
    
    successResponse(res, product)
  } catch (error) {
    next(error)
  }
}

export const createProduct = async (req, res, next) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user._id
    }
    
    const product = await Product.create(productData)
    
    successResponse(res, product, 'Product created successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!product) {
      return errorResponse(res, 'Product not found', [], 404)
    }
    
    successResponse(res, product, 'Product updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    
    if (!product) {
      return errorResponse(res, 'Product not found', [], 404)
    }
    
    successResponse(res, null, 'Product deleted successfully')
  } catch (error) {
    next(error)
  }
}
