import Customer from '../models/Customer.js'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js'

export const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query
    
    const query = {}
    
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (status === 'active' || status === 'inactive') {
      query.isActive = status === 'active'
    }
    
    const skip = (page - 1) * limit
    
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email'),
      Customer.countDocuments(query)
    ])
    
    paginatedResponse(res, customers, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    next(error)
  }
}

export const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('createdBy', 'name email')
    
    if (!customer) {
      return errorResponse(res, 'Customer not found', [], 404)
    }
    
    successResponse(res, customer)
  } catch (error) {
    next(error)
  }
}

export const createCustomer = async (req, res, next) => {
  try {
    const customerData = {
      ...req.body,
      createdBy: req.user._id
    }
    
    const customer = await Customer.create(customerData)
    
    successResponse(res, customer, 'Customer created successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!customer) {
      return errorResponse(res, 'Customer not found', [], 404)
    }
    
    successResponse(res, customer, 'Customer updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id)
    
    if (!customer) {
      return errorResponse(res, 'Customer not found', [], 404)
    }
    
    successResponse(res, null, 'Customer deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const getCustomerInvoices = async (req, res, next) => {
  try {
    const ProformaInvoice = (await import('../models/ProformaInvoice.js')).default
    
    const invoices = await ProformaInvoice.find({ customer: req.params.id })
      .sort({ createdAt: -1 })
      .select('invoiceNumber invoiceDate grandTotal status')
    
    successResponse(res, invoices)
  } catch (error) {
    next(error)
  }
}
