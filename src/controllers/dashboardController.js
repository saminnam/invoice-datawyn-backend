import Customer from '../models/Customer.js'
import Product from '../models/Product.js'
import ProformaInvoice from '../models/ProformaInvoice.js'
import PaymentPlan from '../models/PaymentPlan.js'
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

    // Calculate paid and pending amounts from accepted/converted invoices
    const acceptedInvoices = await ProformaInvoice.aggregate([
      { $match: { status: { $in: ['accepted', 'converted'] } } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: { $ifNull: ['$advanceAmount', 0] } },
          totalGrand: { $sum: '$grandTotal' }
        }
      }
    ])

    // Calculate total paid from payment plans
    const paymentPlansPaid = await PaymentPlan.aggregate([
      { $match: { status: { $in: ['active', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPaid' } } }
    ])

    const invoicePaidAmount = acceptedInvoices[0]?.totalPaid || 0
    const paymentPlanPaidAmount = paymentPlansPaid[0]?.total || 0
    const totalPaidAmount = invoicePaidAmount + paymentPlanPaidAmount

    const totalGrandAmount = acceptedInvoices[0]?.totalGrand || 0
    const totalPendingAmount = totalGrandAmount - totalPaidAmount

    const stats = {
      totalCustomers,
      totalProducts,
      totalProformaInvoices,
      totalInvoiceValue: totalInvoiceValue[0]?.total || 0,
      totalPaidAmount,
      totalPendingAmount,
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
