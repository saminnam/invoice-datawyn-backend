import PaymentPlan from '../models/PaymentPlan.js'
import PaymentInstallment from '../models/PaymentInstallment.js'
import PaymentTransaction from '../models/PaymentTransaction.js'
import ProformaInvoice from '../models/ProformaInvoice.js'
import Invoice from '../models/Invoice.js'
import { successResponse, errorResponse } from '../utils/response.js'

// Helper function to check and update overdue status
const checkOverdueStatus = (installment) => {
  const today = new Date()
  const dueDate = new Date(installment.dueDate)
  
  if (dueDate < today && installment.status !== 'paid') {
    const diffTime = Math.abs(today - dueDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    installment.isOverdue = true
    installment.daysOverdue = diffDays
    if (installment.status === 'pending') {
      installment.status = 'overdue'
    }
  } else {
    installment.isOverdue = false
    installment.daysOverdue = 0
    if (installment.status === 'overdue') {
      installment.status = 'pending'
    }
  }
  
  return installment
}

// Create Payment Plan
export const createPaymentPlan = async (req, res, next) => {
  try {
    const {
      invoiceType,
      invoiceId,
      invoiceNumber,
      customer,
      planType,
      paymentMethod,
      totalAmount,
      paymentSchedule,
      emiDetails
    } = req.body
    
    // Validate required fields
    if (!invoiceType || !invoiceId || !customer || !planType || !totalAmount) {
      return errorResponse(res, 'Missing required fields')
    }
    
    // Validate total scheduled amount matches invoice amount
    if (paymentSchedule && paymentSchedule.length > 0) {
      const totalScheduled = paymentSchedule.reduce((sum, item) => sum + (item.amount || 0), 0)
      if (Math.abs(totalScheduled - totalAmount) > 0.01) {
        return errorResponse(res, `Total scheduled amount (${totalScheduled}) must equal invoice amount (${totalAmount})`)
      }
    }
    
    // Validate percentage-based payments
    if (paymentMethod === 'percentage_based' && paymentSchedule) {
      const totalPercentage = paymentSchedule.reduce((sum, item) => sum + (item.percentage || 0), 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return errorResponse(res, `Total percentage (${totalPercentage}%) must equal 100%`)
      }
    }
    
    // Create payment plan
    const paymentPlan = await PaymentPlan.create({
      invoiceType,
      invoiceId,
      invoiceNumber,
      customer,
      planType,
      paymentMethod,
      totalAmount,
      remainingAmount: totalAmount,
      emiDetails,
      createdBy: req.user._id,
    })
    
    // Create installments
    const installments = []
    if (paymentSchedule && paymentSchedule.length > 0) {
      for (let i = 0; i < paymentSchedule.length; i++) {
        const schedule = paymentSchedule[i]
        const installment = await PaymentInstallment.create({
          paymentPlan: paymentPlan._id,
          installmentNumber: i + 1,
          paymentName: schedule.paymentName || `Payment ${i + 1}`,
          paymentType: schedule.paymentType || 'other',
          scheduledAmount: schedule.amount,
          percentage: schedule.percentage,
          dueDate: schedule.dueDate,
          remainingAmount: schedule.amount,
          status: 'pending',
        })
        
        // Check if overdue
        checkOverdueStatus(installment)
        await installment.save()
        
        installments.push(installment)
      }
    }
    
    // Update invoice with payment plan reference
    if (invoiceType === 'proforma') {
      await ProformaInvoice.findByIdAndUpdate(invoiceId, { paymentPlan: paymentPlan._id })
    } else if (invoiceType === 'invoice') {
      await Invoice.findByIdAndUpdate(invoiceId, { paymentPlan: paymentPlan._id })
    }
    
    successResponse(res, {
      paymentPlan,
      installments,
    }, 'Payment plan created successfully', 201)
  } catch (error) {
    next(error)
  }
}

// Get Payment Plan by Invoice
export const getPaymentPlanByInvoice = async (req, res, next) => {
  try {
    const { invoiceType, invoiceId } = req.params
    
    const paymentPlan = await PaymentPlan.findOne({
      invoiceType,
      invoiceId,
    })
      .populate('customer', 'companyName email phone')
      .populate('createdBy', 'name')
    
    if (!paymentPlan) {
      return errorResponse(res, 'Payment plan not found', [], 404)
    }
    
    // Get installments
    const installments = await PaymentInstallment.find({
      paymentPlan: paymentPlan._id,
    }).sort({ installmentNumber: 1 })
    
    // Check overdue status for all installments
    for (const installment of installments) {
      checkOverdueStatus(installment)
      await installment.save()
    }
    
    // Get payment transactions
    const transactions = await PaymentTransaction.find({
      paymentPlan: paymentPlan._id,
    })
      .populate('installment', 'paymentName installmentNumber')
      .populate('recordedBy', 'name')
      .sort({ transactionDate: -1 })
    
    // Calculate summary
    const totalPaid = installments.reduce((sum, inst) => sum + inst.amountPaid, 0)
    const pendingInstallments = installments.filter(inst => inst.status === 'pending').length
    const paidInstallments = installments.filter(inst => inst.status === 'paid').length
    const overdueInstallments = installments.filter(inst => inst.isOverdue).length
    const nextPayment = installments.find(inst => inst.status === 'pending' && !inst.isOverdue)
    
    successResponse(res, {
      paymentPlan,
      installments,
      transactions,
      summary: {
        totalPaid,
        remainingAmount: paymentPlan.remainingAmount,
        pendingInstallments,
        paidInstallments,
        overdueInstallments,
        nextPayment,
        progressPercentage: (totalPaid / paymentPlan.totalAmount) * 100,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Record Payment
export const recordPayment = async (req, res, next) => {
  try {
    const {
      installmentId,
      amount,
      paymentMethod,
      paymentDate,
      referenceNumber,
      notes,
      receiptUrl,
    } = req.body
    
    // Validate
    if (!installmentId || !amount || !paymentMethod) {
      return errorResponse(res, 'Missing required fields')
    }
    
    // Get installment
    const installment = await PaymentInstallment.findById(installmentId)
      .populate('paymentPlan')
    
    if (!installment) {
      return errorResponse(res, 'Installment not found', [], 404)
    }
    
    if (installment.status === 'paid') {
      return errorResponse(res, 'This installment is already fully paid')
    }
    
    const paymentPlan = installment.paymentPlan
    
    // Check if amount exceeds remaining
    if (amount > installment.remainingAmount) {
      return errorResponse(res, `Amount (${amount}) exceeds remaining amount (${installment.remainingAmount})`)
    }
    
    // Generate transaction ID
    const count = await PaymentTransaction.countDocuments()
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const paddedNumber = String(count + 1).padStart(6, '0')
    const transactionId = `TXN-${year}${month}-${paddedNumber}`
    
    // Create transaction
    const transaction = await PaymentTransaction.create({
      installment: installmentId,
      paymentPlan: paymentPlan._id,
      customer: paymentPlan.customer,
      transactionId,
      amount,
      paymentMethod,
      transactionDate: paymentDate || new Date(),
      referenceNumber,
      notes,
      receiptUrl,
      recordedBy: req.user._id,
    })
    
    // Update installment
    installment.amountPaid += amount
    installment.remainingAmount -= amount
    installment.paidDate = paymentDate || new Date()
    installment.paymentMethod = paymentMethod
    installment.transactionId = transaction.transactionId
    installment.notes = notes
    installment.receiptUrl = receiptUrl
    
    // Update status
    if (installment.remainingAmount <= 0.01) {
      installment.status = 'paid'
      installment.remainingAmount = 0
    } else {
      installment.status = 'partial'
    }
    
    // Check overdue status
    checkOverdueStatus(installment)
    await installment.save()
    
    // Update payment plan
    paymentPlan.totalPaid += amount
    paymentPlan.remainingAmount -= amount
    
    // Check if all installments are paid
    const allInstallments = await PaymentInstallment.find({ paymentPlan: paymentPlan._id })
    const allPaid = allInstallments.every(inst => inst.status === 'paid')
    
    if (allPaid) {
      paymentPlan.status = 'completed'
    }
    
    await paymentPlan.save()
    
    successResponse(res, {
      transaction,
      installment,
      paymentPlan,
    }, 'Payment recorded successfully')
  } catch (error) {
    next(error)
  }
}

// Get Payment History
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { customer } = req.params
    
    const transactions = await PaymentTransaction.find({ customer })
      .populate('installment', 'paymentName installmentNumber')
      .populate('paymentPlan', 'invoiceNumber invoiceType')
      .populate('recordedBy', 'name')
      .sort({ transactionDate: -1 })
    
    successResponse(res, transactions)
  } catch (error) {
    next(error)
  }
}

// Update Payment Plan
export const updatePaymentPlan = async (req, res, next) => {
  try {
    const { id } = req.params
    const { paymentSchedule, emiDetails } = req.body
    
    const paymentPlan = await PaymentPlan.findById(id)
    if (!paymentPlan) {
      return errorResponse(res, 'Payment plan not found', [], 404)
    }
    
    // Don't allow updates if payments have been made
    const hasPayments = await PaymentTransaction.exists({ paymentPlan: id })
    if (hasPayments) {
      return errorResponse(res, 'Cannot update payment plan after payments have been made')
    }
    
    // Delete existing installments
    await PaymentInstallment.deleteMany({ paymentPlan: id })
    
    // Create new installments
    const installments = []
    if (paymentSchedule && paymentSchedule.length > 0) {
      for (let i = 0; i < paymentSchedule.length; i++) {
        const schedule = paymentSchedule[i]
        const installment = await PaymentInstallment.create({
          paymentPlan: paymentPlan._id,
          installmentNumber: i + 1,
          paymentName: schedule.paymentName || `Payment ${i + 1}`,
          paymentType: schedule.paymentType || 'other',
          scheduledAmount: schedule.amount,
          percentage: schedule.percentage,
          dueDate: schedule.dueDate,
          remainingAmount: schedule.amount,
          status: 'pending',
        })
        
        checkOverdueStatus(installment)
        await installment.save()
        
        installments.push(installment)
      }
    }
    
    // Update EMI details if provided
    if (emiDetails) {
      paymentPlan.emiDetails = emiDetails
    }
    
    await paymentPlan.save()
    
    successResponse(res, {
      paymentPlan,
      installments,
    }, 'Payment plan updated successfully')
  } catch (error) {
    next(error)
  }
}

// Delete Payment Plan
export const deletePaymentPlan = async (req, res, next) => {
  try {
    const { id } = req.params
    
    const paymentPlan = await PaymentPlan.findById(id)
    if (!paymentPlan) {
      return errorResponse(res, 'Payment plan not found', [], 404)
    }
    
    // Don't allow deletion if payments have been made
    const hasPayments = await PaymentTransaction.exists({ paymentPlan: id })
    if (hasPayments) {
      return errorResponse(res, 'Cannot delete payment plan after payments have been made')
    }
    
    // Delete installments
    await PaymentInstallment.deleteMany({ paymentPlan: id })
    
    // Remove reference from invoice
    if (paymentPlan.invoiceType === 'proforma') {
      await ProformaInvoice.findByIdAndUpdate(paymentPlan.invoiceId, { paymentPlan: null })
    } else if (paymentPlan.invoiceType === 'invoice') {
      await Invoice.findByIdAndUpdate(paymentPlan.invoiceId, { paymentPlan: null })
    }
    
    // Delete payment plan
    await PaymentPlan.findByIdAndDelete(id)
    
    successResponse(res, null, 'Payment plan deleted successfully')
  } catch (error) {
    next(error)
  }
}

// Get Customer Payment Summary
export const getCustomerPaymentSummary = async (req, res, next) => {
  try {
    const { customer } = req.params
    
    // Get all payment plans for customer
    const paymentPlans = await PaymentPlan.find({ customer })
      .populate('invoiceId', 'invoiceNumber')
    
    // Get all installments
    const installmentIds = paymentPlans.map(p => p._id)
    const installments = await PaymentInstallment.find({
      paymentPlan: { $in: installmentIds },
    })
    
    // Check overdue status
    for (const installment of installments) {
      checkOverdueStatus(installment)
      await installment.save()
    }
    
    // Calculate summary
    const totalInvoiceAmount = paymentPlans.reduce((sum, p) => sum + p.totalAmount, 0)
    const totalPaid = paymentPlans.reduce((sum, p) => sum + p.totalPaid, 0)
    const totalRemaining = paymentPlans.reduce((sum, p) => sum + p.remainingAmount, 0)
    const pendingInstallments = installments.filter(inst => inst.status === 'pending').length
    const paidInstallments = installments.filter(inst => inst.status === 'paid').length
    const overdueInstallments = installments.filter(inst => inst.isOverdue).length
    
    // Get next payment
    const nextPayment = installments
      .filter(inst => inst.status === 'pending' && !inst.isOverdue)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
    
    successResponse(res, {
      summary: {
        totalInvoiceAmount,
        totalPaid,
        totalRemaining,
        pendingInstallments,
        paidInstallments,
        overdueInstallments,
        nextPayment,
        progressPercentage: totalInvoiceAmount > 0 ? (totalPaid / totalInvoiceAmount) * 100 : 0,
      },
      paymentPlans,
      installments,
    })
  } catch (error) {
    next(error)
  }
}
