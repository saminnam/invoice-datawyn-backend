import { amountInWords } from '../utils/amountInWords.js'

export class CalculationService {
  static calculateItem(item) {
    const { quantity, rate, discount = 0, discountType = 'fixed', gstRate } = item
    
    // Ensure numeric values
    const qty = parseFloat(quantity) || 0
    const rt = parseFloat(rate) || 0
    const disc = parseFloat(discount) || 0
    const gst = parseFloat(gstRate) || 0
    
    const subtotal = qty * rt
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * disc) / 100 
      : disc
    const taxableAmount = Math.max(0, subtotal - discountAmount)
    const taxAmount = (taxableAmount * gst) / 100
    const total = taxableAmount + taxAmount
    
    return {
      subtotal: Math.max(0, subtotal),
      discountAmount: Math.max(0, discountAmount),
      taxableAmount: Math.max(0, taxableAmount),
      taxAmount: Math.max(0, taxAmount),
      total: Math.max(0, total)
    }
  }
  
  static calculateInvoice(invoiceData, companyStateCode) {
    console.log('calculateInvoice input:', invoiceData)
    const { items, invoiceDiscount = 0, invoiceDiscountType = 'fixed' } = invoiceData
    
    // Calculate each item
    const calculatedItems = items.map(item => {
      console.log('Processing item:', item)
      const itemCalc = this.calculateItem(item)
      console.log('Item calculation result:', itemCalc)
      
      // Determine GST type based on state
      const customerStateCode = item.customerStateCode || ''
      const isInterState = customerStateCode && companyStateCode && customerStateCode !== companyStateCode
      
      const taxAmount = itemCalc.taxAmount
      return {
        ...item,
        taxableAmount: itemCalc.taxableAmount,
        cgst: isInterState ? 0 : taxAmount / 2,
        sgst: isInterState ? 0 : taxAmount / 2,
        igst: isInterState ? taxAmount : 0,
        total: itemCalc.total
      }
    })
    
    // Calculate invoice totals
    const subtotal = calculatedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const itemDiscount = calculatedItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0)
    
    console.log('Invoice totals before discount:', { subtotal, itemDiscount })
    
    // Calculate invoice-level discount
    const invDiscount = parseFloat(invoiceDiscount) || 0
    const invoiceDiscountAmount = invoiceDiscountType === 'percentage'
      ? (subtotal * invDiscount) / 100
      : invDiscount
    
    const totalDiscount = itemDiscount + invoiceDiscountAmount
    const taxableAmount = Math.max(0, subtotal - totalDiscount)
    
    const totalCgst = calculatedItems.reduce((sum, item) => sum + (item.cgst || 0), 0)
    const totalSgst = calculatedItems.reduce((sum, item) => sum + (item.sgst || 0), 0)
    const totalIgst = calculatedItems.reduce((sum, item) => sum + (item.igst || 0), 0)
    const totalTax = totalCgst + totalSgst + totalIgst
    
    const grandTotal = taxableAmount + totalTax
    const roundOff = Math.round(grandTotal) - grandTotal
    const finalAmount = Math.round(grandTotal)
    
    console.log('Final calculations:', { subtotal, itemDiscount, invoiceDiscountAmount, taxableAmount, totalCgst, totalSgst, totalIgst, totalTax, grandTotal, roundOff, finalAmount })
    
    return {
      items: calculatedItems,
      subtotal: Math.max(0, subtotal),
      itemDiscount: Math.max(0, itemDiscount),
      invoiceDiscount: Math.max(0, invoiceDiscountAmount),
      taxableAmount: Math.max(0, taxableAmount),
      cgst: Math.max(0, totalCgst),
      sgst: Math.max(0, totalSgst),
      igst: Math.max(0, totalIgst),
      totalTax: Math.max(0, totalTax),
      roundOff: Math.max(0, roundOff),
      grandTotal: Math.max(0, grandTotal),
      finalAmount: Math.max(0, finalAmount),
      amountInWords: amountInWords(finalAmount)
    }
  }
}
