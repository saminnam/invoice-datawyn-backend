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
        this.addNewHeader(doc, companySettings, darkGrey, white)
        
        // Invoice details section
        this.addInvoiceDetails(doc, invoice, textColor)
        
        // New table design
        this.addNewTable(doc, invoice, lightGrey, mediumGrey, textColor)
        
        // Summary section with dark grey TOTAL box
        this.addNewSummary(doc, invoice, darkGrey, white, textColor)
        
        // Total Due section
        this.addTotalDue(doc, invoice, darkGrey, white, textColor)
        
        // Terms & Conditions
        this.addTermsAndConditions(doc, invoice, textColor)
        
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
  
  static addNewHeader(doc, company, darkGrey, white) {
    // Header background - dark grey
    doc.rect(0, 0, 595.28, 80).fill(darkGrey)
    
    // Logo on left side
    if (company.logo) {
      try {
        let logoPath
        if (company.logo.startsWith('/uploads/')) {
          const filename = company.logo.replace('/uploads/', '')
          logoPath = path.join(process.cwd(), 'uploads', filename)
        } else if (company.logo.startsWith('uploads/')) {
          logoPath = path.join(process.cwd(), company.logo)
        } else if (company.logo.startsWith('http')) {
          console.log('URL-based logos not yet supported in PDF')
        } else {
          logoPath = path.join(process.cwd(), 'uploads', company.logo)
        }
        
        if (logoPath && fs.existsSync(logoPath)) {
          doc.image(logoPath, 40, 15, { width: 100, height: 50 })
        } else {
          console.log('Logo file not found at path:', logoPath)
        }
      } catch (error) {
        console.log('Could not load logo:', error)
      }
    }
    
    // INVOICE text on right side
    doc.fillColor(white)
      .fontSize(36)
      .font('Helvetica-Bold')
      .text('INVOICE', 450, 25, { align: 'right' })
  }
  
  static addInvoiceDetails(doc, invoice, textColor) {
    const customer = invoice.customerSnapshot || {}
    
    // Invoice details section
    let y = 100
    const details = [
      { label: 'Invoice No:', value: invoice.invoiceNumber },
      { label: 'Invoice Date:', value: new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
      { label: 'Payment Method:', value: invoice.paymentMethod || 'Bank Transfer' },
      { label: 'Account ID:', value: customer.companyName || 'N/A' },
      { label: 'Account Name:', value: customer.contactPerson || 'N/A' }
    ]
    
    details.forEach(detail => {
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(detail.label, 40, y)
      
      doc.fillColor(textColor)
        .font('Helvetica-Bold')
        .text(detail.value, 150, y)
      
      y += 20
    })
    
    // Add Bill To section
    y += 10
    doc.fillColor(textColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Bill To:', 40, y)
    
    y += 20
    doc.fillColor('#666666')
      .fontSize(10)
      .font('Helvetica')
      .text(customer.companyName || 'N/A', 40, y)
    
    y += 15
    if (customer.contactPerson) {
      doc.text(customer.contactPerson, 40, y)
      y += 15
    }
    if (customer.email) {
      doc.text(customer.email, 40, y)
      y += 15
    }
    if (customer.billingAddress) {
      const addr = customer.billingAddress
      const address = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
      doc.text(address, 40, y)
    }
  }
  
  
  static addNewTable(doc, invoice, lightGrey, mediumGrey, textColor) {
    const tableTop = 240
    const rowHeight = 35
    const colWidths = [50, 250, 80, 80, 80]
    const items = invoice.items || []
    
    // Table header background - medium grey
    doc.rect(40, tableTop, 515, 35)
      .fill(mediumGrey)
    
    // Table headers
    doc.fillColor(textColor)
      .fontSize(11)
      .font('Helvetica-Bold')
    
    const headers = ['#', 'DESCRIPTION', 'PRICE', 'QUANTITY', 'AMOUNT']
    let x = 50
    
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop + 12)
      x += colWidths[i]
    })
    
    // Table rows with alternating colors
    let y = tableTop + rowHeight
    let alternateColor = false
    
    items.forEach((item, index) => {
      // Alternate row colors - light and dark grey
      if (alternateColor) {
        doc.rect(40, y, 515, rowHeight)
          .fill('#d9d9d9')
      } else {
        doc.rect(40, y, 515, rowHeight)
          .fill(lightGrey)
      }
      alternateColor = !alternateColor
      
      // Item data
      doc.fillColor(textColor)
        .fontSize(10)
        .font('Helvetica')
      
      x = 50
      
      // Serial number
      doc.text((index + 1).toString(), x, y + 12)
      x += colWidths[0]
      
      // Description
      const desc = item.productSnapshot?.name || 'N/A'
      doc.text(desc.substring(0, 40), x, y + 12)
      x += colWidths[1]
      
      // Price
      doc.text(`$${item.rate.toFixed(2)}`, x, y + 12)
      x += colWidths[2]
      
      // Quantity
      doc.text(item.quantity.toString(), x, y + 12)
      x += colWidths[3]
      
      // Amount
      doc.fillColor(textColor)
        .font('Helvetica-Bold')
        .text(`$${item.total.toFixed(2)}`, x, y + 12)
      
      y += rowHeight
    })
    
    // Table border
    doc.rect(40, tableTop, 515, y - tableTop)
      .lineWidth(1)
      .stroke('#999999')
    
    return y
  }
  
  static addNewSummary(doc, invoice, darkGrey, white, textColor) {
    const itemsLength = invoice.items ? invoice.items.length : 0
    const summaryY = 240 + (itemsLength * 35) + 20
    
    // Summary section on the right
    let y = summaryY
    
    // Sub Total
    doc.fillColor('#666666')
      .fontSize(11)
      .font('Helvetica')
      .text('Sub Total', 350, y)
    
    doc.fillColor(textColor)
      .font('Helvetica-Bold')
      .text(`$${invoice.subtotal.toFixed(2)}`, 500, y, { align: 'right' })
    
    y += 25
    
    // Tax (5%)
    const totalTax = invoice.cgst + invoice.sgst + invoice.igst
    doc.fillColor('#666666')
      .font('Helvetica')
      .text('Tax (5%)', 350, y)
    
    doc.fillColor(textColor)
      .font('Helvetica-Bold')
      .text(`$${totalTax.toFixed(2)}`, 500, y, { align: 'right' })
    
    y += 35
    
    // TOTAL in dark grey box
    doc.rect(350, y, 205, 40)
      .fill(darkGrey)
    
    doc.fillColor(white)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('TOTAL', 370, y + 13)
    
    doc.text(`$${invoice.grandTotal.toFixed(2)}`, 500, y + 13, { align: 'right' })
    
    return y + 50
  }
  
  static addTotalDue(doc, invoice, darkGrey, white, textColor) {
    const itemsLength = invoice.items ? invoice.items.length : 0
    const totalDueY = 240 + (itemsLength * 35) + 130
    
    // Total Due section
    doc.fillColor(textColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Due', 40, totalDueY)
    
    doc.fillColor(darkGrey)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(`$${invoice.grandTotal.toFixed(2)} USD`, 40, totalDueY + 20)
    
    // Late charge notice
    doc.fillColor('#666666')
      .fontSize(10)
      .font('Helvetica')
      .text('Late charge for 10 days', 40, totalDueY + 50)
    
    return totalDueY + 70
  }
  
  static addTermsAndConditions(doc, invoice, textColor) {
    const itemsLength = invoice.items ? invoice.items.length : 0
    const termsY = 240 + (itemsLength * 35) + 210
    
    doc.fillColor(textColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Terms & Conditions', 40, termsY)
    
    doc.fillColor('#666666')
      .fontSize(9)
      .font('Helvetica')
    
    const termsText = invoice.termsAndConditions || 'Payment is due within 30 days. Late payments may incur additional charges. All goods remain the property of the seller until paid in full.'
    doc.text(termsText, 40, termsY + 20, {
      width: 515,
      align: 'justify'
    })
    
    return termsY + 60
  }
  
  static addSignature(doc, invoice, company, textColor) {
    const itemsLength = invoice.items ? invoice.items.length : 0
    const signatureY = 240 + (itemsLength * 35) + 260
    
    // Signature section on the right
    doc.fillColor('#666666')
      .fontSize(10)
      .font('Helvetica')
      .text('Authorized Signature', 350, signatureY)
    
    let currentY = signatureY + 15
    
    // Add signature image if available
    if (company.authorizedSignatory?.signatureImage) {
      try {
        let signaturePath
        if (company.authorizedSignatory.signatureImage.startsWith('/uploads/')) {
          const filename = company.authorizedSignatory.signatureImage.replace('/uploads/', '')
          signaturePath = path.join(process.cwd(), 'uploads', filename)
        } else if (company.authorizedSignatory.signatureImage.startsWith('uploads/')) {
          signaturePath = path.join(process.cwd(), company.authorizedSignatory.signatureImage)
        } else if (company.authorizedSignatory.signatureImage.startsWith('http')) {
          console.log('URL-based signatures not yet supported in PDF')
        } else {
          signaturePath = path.join(process.cwd(), 'uploads', company.authorizedSignatory.signatureImage)
        }
        
        if (signaturePath && fs.existsSync(signaturePath)) {
          doc.image(signaturePath, 350, currentY, { width: 200, height: 50 })
          currentY += 55
        } else {
          console.log('Signature file not found at path:', signaturePath)
          // Fallback to signature line
          doc.moveTo(350, currentY + 15)
            .lineTo(550, currentY + 15)
            .lineWidth(1)
            .stroke('#999999')
          currentY += 25
        }
      } catch (error) {
        console.log('Could not load signature:', error)
        // Fallback to signature line
        doc.moveTo(350, currentY + 15)
          .lineTo(550, currentY + 15)
          .lineWidth(1)
          .stroke('#999999')
        currentY += 25
      }
    } else {
      // Signature line
      doc.moveTo(350, currentY + 15)
        .lineTo(550, currentY + 15)
        .lineWidth(1)
        .stroke('#999999')
      currentY += 25
    }
    
    // Signature name and designation
    if (company.authorizedSignatory?.name) {
      doc.fillColor(textColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(company.authorizedSignatory.name, 350, currentY)
      currentY += 15
      
      if (company.authorizedSignatory?.designation) {
        doc.fillColor('#666666')
          .fontSize(10)
          .font('Helvetica')
          .text(company.authorizedSignatory.designation, 350, currentY)
        currentY += 15
      }
    } else {
      doc.fillColor(textColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Authorized Signatory', 350, currentY)
      currentY += 15
    }
    
    // Return the final Y position but cap it to avoid footer overlap
    return Math.min(currentY + 10, 730)
  }
  
  static addContactFooter(doc, company, darkGrey, white, signatureEndY = 750) {
    // Footer background - position based on content or default
    const footerY = Math.max(signatureEndY + 10, 750)
    doc.rect(0, footerY, 595.28, 47)
      .fill(darkGrey)
    
    // Contact information
    doc.fillColor(white)
      .fontSize(9)
      .font('Helvetica')
    
    // Phone
    if (company.phone) {
      doc.text(`📞 ${company.phone}`, 40, footerY + 20)
    }
    
    // Address
    const address = company.address || {}
    const addressText = [address.street, address.city, address.state, address.pincode].filter(Boolean).join(', ')
    if (addressText) {
      doc.text(`📍 ${addressText}`, 200, footerY + 20)
    }
    
    // Email
    if (company.email) {
      doc.text(`✉️ ${company.email}`, 400, footerY + 20)
    }
    
    // Website
    if (company.website) {
      doc.text(`🌐 ${company.website}`, 40, footerY + 35)
    }
  }
}
