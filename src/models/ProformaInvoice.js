import mongoose from 'mongoose'

const customerSnapshotSchema = new mongoose.Schema({
  customerId: String,
  companyName: String,
  contactPerson: String,
  email: String,
  phone: String,
  billingAddress: mongoose.Schema.Types.Mixed,
  gstin: String,
  pan: String,
  state: String,
  stateCode: String,
}, { _id: false })

const productSnapshotSchema = new mongoose.Schema({
  code: String,
  name: String,
  description: String,
  unit: String,
  hsnSacCode: String,
}, { _id: false })

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  productSnapshot: {
    type: productSnapshotSchema,
    default: {},
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'Rate cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed',
  },
  gstRate: {
    type: Number,
    required: true,
    min: [0, 'GST rate cannot be negative'],
    max: [100, 'GST rate cannot exceed 100'],
  },
  taxableAmount: Number,
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  total: Number,
}, { _id: false })

const statusHistorySchema = new mongoose.Schema({
  status: String,
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  changedAt: { type: Date, default: Date.now },
  notes: String,
}, { _id: false })

const proformaInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceDate: {
    type: Date,
    required: true,
  },
  validUntil: Date,
  currency: {
    type: String,
    default: 'INR',
  },
  
  // Customer Reference & Snapshot
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  customerSnapshot: {
    type: customerSnapshotSchema,
    default: {},
  },
  
  // Invoice Items
  items: [invoiceItemSchema],
  
  // Financial Calculations
  subtotal: {
    type: Number,
    required: true,
  },
  itemDiscount: {
    type: Number,
    default: 0,
  },
  invoiceDiscount: {
    type: Number,
    default: 0,
  },
  invoiceDiscountType: {
    type: String,
    enum: ['fixed', 'percentage'],
  },
  taxableAmount: {
    type: Number,
    required: true,
  },
  cgst: {
    type: Number,
    default: 0,
  },
  sgst: {
    type: Number,
    default: 0,
  },
  igst: {
    type: Number,
    default: 0,
  },
  totalTax: {
    type: Number,
    required: true,
  },
  roundOff: {
    type: Number,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  amountInWords: String,
  
  // Payment Details
  paymentTerms: String,
  paymentMethod: String,
  advanceAmount: {
    type: Number,
    default: 0,
  },
  balanceAmount: Number,
  dueDate: Date,
  placeOfSupply: String,
  
  // Additional Information
  notes: String,
  termsAndConditions: String,
  salesperson: String,
  
  // Status & Tracking
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'],
    default: 'draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  convertedInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
  statusHistory: [statusHistorySchema],
}, {
  timestamps: true,
})

// Indexes
proformaInvoiceSchema.index({ customer: 1 })
proformaInvoiceSchema.index({ status: 1 })
proformaInvoiceSchema.index({ invoiceDate: 1 })
proformaInvoiceSchema.index({ createdBy: 1 })

const ProformaInvoice = mongoose.model('ProformaInvoice', proformaInvoiceSchema)

export default ProformaInvoice
