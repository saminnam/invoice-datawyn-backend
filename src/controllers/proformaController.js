import ProformaInvoice from '../models/ProformaInvoice.js'
import Customer from '../models/Customer.js'
import CompanySettings from '../models/CompanySettings.js'
import { generateProformaInvoiceNumber } from '../utils/generateInvoiceNumber.js'
import { CalculationService } from '../services/calculationService.js'
import { PDFService } from '../services/pdfService.js'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js'

export const getProformaInvoices = async (req, res, next) => {
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
      ProformaInvoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('customer', 'companyName')
        .populate('createdBy', 'name'),
      ProformaInvoice.countDocuments(query)
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

export const getProformaInvoice = async (req, res, next) => {
  try {
    const invoice = await ProformaInvoice.findById(req.params.id)
      .populate('customer', 'companyName')
      .populate('createdBy', 'name')
    
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404)
    }
    
    successResponse(res, invoice)
  } catch (error) {
    next(error)
  }
}

export const createProformaInvoice = async (req, res, next) => {
  try {
    const { customer, items, ...invoiceData } = req.body
    
    // Validate customer
    if (!customer) {
      return errorResponse(res, 'Customer is required')
    }
    
    if (!items || items.length === 0) {
      return errorResponse(res, 'At least one item is required')
    }
    
    const customerDoc = await Customer.findById(customer)
    if (!customerDoc) {
      return errorResponse(res, 'Customer not found')
    }
    
    // Get company settings for state code
    const companySettings = await CompanySettings.findOne()
    const companyStateCode = companySettings?.address?.stateCode || ''
    
    // Create customer snapshot
    const customerSnapshot = {
      customerId: customerDoc.customerId,
      companyName: customerDoc.companyName,
      contactPerson: customerDoc.contactPerson,
      email: customerDoc.email,
      phone: customerDoc.phone,
      billingAddress: customerDoc.billingAddress,
      gstin: customerDoc.gstin,
      pan: customerDoc.pan,
      state: customerDoc.billingAddress?.state,
      stateCode: customerDoc.billingAddress?.stateCode
    }
    
    // Prepare items with product snapshots
    const itemsWithSnapshots = await Promise.all(items.map(async (item) => {
      const Product = (await import('../models/Product.js')).default
      const product = await Product.findById(item.product)
      
      // Ensure numeric values are valid with fallbacks
      const quantity = Math.max(1, parseFloat(item.quantity) || 1)
      const rate = Math.max(0, parseFloat(item.rate) || 0)
      const discount = Math.max(0, parseFloat(item.discount) || 0)
      const gstRate = Math.max(0, Math.min(100, parseFloat(item.gstRate) || 18))
      
      console.log('Item calculation:', { quantity, rate, discount, gstRate })
      
      return {
        ...item,
        quantity,
        rate,
        discount,
        gstRate,
        productSnapshot: {
          code: product?.code || '',
          name: product?.name || '',
          description: product?.description || '',
          unit: product?.unit || '',
          hsnSacCode: product?.hsnSacCode || ''
        },
        customerStateCode: customerDoc.billingAddress?.stateCode || ''
      }
    }))
    
    // Calculate invoice totals
    const calculations = CalculationService.calculateInvoice(
      { items: itemsWithSnapshots, ...invoiceData },
      companyStateCode
    )
    
    // Generate invoice number
    const prefix = companySettings?.invoiceSettings?.prefix || 'PI'
    const invoiceNumber = await generateProformaInvoiceNumber(prefix)
    
    // Create invoice
    const invoice = await ProformaInvoice.create({
      invoiceNumber,
      customer,
      customerSnapshot,
      items: calculations.items,
      subtotal: calculations.subtotal,
      itemDiscount: calculations.itemDiscount,
      invoiceDiscount: calculations.invoiceDiscount,
      taxableAmount: calculations.taxableAmount,
      cgst: calculations.cgst,
      sgst: calculations.sgst,
      igst: calculations.igst,
      totalTax: calculations.totalTax,
      roundOff: calculations.roundOff,
      grandTotal: calculations.grandTotal,
      amountInWords: calculations.amountInWords,
      createdBy: req.user._id,
      ...invoiceData
    })
    
    successResponse(res, invoice, 'Proforma invoice created successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const updateProformaInvoice = async (req, res, next) => {
  try {
    const { customer, items, ...invoiceData } = req.body
    
    const invoice = await ProformaInvoice.findById(req.params.id)
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404)
    }
    
    // Get company settings
    const companySettings = await CompanySettings.findOne()
    const companyStateCode = companySettings?.address?.stateCode || ''
    
    // Recalculate if items provided
    let calculations
    if (items && items.length > 0) {
      const customerDoc = await Customer.findById(customer || invoice.customer)
      const customerSnapshot = {
        customerId: customerDoc.customerId,
        companyName: customerDoc.companyName,
        contactPerson: customerDoc.contactPerson,
        email: customerDoc.email,
        phone: customerDoc.phone,
        billingAddress: customerDoc.billingAddress,
        gstin: customerDoc.gstin,
        pan: customerDoc.pan,
        state: customerDoc.billingAddress?.state,
        stateCode: customerDoc.billingAddress?.stateCode
      }
      
      const itemsWithSnapshots = await Promise.all(items.map(async (item) => {
        const Product = (await import('../models/Product.js')).default
        const product = await Product.findById(item.product)
        
        return {
          ...item,
          productSnapshot: {
            code: product?.code,
            name: product?.name,
            description: product?.description,
            unit: product?.unit,
            hsnSacCode: product?.hsnSacCode
          },
          customerStateCode: customerDoc.billingAddress?.stateCode
        }
      }))
      
      calculations = CalculationService.calculateInvoice(
        { items: itemsWithSnapshots, ...invoiceData },
        companyStateCode
      )
    }
    
    const updateData = calculations ? {
      items: calculations.items,
      subtotal: calculations.subtotal,
      itemDiscount: calculations.itemDiscount,
      invoiceDiscount: calculations.invoiceDiscount,
      taxableAmount: calculations.taxableAmount,
      cgst: calculations.cgst,
      sgst: calculations.sgst,
      igst: calculations.igst,
      totalTax: calculations.totalTax,
      roundOff: calculations.roundOff,
      grandTotal: calculations.grandTotal,
      amountInWords: calculations.amountInWords,
      ...invoiceData
    } : invoiceData
    
    const updatedInvoice = await ProformaInvoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('customer', 'companyName')
    
    successResponse(res, updatedInvoice, 'Proforma invoice updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteProformaInvoice = async (req, res, next) => {
  try {
    const invoice = await ProformaInvoice.findByIdAndDelete(req.params.id)
    
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404)
    }
    
    successResponse(res, null, 'Proforma invoice deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const duplicateProformaInvoice = async (req, res, next) => {
  try {
    const originalInvoice = await ProformaInvoice.findById(req.params.id)
    
    if (!originalInvoice) {
      return errorResponse(res, 'Invoice not found', [], 404)
    }
    
    // Generate new invoice number
    const companySettings = await CompanySettings.findOne()
    const prefix = companySettings?.invoiceSettings?.prefix || 'PI'
    const invoiceNumber = await generateProformaInvoiceNumber(prefix)
    
    // Create duplicate
    const duplicate = await ProformaInvoice.create({
      ...originalInvoice.toObject(),
      _id: undefined,
      invoiceNumber,
      invoiceDate: new Date(),
      validUntil: null,
      status: 'draft',
      createdBy: req.user._id,
      convertedInvoice: null,
      statusHistory: []
    })
    
    successResponse(res, duplicate, 'Proforma invoice duplicated successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    
    const invoice = await ProformaInvoice.findById(req.params.id)
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404)
    }
    
    // Add to status history
    invoice.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date()
    })
    
    invoice.status = status
    await invoice.save()
    
    successResponse(res, invoice, 'Invoice status updated successfully')
  } catch (error) {
    next(error)
  }
}

export const downloadPDF = async (req, res, next) => {
  try {
    const invoice = await ProformaInvoice.findById(req.params.id)
      .populate('customer', 'companyName')
    
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404)
    }
    
    const companySettings = await CompanySettings.findOne()
    
    const pdfBuffer = await PDFService.generateProformaInvoice(invoice, companySettings)
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const convertToInvoice = async (req, res, next) => {
  try {
    const proformaInvoice = await ProformaInvoice.findById(req.params.id)
    
    if (!proformaInvoice) {
      return errorResponse(res, 'Proforma invoice not found', [], 404)
    }
    
    if (proformaInvoice.convertedInvoice) {
      return errorResponse(res, 'This invoice has already been converted')
    }
    
    const Invoice = (await import('../models/Invoice.js')).default
    const { generateInvoiceNumber } = await import('../utils/generateInvoiceNumber.js')
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber('INV')
    
    // Create final invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceDate: new Date(),
      proformaInvoice: proformaInvoice._id,
      customer: proformaInvoice.customer,
      customerSnapshot: proformaInvoice.customerSnapshot,
      items: proformaInvoice.items,
      subtotal: proformaInvoice.subtotal,
      itemDiscount: proformaInvoice.itemDiscount,
      invoiceDiscount: proformaInvoice.invoiceDiscount,
      taxableAmount: proformaInvoice.taxableAmount,
      cgst: proformaInvoice.cgst,
      sgst: proformaInvoice.sgst,
      igst: proformaInvoice.igst,
      totalTax: proformaInvoice.totalTax,
      roundOff: proformaInvoice.roundOff,
      grandTotal: proformaInvoice.grandTotal,
      amountInWords: proformaInvoice.amountInWords,
      paymentTerms: proformaInvoice.paymentTerms,
      paymentMethod: proformaInvoice.paymentMethod,
      advanceAmount: proformaInvoice.advanceAmount,
      balanceAmount: proformaInvoice.balanceAmount,
      dueDate: proformaInvoice.dueDate,
      notes: proformaInvoice.notes,
      termsAndConditions: proformaInvoice.termsAndConditions,
      createdBy: req.user._id,
      status: 'sent'
    })
    
    // Update proforma invoice
    proformaInvoice.convertedInvoice = invoice._id
    proformaInvoice.status = 'converted'
    proformaInvoice.statusHistory.push({
      status: 'converted',
      changedBy: req.user._id,
      changedAt: new Date()
    })
    await proformaInvoice.save()
    
    successResponse(res, invoice, 'Invoice converted successfully', 201)
  } catch (error) {
    next(error)
  }
}
