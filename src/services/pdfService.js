import PDFKit from 'pdfkit'

export class PDFService {
  static async generateProformaInvoice(invoice, companySettings) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFKit({ margin: 50, size: 'A4' })
        const chunks = []
        
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)
        
        // Company Header
        this.addCompanyHeader(doc, companySettings)
        
        // Invoice Title
        doc.moveDown(2)
        doc.fontSize(20).font('Helvetica-Bold').text('PROFORMA INVOICE', { align: 'center' })
        
        // Invoice Details
        doc.moveDown(1)
        this.addInvoiceDetails(doc, invoice)
        
        // Customer Details
        doc.moveDown(1)
        this.addCustomerDetails(doc, invoice)
        
        // Items Table
        doc.moveDown(1)
        this.addItemsTable(doc, invoice)
        
        // Summary
        doc.moveDown(1)
        this.addSummary(doc, invoice)
        
        // Terms & Bank Details
        doc.moveDown(1)
        this.addFooter(doc, invoice, companySettings)
        
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
  
  static addCompanyHeader(doc, company) {
    if (company.logo) {
      // Add logo if available
      // doc.image(company.logo, 50, 50, { width: 100 })
    }
    
    doc.fontSize(18).font('Helvetica-Bold').text(company.companyName, 50, 50)
    
    let y = 75
    const address = company.address
    if (address.street) {
      doc.fontSize(10).font('Helvetica').text(address.street, 50, y)
      y += 15
    }
    if (address.city || address.state || address.pincode) {
      const cityState = [address.city, address.state, address.pincode].filter(Boolean).join(', ')
      doc.text(cityState, 50, y)
      y += 15
    }
    if (company.email || company.phone) {
      const contact = [company.email, company.phone].filter(Boolean).join(' | ')
      doc.text(contact, 50, y)
      y += 15
    }
    if (company.gstin) {
      doc.text(`GSTIN: ${company.gstin}`, 50, y)
    }
  }
  
  static addInvoiceDetails(doc, invoice) {
    const details = [
      `Invoice No: ${invoice.invoiceNumber}`,
      `Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`,
      `Valid Until: ${invoice.validUntil ? new Date(invoice.validUntil).toLocaleDateString('en-IN') : 'N/A'}`,
    ]
    
    doc.fontSize(10).font('Helvetica')
    details.forEach((detail, i) => {
      doc.text(detail, 400, 100 + (i * 15))
    })
  }
  
  static addCustomerDetails(doc, invoice) {
    const customer = invoice.customerSnapshot
    
    doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50, 160)
    
    let y = 175
    doc.fontSize(10).font('Helvetica')
    
    if (customer.companyName) {
      doc.text(customer.companyName, 50, y)
      y += 15
    }
    if (customer.contactPerson) {
      doc.text(`Contact: ${customer.contactPerson}`, 50, y)
      y += 15
    }
    if (customer.email) {
      doc.text(`Email: ${customer.email}`, 50, y)
      y += 15
    }
    if (customer.phone) {
      doc.text(`Phone: ${customer.phone}`, 50, y)
      y += 15
    }
    
    if (customer.billingAddress) {
      const addr = customer.billingAddress
      if (addr.street) {
        doc.text(addr.street, 50, y)
        y += 15
      }
      const cityState = [addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
      if (cityState) {
        doc.text(cityState, 50, y)
        y += 15
      }
    }
    
    if (customer.gstin) {
      doc.text(`GSTIN: ${customer.gstin}`, 50, y)
    }
  }
  
  static addItemsTable(doc, invoice) {
    const tableTop = 280
    const itemHeight = 25
    const colWidths = [200, 50, 60, 60, 60, 80]
    
    // Header
    doc.fontSize(9).font('Helvetica-Bold')
    const headers = ['Description', 'Qty', 'Rate', 'GST %', 'Taxable', 'Total']
    let x = 50
    
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop)
      x += colWidths[i]
    })
    
    // Line
    doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).stroke()
    
    // Items
    doc.fontSize(8).font('Helvetica')
    let y = tableTop + 20
    
    invoice.items.forEach((item, i) => {
      x = 50
      
      // Description (truncate if too long)
      const desc = item.productSnapshot?.name || 'N/A'
      doc.text(desc.substring(0, 30), x, y)
      x += colWidths[0]
      
      // Quantity
      doc.text(item.quantity.toString(), x, y)
      x += colWidths[1]
      
      // Rate
      doc.text(`₹${item.rate.toFixed(2)}`, x, y)
      x += colWidths[2]
      
      // GST
      doc.text(`${item.gstRate}%`, x, y)
      x += colWidths[3]
      
      // Taxable
      doc.text(`₹${item.taxableAmount.toFixed(2)}`, x, y)
      x += colWidths[4]
      
      // Total
      doc.text(`₹${item.total.toFixed(2)}`, x, y)
      
      y += itemHeight
    })
    
    // Line
    doc.moveTo(50, y).lineTo(550, y).stroke()
  }
  
  static addSummary(doc, invoice) {
    const summaryY = 280 + (invoice.items.length * 25) + 20
    let y = summaryY
    
    doc.fontSize(9).font('Helvetica')
    
    const summaryItems = [
      { label: 'Subtotal', value: invoice.subtotal },
      { label: 'Discount', value: -invoice.itemDiscount - invoice.invoiceDiscount },
      { label: 'Taxable Amount', value: invoice.taxableAmount },
      { label: 'CGST', value: invoice.cgst },
      { label: 'SGST', value: invoice.sgst },
      { label: 'IGST', value: invoice.igst },
      { label: 'Round Off', value: invoice.roundOff },
      { label: 'Grand Total', value: invoice.grandTotal, bold: true },
    ]
    
    summaryItems.forEach(item => {
      doc.text(`${item.label}:`, 400, y)
      doc.text(`₹${item.value.toFixed(2)}`, 500, y)
      y += 15
    })
    
    // Amount in words
    if (invoice.amountInWords) {
      y += 10
      doc.fontSize(8).text(`Amount in Words: ${invoice.amountInWords}`, 50, y)
    }
  }
  
  static addFooter(doc, invoice, company) {
    const footerY = 280 + (invoice.items.length * 25) + 180
    
    // Payment Terms
    if (invoice.paymentTerms) {
      doc.fontSize(9).font('Helvetica-Bold').text('Payment Terms:', 50, footerY)
      doc.fontSize(8).font('Helvetica').text(invoice.paymentTerms, 50, footerY + 15)
    }
    
    // Notes
    if (invoice.notes) {
      doc.fontSize(9).font('Helvetica-Bold').text('Notes:', 50, footerY + 40)
      doc.fontSize(8).font('Helvetica').text(invoice.notes, 50, footerY + 55)
    }
    
    // Bank Details
    if (company.bankDetails) {
      const bank = company.bankDetails
      let y = footerY + 80
      doc.fontSize(9).font('Helvetica-Bold').text('Bank Details:', 50, y)
      doc.fontSize(8).font('Helvetica')
      y += 15
      
      if (bank.bankName) doc.text(`Bank: ${bank.bankName}`, 50, y)
      if (bank.accountNumber) doc.text(`A/C No: ${bank.accountNumber}`, 50, y + 15)
      if (bank.ifsc) doc.text(`IFSC: ${bank.ifsc}`, 50, y + 30)
    }
    
    // Signature
    doc.fontSize(9).font('Helvetica-Bold').text('Authorized Signature', 400, footerY + 120)
    doc.moveTo(400, footerY + 140).lineTo(520, footerY + 140).stroke()
  }
}
