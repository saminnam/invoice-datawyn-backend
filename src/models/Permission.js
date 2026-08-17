import mongoose from 'mongoose'

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  module: {
    type: String,
    required: true,
    enum: ['dashboard', 'customers', 'products', 'proforma', 'invoices', 'settings', 'users', 'reports']
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'manage']
  }
}, {
  timestamps: true
})

const Permission = mongoose.model('Permission', permissionSchema)

export default Permission