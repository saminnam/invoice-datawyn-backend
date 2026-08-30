import Invoice from '../models/Invoice.js'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js'
import { PDFService } from '../services/pdfService.js'
import { EmailService } from '../services/emailService.js'
import CompanySettings from '../models/CompanySettings.js'
import ProformaInvoice from '../models/ProformaInvoice.js'

export const getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, customer } = req.query
    
    const query = {}
    
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.companyName': { $regex: search, $options: 'i' } }
      ]
    }
    
    if (status) {
      query.status = status
    }
    
    if (customer) {
      query.customer = customer
    }
    
    const skip = (page - 1) * limit
    
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('customer', 'companyName')
        .populate('proformaInvoice', 'invoiceNumber')
        .populate('createdBy', 'name'),
      Invoice.countDocuments(query)
    ])
    
    paginatedResponse(res, invoices, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    next(error)
  }
}

export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'companyName')
      .populate('proformaInvoice', 'invoiceNumber')
      .populate('createdBy', 'name')
    
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404)
    }
    
    successResponse(res, invoice)
  } catch (error) {
    next(error)
  }
}

export const downloadInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'companyName')
    
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404)
    }
    
    const companySettings = await CompanySettings.findOne()
    
    // Use same PDF generation as proforma (invoice structure is similar)
    const pdfBuffer = await PDFService.generateProformaInvoice(invoice, companySettings)
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
    
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404)
    }
    
    // If this invoice was converted from a proforma invoice, update the proforma invoice
    if (invoice.proformaInvoice) {
      await ProformaInvoice.findByIdAndUpdate(invoice.proformaInvoice, {
        convertedInvoice: null,
        status: 'draft'
      })
    }
    
    await Invoice.findByIdAndDelete(req.params.id)
    
    successResponse(res, null, 'Invoice deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const sendEmail = async (req, res, next) => {
  try {
    const { email, emailType, message } = req.body
    
    if (!email) {
      return errorResponse(res, 'Email is required')
    }
    
    const result = await EmailService.sendInvoice(req.params.id, { email, message })
    
    successResponse(res, null, result.message)
  } catch (error) {
    next(error)
  }
}
