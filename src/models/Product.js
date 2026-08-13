import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['static', 'dynamic'],
    default: 'static',
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
})

// Generate product code before saving
productSchema.pre('save', async function(next) {
  if (!this.code) {
    const count = await mongoose.model('Product').countDocuments()
    const year = new Date().getFullYear()
    const paddedNumber = String(count + 1).padStart(4, '0')
    this.code = `PROD-${year}-${paddedNumber}`
  }
  next()
})

// Indexes
productSchema.index({ name: 'text' })
productSchema.index({ status: 1 })
productSchema.index({ createdBy: 1 })

const Product = mongoose.model('Product', productSchema)

export default Product
