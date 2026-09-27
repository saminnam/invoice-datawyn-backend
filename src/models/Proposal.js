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

const scopeOfWorkItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  bulletPoints: [String],
}, { _id: false })

const deliverableItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  quantity: Number,
  notes: String,
}, { _id: false })

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  expectedDate: Date,
  duration: String,
}, { _id: false })

const proposalItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  productSnapshot: {
    type: productSnapshotSchema,
    default: {},
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  customName: String,
  customDescription: String,
  priceRange: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'custom'],
    default: 'standard',
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
  subtotal: Number,
  discountAmount: Number,
  taxableAmount: Number,
  taxAmount: Number,
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

const proposalSchema = new mongoose.Schema({
  proposalNumber: {
    type: String,
    required: true,
    unique: true,
  },
  proposalDate: {
    type: Date,
    required: true,
  },
  validUntil: Date,
  
  // Project Information
  projectTitle: {
    type: String,
    required: true,
  },
  projectSubtitle: String,
  projectDescription: String,
  objectives: String,
  proposedSolution: String,
  
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
  
  // Scope of Work
  scopeOfWork: [scopeOfWorkItemSchema],
  
  // Deliverables
  deliverables: [deliverableItemSchema],
  
  // Technology Stack
  technologyStack: [String],
  
  // Timeline
  timeline: {
    startDate: Date,
    estimatedCompletionDate: Date,
    duration: String,
    milestones: [milestoneSchema],
  },
  
  // Items (Products/Services)
  items: [proposalItemSchema],
  
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
  advanceAmount: {
    type: Number,
    default: 0,
  },
  balanceAmount: Number,
  
  // Additional Information
  termsAndConditions: String,
  notes: String,
  internalNotes: String,
  preparedBy: String,
  
  // Status & Tracking
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  statusHistory: [statusHistorySchema],
}, {
  timestamps: true,
})

// Indexes
proposalSchema.index({ customer: 1 })
proposalSchema.index({ status: 1 })
proposalSchema.index({ proposalDate: 1 })
proposalSchema.index({ createdBy: 1 })
proposalSchema.index({ proposalNumber: 1 })

const Proposal = mongoose.model('Proposal', proposalSchema)

export default Proposal
