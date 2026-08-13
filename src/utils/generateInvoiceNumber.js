import ProformaInvoice from '../models/ProformaInvoice.js'
import Invoice from '../models/Invoice.js'

export const generateProformaInvoiceNumber = async (prefix = 'PI') => {
  const year = new Date().getFullYear()
  const pattern = new RegExp(`^${prefix}-${year}-`)
  
  const count = await ProformaInvoice.countDocuments({
    invoiceNumber: pattern
  })
  
  const nextNumber = count + 1
  const paddedNumber = String(nextNumber).padStart(4, '0')
  
  return `${prefix}-${year}-${paddedNumber}`
}

export const generateInvoiceNumber = async (prefix = 'INV') => {
  const year = new Date().getFullYear()
  const pattern = new RegExp(`^${prefix}-${year}-`)
  
  const count = await Invoice.countDocuments({
    invoiceNumber: pattern
  })
  
  const nextNumber = count + 1
  const paddedNumber = String(nextNumber).padStart(4, '0')
  
  return `${prefix}-${year}-${paddedNumber}`
}
