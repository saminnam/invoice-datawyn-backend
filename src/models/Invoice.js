import mongoose from 'mongoose'

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceDate: {
    type: Date,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  enableGST: {
    type: Boolean,
    default: true,
  },

  // Reference to Proforma
  proformaInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProformaInvoice',
  },
  
  // Customer Reference & Snapshot
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  customerSnapshot: mongoose.Schema.Types.Mixed,
  
  // Items (copied from proforma)
  items: [mongoose.Schema.Types.Mixed],
  
  // Financial Calculations
  subtotal: Number,
  itemDiscount: Number,
  invoiceDiscount: Number,
  taxableAmount: Number,
  cgst: Number,
  sgst: Number,
  igst: Number,
  totalTax: Number,
  roundOff: Number,
  grandTotal: Number,
  amountInWords: String,
  
  // Payment Details
  paymentTerms: String,
  paymentMethod: String,
  advanceAmount: Number,
  balanceAmount: Number,
  dueDate: Date,
  
  // Additional Information
  notes: String,
  termsAndConditions: String,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
})

// Indexes
invoiceSchema.index({ customer: 1 })
invoiceSchema.index({ proformaInvoice: 1 })
invoiceSchema.index({ status: 1 })
invoiceSchema.index({ invoiceDate: 1 })

const Invoice = mongoose.model('Invoice', invoiceSchema)

export default Invoice
