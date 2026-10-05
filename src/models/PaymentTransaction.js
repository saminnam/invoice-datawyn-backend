import mongoose from 'mongoose'

const paymentTransactionSchema = new mongoose.Schema({
  // Reference to installment
  installment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentInstallment',
    required: true,
  },
  
  // Reference to payment plan
  paymentPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentPlan',
    required: true,
  },
  
  // Reference to customer
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  
  // Transaction details
  transactionId: {
    type: String,
  },
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  
  // Amount
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative'],
  },
  
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'card', 'other'],
    required: true,
  },
  
  // Reference/ID from payment gateway or manual entry
  referenceNumber: String,
  
  // Notes
  notes: String,
  
  // Receipt
  receiptUrl: String,
  
  // Transaction status
  status: {
    type: String,
    enum: ['completed', 'failed', 'refunded', 'cancelled'],
    default: 'completed',
  },
  
  // Recorded by
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Additional metadata
  metadata: mongoose.Schema.Types.Mixed,
  
}, {
  timestamps: true,
})

// Indexes
paymentTransactionSchema.index({ installment: 1 })
paymentTransactionSchema.index({ paymentPlan: 1 })
paymentTransactionSchema.index({ customer: 1 })
paymentTransactionSchema.index({ transactionDate: 1 })
paymentTransactionSchema.index({ status: 1 })

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema)

export default PaymentTransaction
