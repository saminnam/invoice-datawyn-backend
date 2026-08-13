import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  stateCode: String,
  country: { type: String, default: 'India' },
  pincode: String,
}, { _id: false })

const bankDetailsSchema = new mongoose.Schema({
  bankName: String,
  accountHolderName: String,
  accountNumber: String,
  ifsc: String,
  branch: String,
}, { _id: false })

const invoiceSettingsSchema = new mongoose.Schema({
  prefix: { type: String, default: 'PI' },
  startingNumber: { type: Number, default: 1 },
  defaultCurrency: { type: String, default: 'INR' },
  defaultGst: { type: Number, default: 18 },
  defaultPaymentTerms: String,
  defaultNotes: String,
  defaultTerms: String,
}, { _id: false })

const companySettingsSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    // For future multi-tenant support
  },
  
  // Company Information
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  logo: String,
  email: String,
  phone: String,
  website: String,
  address: {
    type: addressSchema,
    default: {},
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true,
  },
  pan: {
    type: String,
    trim: true,
    uppercase: true,
  },
  businessRegistrationNumber: String,
  
  // Bank Details
  bankDetails: {
    type: bankDetailsSchema,
    default: {},
  },
  
  // Invoice Settings
  invoiceSettings: {
    type: invoiceSettingsSchema,
    default: {},
  },
}, {
  timestamps: true,
})

// There should be only one company settings document
companySettingsSchema.pre('save', async function(next) {
  const count = await mongoose.model('CompanySettings').countDocuments()
  if (count >= 1 && this.isNew) {
    throw new Error('Only one company settings document is allowed')
  }
  next()
})

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema)

export default CompanySettings
