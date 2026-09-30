import Proposal from '../models/Proposal.js'
import Customer from '../models/Customer.js'
import CompanySettings from '../models/CompanySettings.js'
import { generateProposalNumber } from '../utils/generateInvoiceNumber.js'
import { CalculationService } from '../services/calculationService.js'
import { PDFService } from '../services/pdfService.js'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js'

export const getProposals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, customer } = req.query
    
    const query = {}
    
    if (search) {
      query.$or = [
        { proposalNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.companyName': { $regex: search, $options: 'i' } },
        { projectTitle: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (status) {
      query.status = status
    }
    
    if (customer) {
      query.customer = customer
    }
    
    const skip = (page - 1) * limit
    
    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('customer', 'companyName')
        .populate('createdBy', 'name'),
      Proposal.countDocuments(query)
    ])
    
    paginatedResponse(res, proposals, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    next(error)
  }
}

export const getProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('customer', 'companyName')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
    
    if (!proposal) {
      return errorResponse(res, 'Proposal not found', [], 404)
    }
    
    successResponse(res, proposal)
  } catch (error) {
    next(error)
  }
}

export const createProposal = async (req, res, next) => {
  try {
    const { customer, items, scopeOfWork, deliverables, timeline, technologyStack, ...proposalData } = req.body
    
    // Validate customer
    if (!customer) {
      return errorResponse(res, 'Customer is required')
    }
    
    if (!items || items.length === 0) {
      return errorResponse(res, 'At least one item is required')
    }
    
    if (!proposalData.projectTitle) {
      return errorResponse(res, 'Project title is required')
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
      
      const isCustom = item.isCustom || false
      
      if (isCustom) {
        return {
          ...item,
          quantity,
          rate,
          discount,
          gstRate,
          isCustom: true,
          customName: item.customName || 'Custom Item',
          customDescription: item.customDescription || '',
          productSnapshot: {
            code: '',
            name: item.customName || 'Custom Item',
            description: item.customDescription || '',
            unit: '',
            hsnSacCode: ''
          },
          customerStateCode: customerDoc.billingAddress?.stateCode || ''
        }
      } else {
        return {
          ...item,
          quantity,
          rate,
          discount,
          gstRate,
          isCustom: false,
          productSnapshot: {
            code: product?.code || '',
            name: product?.name || '',
            description: product?.description || '',
            unit: product?.unit || '',
            hsnSacCode: product?.hsnSacCode || ''
          },
          customerStateCode: customerDoc.billingAddress?.stateCode || ''
        }
      }
    }))
    
    // Calculate proposal totals
    const calculations = CalculationService.calculateInvoice(
      { items: itemsWithSnapshots, ...proposalData, enableGST: proposalData.enableGST !== undefined ? proposalData.enableGST : true },
      companyStateCode
    )
    
    // Generate proposal number
    const proposalNumber = await generateProposalNumber('PROP')
    
    // Create proposal
    const proposal = await Proposal.create({
      proposalNumber,
      customer,
      customerSnapshot,
      items: calculations.items,
      scopeOfWork: scopeOfWork || [],
      deliverables: deliverables || [],
      technologyStack: technologyStack || [],
      timeline: timeline || {},
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
      ...proposalData
    })
    
    successResponse(res, proposal, 'Proposal created successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const updateProposal = async (req, res, next) => {
  try {
    const { customer, items, scopeOfWork, deliverables, timeline, technologyStack, ...proposalData } = req.body
    
    const proposal = await Proposal.findById(req.params.id)
    if (!proposal) {
      return errorResponse(res, 'Proposal not found', [], 404)
    }
    
    // Get company settings
    const companySettings = await CompanySettings.findOne()
    const companyStateCode = companySettings?.address?.stateCode || ''
    
    // Recalculate if items provided
    let calculations
    if (items && items.length > 0) {
      const customerDoc = await Customer.findById(customer || proposal.customer)
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
        
        const isCustom = item.isCustom || false
        
        if (isCustom) {
          return {
            ...item,
            isCustom: true,
            customName: item.customName || 'Custom Item',
            customDescription: item.customDescription || '',
            productSnapshot: {
              code: '',
              name: item.customName || 'Custom Item',
              description: item.customDescription || '',
              unit: '',
              hsnSacCode: ''
            },
            customerStateCode: customerDoc.billingAddress?.stateCode
          }
        } else {
          return {
            ...item,
            isCustom: false,
            productSnapshot: {
              code: product?.code,
              name: product?.name,
              description: product?.description,
              unit: product?.unit,
              hsnSacCode: product?.hsnSacCode
            },
            customerStateCode: customerDoc.billingAddress?.stateCode
          }
        }
      }))
      
      calculations = CalculationService.calculateInvoice(
        { items: itemsWithSnapshots, ...proposalData, enableGST: proposalData.enableGST !== undefined ? proposalData.enableGST : true },
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
      scopeOfWork,
      deliverables,
      technologyStack,
      timeline,
      updatedBy: req.user._id,
      ...proposalData
    } : {
      scopeOfWork,
      deliverables,
      technologyStack,
      timeline,
      updatedBy: req.user._id,
      ...proposalData
    }
    
    const updatedProposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('customer', 'companyName')
    
    successResponse(res, updatedProposal, 'Proposal updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findByIdAndDelete(req.params.id)
    
    if (!proposal) {
      return errorResponse(res, 'Proposal not found', [], 404)
    }
    
    successResponse(res, null, 'Proposal deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const duplicateProposal = async (req, res, next) => {
  try {
    const originalProposal = await Proposal.findById(req.params.id)
    
    if (!originalProposal) {
      return errorResponse(res, 'Proposal not found', [], 404)
    }
    
    // Generate new proposal number
    const proposalNumber = await generateProposalNumber('PROP')
    
    // Create duplicate
    const duplicate = await Proposal.create({
      ...originalProposal.toObject(),
      _id: undefined,
      proposalNumber,
      proposalDate: new Date(),
      validUntil: null,
      status: 'draft',
      createdBy: req.user._id,
      updatedBy: undefined,
      statusHistory: []
    })
    
    successResponse(res, duplicate, 'Proposal duplicated successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const updateProposalStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    
    const proposal = await Proposal.findById(req.params.id)
    if (!proposal) {
      return errorResponse(res, 'Proposal not found', [], 404)
    }
    
    // Add to status history
    proposal.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date()
    })
    
    proposal.status = status
    proposal.updatedBy = req.user._id
    await proposal.save()
    
    successResponse(res, proposal, 'Proposal status updated successfully')
  } catch (error) {
    next(error)
  }
}

export const downloadPDF = async (req, res, next) => {
  try {
    console.log('Starting PDF generation for proposal:', req.params.id)
    
    const proposal = await Proposal.findById(req.params.id)
      .populate('customer', 'companyName')
    
    if (!proposal) {
      return errorResponse(res, 'Proposal not found', [], 404)
    }
    
    console.log('Proposal found:', proposal.proposalNumber)
    
    const companySettings = await CompanySettings.findOne()
    console.log('Company settings found:', !!companySettings)
    
    // Ensure proposal has required arrays to prevent errors
    const safeProposal = {
      ...proposal.toObject(),
      scopeOfWork: proposal.scopeOfWork || [],
      deliverables: proposal.deliverables || [],
      technologyStack: proposal.technologyStack || [],
      items: proposal.items || [],
      timeline: proposal.timeline || {}
    }
    
    const pdfBuffer = await PDFService.generateProposal(safeProposal, companySettings)
    
    console.log('PDF generated successfully, size:', pdfBuffer.length)
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${proposal.proposalNumber}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('PDF generation error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error message:', error.message)
    return errorResponse(res, `Failed to generate PDF: ${error.message}`, [], 500)
  }
}
