import Customer from '../models/Customer.js'
import Product from '../models/Product.js'
import ProformaInvoice from '../models/ProformaInvoice.js'
import { successResponse } from '../utils/response.js'

export const getStats = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      totalProducts,
      totalProformaInvoices,
      totalInvoiceValue,
      recentInvoices
    ] = await Promise.all([
      Customer.countDocuments({ isActive: true }),
      Product.countDocuments({ status: 'active' }),
      ProformaInvoice.countDocuments(),
      ProformaInvoice.aggregate([
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      ProformaInvoice.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer', 'companyName')
    ])
    
    const stats = {
      totalCustomers,
      totalProducts,
      totalProformaInvoices,
      totalInvoiceValue: totalInvoiceValue[0]?.total || 0,
      recentInvoices
    }
    
    successResponse(res, stats)
  } catch (error) {
    next(error)
  }
}

export const getCharts = async (req, res, next) => {
  try {
    // Monthly invoice value
    const monthlyValue = await ProformaInvoice.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' }
          },
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ])
    
    // Status distribution
    const statusDistribution = await ProformaInvoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
    
    const charts = {
      monthlyValue,
      statusDistribution
    }
    
    successResponse(res, charts)
  } catch (error) {
    next(error)
  }
}
