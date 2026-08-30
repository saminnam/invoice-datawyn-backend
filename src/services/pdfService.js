import PDFKit from 'pdfkit'
import path from 'path'
import fs from 'fs'

export class PDFService {
  static async generateProformaInvoice(invoice, companySettings) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFKit({ 
          margin: 40, 
          size: 'A4',
          bufferPages: true
        })
        const chunks = []
        
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)
        
        // New color scheme matching the design
        const darkGrey = '#2d2d2d'
        const lightGrey = '#f5f5f5'
        const mediumGrey = '#e0e0e0'
        const white = '#ffffff'
        const textColor = '#333333'
        
        // Add new header
        this.addNewHeader(doc, companySettings, darkGrey, white, 'PROFORMA INVOICE')
        
        // Invoice details section
        this.addInvoiceDetails(doc, invoice, textColor)
        
        // New table design
        this.addNewTable(doc, invoice, lightGrey, mediumGrey, textColor)
        
        // Summary section with dark grey TOTAL box
        this.addNewSummary(doc, invoice, darkGrey, white, textColor)
        
        // Amount in words section
        this.addAmountInWords(doc, invoice, textColor)
        
        // Payment Terms
        this.addPaymentTerms(doc, invoice, textColor)
        
        // Notes
        this.addNotes(doc, invoice, textColor)
        
        // Terms & Conditions
        this.addTermsAndConditions(doc, invoice, textColor)
        
        // Bank Details
        this.addBankDetails(doc, companySettings, textColor)
        
        // Signature section
        const signatureEndY = this.addSignature(doc, invoice, companySettings, textColor)
        
        // Contact footer - positioned after signature with minimum spacing
        this.addContactFooter(doc, companySettings, darkGrey, white, signatureEndY)
        
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  static async generateInvoice(invoice, companySettings) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFKit({ 
          margin: 40, 
          size: 'A4',
          bufferPages: true
        })
        const chunks = []
        
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)
        
        // New color scheme matching the design
        const darkGrey = '#2d2d2d'
        const lightGrey = '#f5f5f5'
        const mediumGrey = '#e0e0e0'
        const white = '#ffffff'
        const textColor = '#333333'
        
        // Add new header
        this.addNewHeader(doc, companySettings, darkGrey, white, 'TAX INVOICE')
        
        // Invoice details section
        this.addInvoiceDetails(doc, invoice, textColor)
        
        // New table design
        this.addNewTable(doc, invoice, lightGrey, mediumGrey, textColor)
        
        // Summary section with dark grey TOTAL box
        this.addNewSummary(doc, invoice, darkGrey, white, textColor)
        
        // Amount in words section
        this.addAmountInWords(doc, invoice, textColor)
        
        // Payment Terms
        this.addPaymentTerms(doc, invoice, textColor)
        
        // Notes
        this.addNotes(doc, invoice, textColor)
        
        // Terms & Conditions
        this.addTermsAndConditions(doc, invoice, textColor)
        
        // Bank Details
        this.addBankDetails(doc, companySettings, textColor)
        
        // Signature section
        const signatureEndY = this.addSignature(doc, invoice, companySettings, textColor)
        
        // Contact footer - positioned after signature with minimum spacing
        this.addContactFooter(doc, companySettings, darkGrey, white, signatureEndY)
        
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
  
  static addNewHeader(doc, company, darkGrey, white, invoiceType = 'INVOICE') {
    // Handle missing company settings
    const safeCompany = company || {}
    
    // Logo on left side with border
    if (safeCompany.logo) {
      try {
        let logoPath
        if (safeCompany.logo.startsWith('/uploads/')) {
          const filename = safeCompany.logo.replace('/uploads/', '')
          logoPath = path.join(process.cwd(), 'uploads', filename)
        } else if (safeCompany.logo.startsWith('uploads/')) {
          logoPath = path.join(process.cwd(), safeCompany.logo)
        } else if (safeCompany.logo.startsWith('http')) {
          console.log('URL-based logos not yet supported in PDF')
        } else {
          logoPath = path.join(process.cwd(), 'uploads', safeCompany.logo)
        }
        
        if (logoPath && fs.existsSync(logoPath)) {
          // Draw border around logo
          doc.rect(40, 40, 80, 80)
            .lineWidth(1)
            .stroke('#e0e0e0')
          doc.image(logoPath, 45, 45, { width: 70, height: 70 })
        } else {
          console.log('Logo file not found at path:', logoPath)
          // Fallback: Company name as text
          doc.fillColor('#333333')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(safeCompany.companyName || 'Datawyn Technologies', 40, 50)
        }
      } catch (error) {
        console.log('Could not load logo:', error)
        // Fallback: Company name as text
        doc.fillColor('#333333')
          .fontSize(18)
          .font('Helvetica-Bold')
          .text(safeCompany.companyName || 'Datawyn Technologies', 40, 50)
      }
    } else {
      // Fallback: Company name as text when no logo
      doc.fillColor('#333333')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(safeCompany.companyName || 'Datawyn Technologies', 40, 50)
    }
    
    // Company name and address details
    let y = 50
    if (!safeCompany.logo || (safeCompany.logo && !fs.existsSync(path.join(process.cwd(), 'uploads', safeCompany.logo.replace('/uploads/', ''))))) {
      y = 80
    }
    
    doc.fillColor('#333333')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(safeCompany.companyName || 'Datawyn Technologies', 130, 40)
    
    y = 70
    const address = safeCompany.address || {}
    if (address.street) {
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(address.street, 130, y)
      y += 15
    }
    if (address.city || address.state || address.pincode) {
      const cityState = [address.city, address.state, address.pincode].filter(Boolean).join(', ')
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(cityState, 130, y)
      y += 15
    }
    if (safeCompany.email) {
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(safeCompany.email, 130, y)
      y += 15
    }
    if (safeCompany.phone) {
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(safeCompany.phone, 130, y)
      y += 15
    }
    if (safeCompany.gstin) {
      doc.fillColor('#333333')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`GSTIN: ${safeCompany.gstin}`, 130, y)
    }
    
    // INVOICE text on right side with black background
    doc.rect(450, 40, 105, 40)
      .fill('#000000')
    
    doc.fillColor('#ffffff')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(invoiceType, 450, 55, { width: 105, align: 'center' })
    
    // Invoice number below
    doc.rect(450, 85, 105, 35)
      .lineWidth(1)
      .stroke('#e0e0e0')
    
    doc.fillColor('#333333')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Invoice No', 455, 92)
  }
  
  static addInvoiceDetails(doc, invoice, textColor) {
    const customer = invoice.customerSnapshot || {}
    
    // Add invoice number to the header box
    doc.fillColor('#333333')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(invoice.invoiceNumber || 'N/A', 455, 105, { width: 100, align: 'center' })
    
    // Invoice details section - two column layout
    let y = 140
    
    // Left column - Invoice Details
    doc.fillColor('#666666')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('INVOICE DETAILS', 40, y)
    
    y += 20
    
    // Invoice No
    doc.fillColor('#666666')
      .fontSize(10)
      .font('Helvetica')
      .text('Invoice No:', 40, y)
    doc.fillColor(textColor)
      .font('Helvetica-Bold')
      .text(invoice.invoiceNumber || 'N/A', 120, y)
    y += 18
    
    // Invoice Date
    doc.fillColor('#666666')
      .fontSize(10)
      .font('Helvetica')
      .text('Date:', 40, y)
    doc.fillColor(textColor)
      .font('Helvetica-Bold')
      .text(invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A', 120, y)
    y += 18
    
    // Proforma Ref (if exists)
    if (invoice.proformaInvoice) {
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text('Proforma Ref:', 40, y)
      doc.fillColor(textColor)
        .font('Helvetica-Bold')
        .text(invoice.proformaInvoice.invoiceNumber || 'N/A', 120, y)
      y += 18
    }
    
    // Status
    doc.fillColor('#666666')
      .fontSize(10)
      .font('Helvetica')
      .text('Status:', 40, y)
    doc.fillColor(textColor)
      .font('Helvetica-Bold')
      .text(invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'N/A', 120, y)
    
    // Right column - Bill To
    y = 140
    const billToX = 320
    
    doc.fillColor('#666666')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('BILL TO', billToX, y)
    
    y += 20
    
    // Company Name
    doc.fillColor(textColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(customer.companyName || 'N/A', billToX, y)
    y += 18
    
    // Contact Person
    if (customer.contactPerson) {
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(customer.contactPerson, billToX, y)
      y += 15
    }
    
    // Email
    if (customer.email) {
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(customer.email, billToX, y)
      y += 15
    }
    
    // Phone
    if (customer.phone) {
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(customer.phone, billToX, y)
      y += 15
    }
    
    // Address
    if (customer.billingAddress) {
      const addr = customer.billingAddress
      const address = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(address, billToX, y)
    } else if (customer.address) {
      const addr = customer.address
      const address = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(address, billToX, y)
    }
    
    // GSTIN
    if (customer.gstin) {
      y += 15
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(`GSTIN: ${customer.gstin}`, billToX, y)
    }
  }
  
  
  static addNewTable(doc, invoice, lightGrey, mediumGrey, textColor) {
    const tableTop = 270
    const rowHeight = 35
    const enableGST = invoice.enableGST !== undefined ? invoice.enableGST : true
    // Adjust column widths based on GST enabled/disabled - matching CRM UI
    const colWidths = enableGST ? [180, 50, 60, 50, 60, 95] : [280, 50, 80, 80, 105]
    const items = invoice.items || []
    
    // Handle missing items gracefully
    if (!items || items.length === 0) {
      doc.fillColor('#999999')
        .fontSize(11)
        .text('No items in this invoice', 40, tableTop + 20)
      return tableTop + 50
    }
    
    // Table header background - light grey
    doc.rect(40, tableTop, 515, 35)
      .fill('#f9fafb')
    
    // Table headers - matching CRM UI
    doc.fillColor('#374151')
      .fontSize(10)
      .font('Helvetica-Bold')
    
    const headers = enableGST 
      ? ['DESCRIPTION', 'QTY', 'RATE', 'GST %', 'TAXABLE', 'TOTAL']
      : ['DESCRIPTION', 'QTY', 'RATE', 'TOTAL']
    let x = 50
    
    headers.forEach((header, i) => {
      if (i === 0) {
        doc.text(header, x, tableTop + 12)
      } else {
        doc.text(header, x, tableTop + 12)
      }
      x += colWidths[i]
    })
    
    // Table rows with alternating colors
    let y = tableTop + rowHeight
    let alternateColor = false
    
    items.forEach((item, index) => {
      // Alternate row colors - light grey
      if (alternateColor) {
        doc.rect(40, y, 515, rowHeight)
          .fill('#f3f4f6')
      } else {
        doc.rect(40, y, 515, rowHeight)
          .fill('#ffffff')
      }
      alternateColor = !alternateColor
      
      // Item data
      doc.fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
      
      x = 50
      
      // Description - handle both proforma and invoice item structures
      let desc = item.productSnapshot?.name || item.description || item.name || 'N/A'
      if (!desc || desc === 'N/A') {
        desc = 'Product/Service'
      }
      doc.text(desc.substring(0, 40), x, y + 12)
      x += colWidths[0]
      
      // Quantity
      const quantity = parseFloat(item.quantity) || 1
      doc.text(quantity.toString(), x, y + 12, { align: 'center' })
      x += colWidths[1]
      
      // Rate
      const rate = parseFloat(item.rate) || 0
      doc.text(`₹${rate.toFixed(2)}`, x, y + 12, { align: 'right' })
      x += colWidths[2]
      
      // GST % (only if GST enabled)
      if (enableGST) {
        const gstRate = parseFloat(item.gstRate) || 0
        doc.text(`${gstRate}%`, x, y + 12, { align: 'center' })
        x += colWidths[3]
        
        // Taxable Amount
        const taxableAmount = parseFloat(item.taxableAmount) || (rate * quantity)
        doc.text(`₹${taxableAmount.toFixed(2)}`, x, y + 12, { align: 'right' })
        x += colWidths[4]
      }
      
      // Total
      const total = parseFloat(item.total) || (rate * quantity)
      doc.fillColor('#374151')
        .font('Helvetica-Bold')
        .text(`₹${total.toFixed(2)}`, x, y + 12, { align: 'right' })
      
      y += rowHeight
    })
    
    // Table border
    doc.rect(40, tableTop, 515, y - tableTop)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    return y
  }
  
  static addNewSummary(doc, invoice, darkGrey, white, textColor) {
    const itemsLength = invoice.items ? invoice.items.length : 0
    const summaryY = 270 + (itemsLength * 35) + 20
    const enableGST = invoice.enableGST !== undefined ? invoice.enableGST : true
    
    // Handle missing financial values with defaults
    const subtotal = parseFloat(invoice.subtotal) || 0
    const itemDiscount = parseFloat(invoice.itemDiscount) || 0
    const invoiceDiscount = parseFloat(invoice.invoiceDiscount) || 0
    const cgst = parseFloat(invoice.cgst) || 0
    const sgst = parseFloat(invoice.sgst) || 0
    const igst = parseFloat(invoice.igst) || 0
    const grandTotal = parseFloat(invoice.grandTotal) || 0
    
    // Summary section on the right - matching CRM UI
    let y = summaryY
    const summaryX = 350
    
    // Sub Total
    doc.fillColor('#4b5563')
      .fontSize(11)
      .font('Helvetica')
      .text('Subtotal', summaryX, y)
    
    doc.fillColor(textColor)
      .font('Helvetica-Bold')
      .text(`₹${subtotal.toFixed(2)}`, 500, y, { align: 'right' })
    
    y += 20
    
    // Discount (if any)
    const totalDiscount = itemDiscount + invoiceDiscount
    if (totalDiscount > 0) {
      doc.fillColor('#4b5563')
        .font('Helvetica')
        .text('Discount', summaryX, y)
      
      doc.fillColor('#dc2626')
        .font('Helvetica-Bold')
        .text(`-₹${totalDiscount.toFixed(2)}`, 500, y, { align: 'right' })
      
      y += 20
    }
    
    // Tax breakdown (only if GST enabled)
    if (enableGST) {
      if (cgst > 0) {
        doc.fillColor('#4b5563')
          .font('Helvetica')
          .text('CGST', summaryX, y)
        
        doc.fillColor(textColor)
          .font('Helvetica-Bold')
          .text(`₹${cgst.toFixed(2)}`, 500, y, { align: 'right' })
        
        y += 20
      }
      
      if (sgst > 0) {
        doc.fillColor('#4b5563')
          .font('Helvetica')
          .text('SGST', summaryX, y)
        
        doc.fillColor(textColor)
          .font('Helvetica-Bold')
          .text(`₹${sgst.toFixed(2)}`, 500, y, { align: 'right' })
        
        y += 20
      }
      
      if (igst > 0) {
        doc.fillColor('#4b5563')
          .font('Helvetica')
          .text('IGST', summaryX, y)
        
        doc.fillColor(textColor)
          .font('Helvetica-Bold')
          .text(`₹${igst.toFixed(2)}`, 500, y, { align: 'right' })
        
        y += 20
      }
    }
    
    y += 10
    
    // Grand Total - matching CRM UI with border
    doc.moveTo(summaryX, y)
      .lineTo(555, y)
      .lineWidth(2)
      .stroke('#e5e7eb')
    
    y += 15
    
    doc.fillColor('#111827')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Grand Total', summaryX, y)
    
    doc.fillColor('#000000')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(`₹${grandTotal.toFixed(2)}`, 500, y, { align: 'right' })
    
    return y + 30
  }
  
  static addAmountInWords(doc, invoice, textColor) {
    const itemsLength = invoice.items ? invoice.items.length : 0
    const amountWordsY = 270 + (itemsLength * 35) + 100
    
    // Amount in words section - matching CRM UI with grey background
    doc.rect(40, amountWordsY, 515, 40)
      .fill('#f9fafb')
    
    doc.rect(40, amountWordsY, 515, 40)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    doc.fillColor('#6b7280')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('AMOUNT IN WORDS', 50, amountWordsY + 10)
    
    const amountWords = invoice.amountInWords || 'Rupees Only'
    doc.fillColor('#111827')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(amountWords, 50, amountWordsY + 25)
    
    return amountWordsY + 50
  }
  
  static addPaymentTerms(doc, invoice, textColor) {
    const itemsLength = invoice.items ? invoice.items.length : 0
    const paymentTermsY = 270 + (itemsLength * 35) + 150
    
    if (invoice.paymentTerms) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('PAYMENT TERMS', 40, paymentTermsY)
      
      doc.fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.paymentTerms, 40, paymentTermsY + 15)
      
      return paymentTermsY + 35
    }
    return paymentTermsY
  }
  
  static addNotes(doc, invoice, textColor) {
    const itemsLength = invoice.items ? invoice.items.length : 0
    const notesY = 270 + (itemsLength * 35) + 180
    
    if (invoice.notes) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('NOTES', 40, notesY)
      
      doc.fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.notes, 40, notesY + 15)
      
      return notesY + 35
    }
    return notesY
  }
  
  static addBankDetails(doc, company, textColor) {
    const itemsLength = 0 // Will be calculated dynamically
    const bankY = 270 + (itemsLength * 35) + 210
    
    const safeCompany = company || {}
    const bankDetails = safeCompany.bankDetails || {}
    
    if (bankDetails.bankName || bankDetails.accountNumber || bankDetails.ifsc) {
      doc.moveTo(40, bankY)
        .lineTo(555, bankY)
        .lineWidth(1)
        .stroke('#e5e7eb')
      
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('BANK DETAILS', 40, bankY + 15)
      
      let y = bankY + 35
      
      // Grid layout for bank details
      const col1X = 40
      const col2X = 200
      
      if (bankDetails.bankName) {
        doc.fillColor('#6b7280')
          .fontSize(9)
          .font('Helvetica')
          .text('Bank Name', col1X, y)
        doc.fillColor('#111827')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(bankDetails.bankName, col1X, y + 12)
        y += 30
      }
      
      if (bankDetails.accountNumber) {
        doc.fillColor('#6b7280')
          .fontSize(9)
          .font('Helvetica')
          .text('Account Number', col1X, y)
        doc.fillColor('#111827')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(bankDetails.accountNumber, col1X, y + 12)
        y += 30
      }
      
      if (bankDetails.ifsc) {
        doc.fillColor('#6b7280')
          .fontSize(9)
          .font('Helvetica')
          .text('IFSC Code', col1X, y)
        doc.fillColor('#111827')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(bankDetails.ifsc, col1X, y + 12)
        y += 30
      }
      
      y = bankY + 35
      
      if (bankDetails.branch) {
        doc.fillColor('#6b7280')
          .fontSize(9)
          .font('Helvetica')
          .text('Branch', col2X, y)
        doc.fillColor('#111827')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(bankDetails.branch, col2X, y + 12)
        y += 30
      }
      
      if (bankDetails.accountHolderName) {
        doc.fillColor('#6b7280')
          .fontSize(9)
          .font('Helvetica')
          .text('Account Holder', col2X, y)
        doc.fillColor('#111827')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(bankDetails.accountHolderName, col2X, y + 12)
      }
      
      return bankY + 100
    }
    return bankY
  }
  
  static addTermsAndConditions(doc, invoice, textColor) {
    const itemsLength = invoice.items ? invoice.items.length : 0
    const termsY = 270 + (itemsLength * 35) + 320
    
    if (invoice.termsAndConditions) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('TERMS & CONDITIONS', 40, termsY)
      
      doc.rect(40, termsY + 15, 515, 40)
        .fill('#f9fafb')
      
      doc.rect(40, termsY + 15, 515, 40)
        .lineWidth(1)
        .stroke('#e5e7eb')
      
      doc.fillColor('#374151')
        .fontSize(9)
        .font('Helvetica')
        .text(invoice.termsAndConditions, 50, termsY + 25, {
          width: 500,
          align: 'justify'
        })
      
      return termsY + 65
    }
    return termsY
  }
  
  static addSignature(doc, invoice, company, textColor) {
    const itemsLength = invoice.items ? invoice.items.length : 0
    const signatureY = 270 + (itemsLength * 35) + 400
    
    // Handle missing company settings
    const safeCompany = company || {}
    
    // Signature section on the right - matching CRM UI
    let currentY = signatureY
    
    // Add signature image if available
    if (safeCompany.authorizedSignatory?.signatureImage) {
      try {
        let signaturePath
        if (safeCompany.authorizedSignatory.signatureImage.startsWith('/uploads/')) {
          const filename = safeCompany.authorizedSignatory.signatureImage.replace('/uploads/', '')
          signaturePath = path.join(process.cwd(), 'uploads', filename)
        } else if (safeCompany.authorizedSignatory.signatureImage.startsWith('uploads/')) {
          signaturePath = path.join(process.cwd(), safeCompany.authorizedSignatory.signatureImage)
        } else if (safeCompany.authorizedSignatory.signatureImage.startsWith('http')) {
          console.log('URL-based signatures not yet supported in PDF')
        } else {
          signaturePath = path.join(process.cwd(), 'uploads', safeCompany.authorizedSignatory.signatureImage)
        }
        
        if (signaturePath && fs.existsSync(signaturePath)) {
          doc.image(signaturePath, 350, currentY, { width: 160, height: 60 })
          currentY += 65
        } else {
          console.log('Signature file not found at path:', signaturePath)
          // Fallback to signature line
          doc.moveTo(350, currentY + 15)
            .lineTo(510, currentY + 15)
            .lineWidth(1)
            .stroke('#e5e7eb')
          currentY += 25
        }
      } catch (error) {
        console.log('Could not load signature:', error)
        // Fallback to signature line
        doc.moveTo(350, currentY + 15)
          .lineTo(510, currentY + 15)
          .lineWidth(1)
          .stroke('#e5e7eb')
        currentY += 25
      }
    } else {
      // Signature line
      doc.moveTo(350, currentY + 15)
        .lineTo(510, currentY + 15)
        .lineWidth(1)
        .stroke('#e5e7eb')
      currentY += 25
    }
    
    // Signature name and designation
    if (safeCompany.authorizedSignatory?.name) {
      doc.fillColor('#111827')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(safeCompany.authorizedSignatory.name, 350, currentY)
      currentY += 15
      
      if (safeCompany.authorizedSignatory?.designation) {
        doc.fillColor('#6b7280')
          .fontSize(10)
          .font('Helvetica')
          .text(safeCompany.authorizedSignatory.designation, 350, currentY)
        currentY += 15
      }
    } else {
      doc.fillColor('#111827')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Authorized Signatory', 350, currentY)
      currentY += 15
    }
    
    // Company name below signature
    doc.fillColor('#6b7280')
      .fontSize(10)
      .font('Helvetica')
      .text(safeCompany.companyName || 'Datawyn Technologies', 350, currentY)
    
    // Return the final Y position but cap it to avoid footer overlap
    return Math.min(currentY + 30, 730)
  }
  
  static addContactFooter(doc, company, darkGrey, white, signatureEndY = 750) {
    // Footer background - position based on content or default
    const footerY = Math.max(signatureEndY + 10, 750)
    doc.rect(0, footerY, 595.28, 40)
      .fill('#f9fafb')
    
    doc.rect(0, footerY, 595.28, 40)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    // Footer message - matching CRM UI
    doc.fillColor('#6b7280')
      .fontSize(9)
      .font('Helvetica')
      .text('This is a computer-generated invoice and does not require a physical signature.', 40, footerY + 15, {
        align: 'center',
        width: 515
      })
  }
}
