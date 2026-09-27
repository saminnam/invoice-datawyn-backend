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
        
        let currentY = 0
        
        // Add new header
        currentY = this.addNewHeader(doc, companySettings, darkGrey, white, 'PROFORMA INVOICE', currentY)
        
        // Invoice details section
        currentY = this.addInvoiceDetails(doc, invoice, textColor, currentY - 35)
        
        // New table design
        currentY = this.addNewTable(doc, invoice, lightGrey, mediumGrey, textColor, currentY)
        
        // Summary section with dark grey TOTAL box
        currentY = this.addNewSummary(doc, invoice, darkGrey, white, textColor, currentY)
        
        // Amount in words section
        currentY = this.addAmountInWords(doc, invoice, textColor, currentY)
        
        // Payment Terms
        currentY = this.addPaymentTerms(doc, invoice, textColor, currentY)
        
        // Notes
        currentY = this.addNotes(doc, invoice, textColor, currentY)
        
        // Terms & Conditions
        currentY = this.addTermsAndConditions(doc, invoice, textColor, currentY)
        
        // Bank Details
        currentY = this.addBankDetails(doc, companySettings, textColor, currentY)
        
        // Signature section
        currentY = this.addSignature(doc, invoice, companySettings, textColor, currentY)
        
        // Contact footer - positioned after signature with minimum spacing
        this.addContactFooter(doc, companySettings, darkGrey, white, currentY)
        
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
        
        let currentY = 0
        
        // Add new header
        currentY = this.addNewHeader(doc, companySettings, darkGrey, white, 'TAX INVOICE', currentY)
        
        // Invoice details section
        currentY = this.addInvoiceDetails(doc, invoice, textColor, currentY - 35)
        
        // New table design
        currentY = this.addNewTable(doc, invoice, lightGrey, mediumGrey, textColor, currentY)
        
        // Summary section with dark grey TOTAL box
        currentY = this.addNewSummary(doc, invoice, darkGrey, white, textColor, currentY)
        
        // Amount in words section
        currentY = this.addAmountInWords(doc, invoice, textColor, currentY)
        
        // Payment Terms
        currentY = this.addPaymentTerms(doc, invoice, textColor, currentY)
        
        // Notes
        currentY = this.addNotes(doc, invoice, textColor, currentY)
        
        // Terms & Conditions
        currentY = this.addTermsAndConditions(doc, invoice, textColor, currentY)
        
        // Bank Details
        currentY = this.addBankDetails(doc, companySettings, textColor, currentY)
        
        // Signature section
        currentY = this.addSignature(doc, invoice, companySettings, textColor, currentY)
        
        // Contact footer - positioned after signature with minimum spacing
        this.addContactFooter(doc, companySettings, darkGrey, white, currentY)
        
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
  
  static addNewHeader(doc, company, darkGrey, white, invoiceType = 'INVOICE', startY = 0) {
    // Handle missing company settings
    const safeCompany = company || {}
    
    const headerY = startY + 40
    
    // Logo on left side with border - improved handling
    let logoLoaded = false
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
          // Draw border around logo with better styling
          doc.rect(40, headerY, 90, 90)
            .lineWidth(1.5)
            .stroke('#d1d5db')
          
          // Add logo with better fit
          doc.image(logoPath, 45, headerY + 5, { 
            width: 80, 
            height: 80,
            fit: [80, 80],
            align: 'center',
            valign: 'center'
          })
          logoLoaded = true
        } else {
          console.log('Logo file not found at path:', logoPath)
        }
      } catch (error) {
        console.log('Could not load logo:', error)
      }
    }
    
    // Company name and address details - improved spacing and typography
    let y = headerY + 10
    if (!logoLoaded) {
      y = headerY + 20
    }
    
    // Company name - larger and more prominent with better color
    doc.fillColor('#111827')
      .fontSize(26)
      .font('Helvetica-Bold')
      .text(safeCompany.companyName || 'Datawyn Technologies', logoLoaded ? 145 : 40, y)
    
    y += 35
    
    // Address details with better formatting
    const address = safeCompany.address || {}
    if (address.street) {
      doc.fillColor('#4b5563')
        .fontSize(11)
        .font('Helvetica')
        .text(address.street, logoLoaded ? 145 : 40, y)
      y += 18
    }
    if (address.city || address.state || address.pincode) {
      const cityState = [address.city, address.state, address.pincode].filter(Boolean).join(', ')
      doc.fillColor('#4b5563')
        .fontSize(11)
        .font('Helvetica')
        .text(cityState, logoLoaded ? 145 : 40, y)
      y += 18
    }
    if (safeCompany.email) {
      doc.fillColor('#4b5563')
        .fontSize(11)
        .font('Helvetica')
        .text(safeCompany.email, logoLoaded ? 145 : 40, y)
      y += 18
    }
    if (safeCompany.phone) {
      doc.fillColor('#4b5563')
        .fontSize(11)
        .font('Helvetica')
        .text(safeCompany.phone, logoLoaded ? 145 : 40, y)
      y += 18
    }
    if (safeCompany.gstin) {
      doc.fillColor('#111827')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`GSTIN: ${safeCompany.gstin}`, logoLoaded ? 145 : 40, y)
    }
    
    // Determine the document type label
    const documentType = invoiceType === 'PROPOSAL' ? 'PROPOSAL' : 
                        invoiceType === 'PROFORMA INVOICE' ? 'PROFORMA' : 'INVOICE'
    
    // INVOICE/PROPOSAL text on right side with improved styling
    doc.rect(450, headerY, 105, 45)
      .fill('#000000')
    
    doc.fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(documentType, 450, headerY + 18, { width: 105, align: 'center' })
    
    // Invoice/Proposal number below with better box styling
    doc.rect(450, headerY + 50, 105, 40)
      .lineWidth(1.5)
      .stroke('#d1d5db')
    
    doc.fillColor('#6b7280')
      .fontSize(10)
      .font('Helvetica')
      .text(invoiceType === 'PROPOSAL' ? 'Proposal No' : 'Invoice No', 455, headerY + 58)
    
    return headerY + 95
  }
  
  static addInvoiceDetails(doc, invoice, textColor, startY = 0) {
    const customer = invoice.customerSnapshot || {}
    
    const detailsY = startY + 10
    
    // Add invoice number to the header box with better styling
    doc.fillColor('#111827')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(invoice.invoiceNumber || 'N/A', 455, startY - 35, { width: 100, align: 'center' })
    
    // Add separator line for better visual separation
    doc.moveTo(40, detailsY)
      .lineTo(555, detailsY)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    // Invoice details section - two column layout
    let y = detailsY + 25
    
    // Left column - Invoice Details
    doc.fillColor('#374151')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('INVOICE DETAILS', 40, y)
    
    y += 25
    
    // Invoice No
    doc.fillColor('#6b7280')
      .fontSize(10)
      .font('Helvetica')
      .text('Invoice No:', 40, y)
    doc.fillColor('#111827')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(invoice.invoiceNumber || 'N/A', 120, y)
    y += 20
    
    // Invoice Date
    doc.fillColor('#6b7280')
      .fontSize(10)
      .font('Helvetica')
      .text('Date:', 40, y)
    doc.fillColor('#111827')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A', 120, y)
    y += 20
    
    // Proforma Ref (if exists)
    if (invoice.proformaInvoice) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text('Proforma Ref:', 40, y)
      doc.fillColor('#111827')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(invoice.proformaInvoice.invoiceNumber || 'N/A', 120, y)
      y += 20
    }
    
    // Status
    doc.fillColor('#6b7280')
      .fontSize(10)
      .font('Helvetica')
      .text('Status:', 40, y)
    doc.fillColor('#111827')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'N/A', 120, y)
    
    // Right column - Bill To
    y = detailsY + 25
    const billToX = 320
    
    doc.fillColor('#374151')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('BILL TO', billToX, y)
    
    y += 25
    
    // Company Name
    doc.fillColor('#111827')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(customer.companyName || 'N/A', billToX, y)
    y += 20
    
    // Contact Person
    if (customer.contactPerson) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(customer.contactPerson, billToX, y)
      y += 18
    }
    
    // Email
    if (customer.email) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(customer.email, billToX, y)
      y += 18
    }
    
    // Phone
    if (customer.phone) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(customer.phone, billToX, y)
      y += 18
    }
    
    // Address
    if (customer.billingAddress) {
      const addr = customer.billingAddress
      const address = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(address, billToX, y, { width: 235 })
    } else if (customer.address) {
      const addr = customer.address
      const address = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(address, billToX, y, { width: 235 })
    }
    
    // GSTIN
    if (customer.gstin) {
      y += 18
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(`GSTIN: ${customer.gstin}`, billToX, y)
    }
    
    // Add separator line
    y += 25
    doc.moveTo(40, y)
      .lineTo(555, y)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    return y + 20
  }
  
  
  static addNewTable(doc, invoice, lightGrey, mediumGrey, textColor, startY = 0) {
    const tableTop = startY + 20
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
      doc.text(header, x, tableTop + 12)
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
      
      // Description - handle both proforma, invoice, and proposal item structures
      let desc = item.productSnapshot?.name || item.description || item.name || item.customName || 'N/A'
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
    
    return y + 10
  }
  
  static addNewSummary(doc, invoice, darkGrey, white, textColor, startY = 0) {
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
    let y = startY + 20
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
  
  static addAmountInWords(doc, invoice, textColor, startY = 0) {
    const amountWordsY = startY + 20
    
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
  
  static addPaymentTerms(doc, invoice, textColor, startY = 0) {
    const paymentTermsY = startY + 10
    
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
  
  static addNotes(doc, invoice, textColor, startY = 0) {
    const notesY = startY + 10
    
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
  
  static addBankDetails(doc, company, textColor, startY = 0) {
    const bankY = startY + 10
    
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
  
  static addTermsAndConditions(doc, invoice, textColor, startY = 0) {
    const termsY = startY + 10
    
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
  
  static addSignature(doc, invoice, company, textColor, startY = 0) {
    const signatureY = startY + 20
    
    // Handle missing company settings
    const safeCompany = company || {}
    
    // Signature section on the right - improved alignment and dynamic handling
    let currentY = signatureY
    
    // Add separator line before signature section
    doc.moveTo(40, currentY)
      .lineTo(555, currentY)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    currentY += 25
    
    // Add signature image if available with better error handling
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
          // Better positioning for signature image with proper fit
          doc.image(signaturePath, 340, currentY, { 
            width: 200, 
            height: 80,
            fit: [200, 80],
            align: 'center',
            valign: 'center'
          })
          currentY += 85
        } else {
          console.log('Signature file not found at path:', signaturePath)
          // Fallback to signature line with better styling
          doc.moveTo(340, currentY + 30)
            .lineTo(540, currentY + 30)
            .lineWidth(2)
            .stroke('#111827')
          currentY += 40
        }
      } catch (error) {
        console.log('Could not load signature:', error)
        // Fallback to signature line with better styling
        doc.moveTo(340, currentY + 30)
          .lineTo(540, currentY + 30)
          .lineWidth(2)
          .stroke('#111827')
        currentY += 40
      }
    } else {
      // Signature line - thicker and darker with better positioning
      doc.moveTo(340, currentY + 30)
        .lineTo(540, currentY + 30)
        .lineWidth(2)
        .stroke('#111827')
      currentY += 40
    }
    
    // Signature name and designation - improved styling and dynamic handling
    if (safeCompany.authorizedSignatory?.name) {
      doc.fillColor('#111827')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(safeCompany.authorizedSignatory.name, 340, currentY)
      currentY += 20
      
      if (safeCompany.authorizedSignatory?.designation) {
        doc.fillColor('#6b7280')
          .fontSize(11)
          .font('Helvetica')
          .text(safeCompany.authorizedSignatory.designation, 340, currentY)
        currentY += 20
      }
    } else {
      doc.fillColor('#111827')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Authorized Signatory', 340, currentY)
      currentY += 20
    }
    
    // Company name below signature - improved positioning and formatting
    doc.fillColor('#6b7280')
      .fontSize(11)
      .font('Helvetica')
      .text('For ' + (safeCompany.companyName || 'Datawyn Technologies'), 340, currentY)
    
    currentY += 25
    
    // Add date placeholder
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    doc.fillColor('#9ca3af')
      .fontSize(10)
      .font('Helvetica')
      .text(`Date: ${today}`, 340, currentY)
    
    // Return the final Y position but cap it to avoid footer overlap
    return Math.min(currentY + 30, 730)
  }
  
  static addContactFooter(doc, company, darkGrey, white, startY = 750) {
    // Footer background - position based on content or default
    const footerY = Math.max(startY + 10, 750)
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

  static async generateProposal(proposal, companySettings) {
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
        
        let currentY = 0
        
        // Add new header
        currentY = this.addNewHeader(doc, companySettings, darkGrey, white, 'PROPOSAL', currentY)
        
        // Proposal details section
        currentY = this.addProposalDetails(doc, proposal, textColor, currentY - 35)
        
        // Project Overview
        currentY = this.addProjectOverview(doc, proposal, textColor, currentY)
        
        // Scope of Work
        if (proposal.scopeOfWork && proposal.scopeOfWork.length > 0) {
          currentY = this.addScopeOfWork(doc, proposal, textColor, currentY)
        }
        
        // Deliverables
        if (proposal.deliverables && proposal.deliverables.length > 0) {
          currentY = this.addDeliverables(doc, proposal, textColor, currentY)
        }
        
        // Technology Stack
        if (proposal.technologyStack && proposal.technologyStack.length > 0) {
          currentY = this.addTechnologyStack(doc, proposal, textColor, currentY)
        }
        
        // Timeline
        if (proposal.timeline) {
          currentY = this.addTimeline(doc, proposal, textColor, currentY)
        }
        
        // New table design
        currentY = this.addNewTable(doc, proposal, lightGrey, mediumGrey, textColor, currentY)
        
        // Summary section with dark grey TOTAL box
        currentY = this.addNewSummary(doc, proposal, darkGrey, white, textColor, currentY)
        
        // Amount in words section
        currentY = this.addAmountInWords(doc, proposal, textColor, currentY)
        
        // Payment Terms
        currentY = this.addPaymentTerms(doc, proposal, textColor, currentY)
        
        // Notes
        currentY = this.addNotes(doc, proposal, textColor, currentY)
        
        // Terms & Conditions
        currentY = this.addTermsAndConditions(doc, proposal, textColor, currentY)
        
        // Bank Details
        currentY = this.addBankDetails(doc, companySettings, textColor, currentY)
        
        // Signature section
        currentY = this.addSignature(doc, proposal, companySettings, textColor, currentY)
        
        // Contact footer - positioned after signature with minimum spacing
        this.addContactFooter(doc, companySettings, darkGrey, white, currentY)
        
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  static addProposalDetails(doc, proposal, textColor, startY = 0) {
    const customer = proposal.customerSnapshot || {}
    
    const detailsY = startY + 10
    
    // Add proposal number to the header box with better styling
    doc.fillColor('#111827')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(proposal.proposalNumber || 'N/A', 455, startY - 35, { width: 100, align: 'center' })
    
    // Add separator line for better visual separation
    doc.moveTo(40, detailsY)
      .lineTo(555, detailsY)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    // Proposal details section - two column layout
    let y = detailsY + 25
    
    // Left column - Proposal Details
    doc.fillColor('#374151')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('PROPOSAL DETAILS', 40, y)
    
    y += 25
    
    // Proposal No
    doc.fillColor('#6b7280')
      .fontSize(10)
      .font('Helvetica')
      .text('Proposal No:', 40, y)
    doc.fillColor('#111827')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(proposal.proposalNumber || 'N/A', 120, y)
    y += 20
    
    // Proposal Date
    doc.fillColor('#6b7280')
      .fontSize(10)
      .font('Helvetica')
      .text('Date:', 40, y)
    doc.fillColor('#111827')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(proposal.proposalDate ? new Date(proposal.proposalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A', 120, y)
    y += 20
    
    // Valid Until
    if (proposal.validUntil) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text('Valid Until:', 40, y)
      doc.fillColor('#111827')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(new Date(proposal.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 120, y)
      y += 20
    }
    
    // Status
    doc.fillColor('#6b7280')
      .fontSize(10)
      .font('Helvetica')
      .text('Status:', 40, y)
    doc.fillColor('#111827')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(proposal.status ? proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1) : 'N/A', 120, y)
    
    // Right column - Bill To
    y = detailsY + 25
    const billToX = 320
    
    doc.fillColor('#374151')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('BILL TO', billToX, y)
    
    y += 25
    
    // Company Name
    doc.fillColor('#111827')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(customer.companyName || 'N/A', billToX, y)
    y += 20
    
    // Contact Person
    if (customer.contactPerson) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(customer.contactPerson, billToX, y)
      y += 18
    }
    
    // Email
    if (customer.email) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(customer.email, billToX, y)
      y += 18
    }
    
    // Phone
    if (customer.phone) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(customer.phone, billToX, y)
      y += 18
    }
    
    // Address
    if (customer.billingAddress) {
      const addr = customer.billingAddress
      const address = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(address, billToX, y, { width: 235 })
    } else if (customer.address) {
      const addr = customer.address
      const address = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(address, billToX, y, { width: 235 })
    }
    
    // GSTIN
    if (customer.gstin) {
      y += 18
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(`GSTIN: ${customer.gstin}`, billToX, y)
    }
    
    // Add separator line
    y += 25
    doc.moveTo(40, y)
      .lineTo(555, y)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    return y + 20
  }

  static addProjectOverview(doc, proposal, textColor, startY = 0) {
    const overviewY = startY + 20

    // Add section header with better styling
    doc.fillColor('#374151')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PROJECT OVERVIEW', 40, overviewY)

    let y = overviewY + 25

    // Project Title - improved styling with better colors
    doc.fillColor('#111827')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(proposal.projectTitle || 'Project Proposal', 40, y)

    y += 35

    // Project Subtitle
    if (proposal.projectSubtitle) {
      doc.fillColor('#6b7280')
        .fontSize(13)
        .font('Helvetica')
        .text(proposal.projectSubtitle, 40, y)
      y += 28
    }

    // Project Description with better formatting
    if (proposal.projectDescription) {
      doc.fillColor('#374151')
        .fontSize(11)
        .font('Helvetica-Bold')
      .text('Project Description:', 40, y)
      y += 18
      
      doc.fillColor('#4b5563')
        .fontSize(10)
        .font('Helvetica')
        .text(proposal.projectDescription, 40, y, {
          width: 515,
          align: 'justify'
        })
      y += 35
    }

    // Objectives with better formatting
    if (proposal.objectives) {
      doc.fillColor('#374151')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Project Objectives:', 40, y)
      y += 18
      
      doc.fillColor('#4b5563')
        .fontSize(10)
        .font('Helvetica')
        .text(proposal.objectives, 40, y, {
          width: 515,
          align: 'justify'
        })
      y += 35
    }

    // Proposed Solution with better formatting
    if (proposal.proposedSolution) {
      doc.fillColor('#374151')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Proposed Solution:', 40, y)
      y += 18

      doc.fillColor('#4b5563')
        .fontSize(10)
        .font('Helvetica')
        .text(proposal.proposedSolution, 40, y, {
          width: 515,
          align: 'justify'
        })
      y += 35
    }

    // Add separator line with better styling
    doc.moveTo(40, y)
      .lineTo(555, y)
      .lineWidth(1)
      .stroke('#e5e7eb')

    return y + 25
  }

  static addScopeOfWork(doc, proposal, textColor, startY = 0) {
    const scopeY = startY + 20
    
    // Add section header with better styling
    doc.fillColor('#374151')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('SCOPE OF WORK', 40, scopeY)
    
    let y = scopeY + 25
    
    proposal.scopeOfWork.forEach((scope, index) => {
      // Add separator before each item (except first)
      if (index > 0) {
        doc.moveTo(40, y)
          .lineTo(555, y)
          .lineWidth(0.5)
          .stroke('#e5e7eb')
        y += 15
      }
      
      // Item title with better styling
      doc.fillColor('#111827')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`${index + 1}. ${scope.title}`, 40, y)
      y += 20
      
      if (scope.description) {
        doc.fillColor('#4b5563')
          .fontSize(10)
          .font('Helvetica')
          .text(scope.description, 50, y, {
            width: 505,
            align: 'justify'
          })
        y += 20
      }
      
      if (scope.bulletPoints && scope.bulletPoints.length > 0) {
        scope.bulletPoints.forEach(point => {
          doc.fillColor('#4b5563')
            .fontSize(9)
            .font('Helvetica')
            .text(`• ${point}`, 50, y, {
              width: 505,
              align: 'justify'
            })
          y += 18
        })
      }
      
      y += 15
    })
    
    // Add separator line at the end
    doc.moveTo(40, y)
      .lineTo(555, y)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    return y + 20
  }

  static addDeliverables(doc, proposal, textColor, startY = 0) {
    const deliverablesY = startY + 20
    
    // Add section header with better styling
    doc.fillColor('#374151')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('DELIVERABLES', 40, deliverablesY)
    
    let y = deliverablesY + 25
    
    proposal.deliverables.forEach((deliverable, index) => {
      // Add separator before each item (except first)
      if (index > 0) {
        doc.moveTo(40, y)
          .lineTo(555, y)
          .lineWidth(0.5)
          .stroke('#e5e7eb')
        y += 15
      }
      
      // Item title with better styling
      doc.fillColor('#111827')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`${index + 1}. ${deliverable.name}`, 40, y)
      y += 20
      
      if (deliverable.description) {
        doc.fillColor('#4b5563')
          .fontSize(10)
          .font('Helvetica')
          .text(deliverable.description, 50, y, {
            width: 505,
            align: 'justify'
          })
        y += 20
      }
      
      if (deliverable.quantity) {
        doc.fillColor('#6b7280')
          .fontSize(9)
          .font('Helvetica')
          .text(`Quantity: ${deliverable.quantity}`, 50, y)
        y += 18
      }
      
      if (deliverable.notes) {
        doc.fillColor('#6b7280')
          .fontSize(9)
          .font('Helvetica')
          .text(`Notes: ${deliverable.notes}`, 50, y)
        y += 18
      }
      
      y += 15
    })
    
    // Add separator line at the end
    doc.moveTo(40, y)
      .lineTo(555, y)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    return y + 20
  }

  static addTechnologyStack(doc, proposal, textColor, startY = 0) {
    const techY = startY + 20
    
    // Add section header with better styling
    doc.fillColor('#374151')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TECHNOLOGY STACK', 40, techY)
    
    let y = techY + 25
    
    // Create a grid of technologies with better styling
    const techPerRow = 4
    const techWidth = 125
    const techHeight = 35
    
    proposal.technologyStack.forEach((tech, index) => {
      const col = index % techPerRow
      const row = Math.floor(index / techPerRow)
      
      const x = 40 + (col * (techWidth + 10))
      const yPos = y + (row * (techHeight + 10))
      
      // Better styled technology box
      doc.rect(x, yPos, techWidth, techHeight)
        .fill('#f9fafb')
        .lineWidth(1)
        .stroke('#d1d5db')
      
      // Better text positioning and styling
      doc.fillColor('#111827')
        .fontSize(10)
        .font('Helvetica')
        .text(tech, x + 10, yPos + 12, { width: techWidth - 20, align: 'center' })
    })
    
    const rows = Math.ceil(proposal.technologyStack.length / techPerRow)
    const finalY = y + (rows * (techHeight + 10)) + 15
    
    // Add separator line
    doc.moveTo(40, finalY)
      .lineTo(555, finalY)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    return finalY + 20
  }

  static addTimeline(doc, proposal, textColor, startY = 0) {
    const timelineY = startY + 20
    
    // Add section header with better styling
    doc.fillColor('#374151')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PROJECT TIMELINE', 40, timelineY)
    
    let y = timelineY + 25
    
    // Timeline summary with better formatting
    if (proposal.timeline.startDate) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text('Start Date:', 40, y)
      doc.fillColor('#111827')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(new Date(proposal.timeline.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 100, y)
      y += 18
    }
    
    if (proposal.timeline.estimatedCompletionDate) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text('Estimated Completion:', 40, y)
      doc.fillColor('#111827')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(new Date(proposal.timeline.estimatedCompletionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 100, y)
      y += 18
    }
    
    if (proposal.timeline.duration) {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text('Duration:', 40, y)
      doc.fillColor('#111827')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(proposal.timeline.duration, 100, y)
      y += 25
    }
    
    // Milestones with better formatting
    if (proposal.timeline.milestones && proposal.timeline.milestones.length > 0) {
      doc.fillColor('#374151')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Milestones:', 40, y)
      y += 20
      
      proposal.timeline.milestones.forEach((milestone, index) => {
        // Add separator before each milestone (except first)
        if (index > 0) {
          doc.moveTo(40, y)
            .lineTo(555, y)
            .lineWidth(0.5)
            .stroke('#e5e7eb')
          y += 15
        }
        
        doc.fillColor('#111827')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${milestone.title}`, 50, y)
        y += 18
        
        if (milestone.description) {
          doc.fillColor('#4b5563')
            .fontSize(9)
            .font('Helvetica')
            .text(milestone.description, 50, y, {
              width: 505,
              align: 'justify'
            })
          y += 18
        }
        
        if (milestone.expectedDate) {
          doc.fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica')
            .text(`Expected: ${new Date(milestone.expectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 50, y)
          y += 18
        }
        
        if (milestone.duration) {
          doc.fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica')
            .text(`Duration: ${milestone.duration}`, 50, y)
          y += 18
        }
        
        y += 15
      })
    }
    
    // Add separator line at the end
    doc.moveTo(40, y)
      .lineTo(555, y)
      .lineWidth(1)
      .stroke('#e5e7eb')
    
    return y + 20
  }
}
