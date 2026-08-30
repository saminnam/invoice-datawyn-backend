import nodemailer from 'nodemailer'
import { PDFService } from './pdfService.js'
import CompanySettings from '../models/CompanySettings.js'
import ProformaInvoice from '../models/ProformaInvoice.js'
import Invoice from '../models/Invoice.js'

// Create transporter (will be configured based on environment)
let transporter = null

const initializeTransporter = () => {
  if (transporter) return transporter

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials are missing from environment variables')
  }

  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  }

  transporter = nodemailer.createTransport(config)
  return transporter
}

export const EmailService = {
  async sendProformaInvoice(invoiceId, emailData) {
    try {
      const invoice = await ProformaInvoice.findById(invoiceId)
        .populate('customer', 'companyName')
      
      if (!invoice) {
        throw new Error('Invoice not found')
      }

      const companySettings = await CompanySettings.findOne()
      
      // Generate PDF
      const pdfBuffer = await PDFService.generateProformaInvoice(invoice, companySettings)

      const transporter = initializeTransporter()
      
      // Verify connection before sending
      try {
        await transporter.verify()
      } catch (verifyError) {
        console.error('Email transporter verification failed:', verifyError)
        throw new Error('Email service connection failed: ' + verifyError.message)
      }
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || companySettings?.email || 'noreply@datawyn.com',
        to: emailData.email,
        subject: `Proforma Invoice ${invoice.invoiceNumber} from ${companySettings?.companyName || 'Datawyn Technologies'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Proforma Invoice</h2>
            <p>Dear ${invoice.customerSnapshot?.contactPerson || 'Customer'},</p>
            <p>Please find attached the proforma invoice <strong>${invoice.invoiceNumber}</strong> for your reference.</p>
            <p><strong>Invoice Details:</strong></p>
            <ul>
              <li>Invoice Number: ${invoice.invoiceNumber}</li>
              <li>Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}</li>
              <li>Total Amount: ₹${invoice.grandTotal.toFixed(2)}</li>
            </ul>
            <p>${emailData.message || 'Please review the attached invoice and let us know if you have any questions.'}</p>
            <p>Best regards,<br>${companySettings?.companyName || 'Datawyn Technologies'}</p>
          </div>
        `,
        attachments: [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      }

      await transporter.sendMail(mailOptions)
      
      // Update invoice status to sent
      invoice.status = 'sent'
      invoice.statusHistory.push({
        status: 'sent',
        changedAt: new Date()
      })
      await invoice.save()

      return { success: true, message: 'Invoice sent successfully' }
    } catch (error) {
      console.error('Email sending error:', error)
      throw new Error('Failed to send email: ' + error.message)
    }
  },

  async sendInvoice(invoiceId, emailData) {
    try {
      console.log('Starting email send for invoice:', invoiceId)
      
      const invoice = await Invoice.findById(invoiceId)
        .populate('customer', 'companyName')
        .populate('proformaInvoice', 'invoiceNumber')
      
      if (!invoice) {
        throw new Error('Invoice not found')
      }

      console.log('Invoice found:', invoice.invoiceNumber)
      const companySettings = await CompanySettings.findOne()
      console.log('Company settings found:', !!companySettings)
      
      // Generate PDF
      console.log('Generating PDF...')
      const pdfBuffer = await PDFService.generateInvoice(invoice, companySettings)
      console.log('PDF generated successfully, size:', pdfBuffer.length)

      const transporter = initializeTransporter()
      
      // Verify connection before sending
      try {
        await transporter.verify()
        console.log('Email transporter verified successfully')
      } catch (verifyError) {
        console.error('Email transporter verification failed:', verifyError)
        throw new Error('Email service connection failed: ' + verifyError.message)
      }
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || companySettings?.email || 'noreply@datawyn.com',
        to: emailData.email,
        subject: `Invoice ${invoice.invoiceNumber} from ${companySettings?.companyName || 'Datawyn Technologies'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Tax Invoice</h2>
            <p>Dear ${invoice.customerSnapshot?.contactPerson || 'Customer'},</p>
            <p>Please find attached the invoice <strong>${invoice.invoiceNumber}</strong> for your reference.</p>
            <p><strong>Invoice Details:</strong></p>
            <ul>
              <li>Invoice Number: ${invoice.invoiceNumber}</li>
              <li>Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}</li>
              ${invoice.proformaInvoice ? `<li>Proforma Reference: ${invoice.proformaInvoice.invoiceNumber}</li>` : ''}
              <li>Total Amount: ₹${(invoice.grandTotal || 0).toFixed(2)}</li>
            </ul>
            <p>${emailData.message || 'Please review the attached invoice and let us know if you have any questions.'}</p>
            <p>Best regards,<br>${companySettings?.companyName || 'Datawyn Technologies'}</p>
          </div>
        `,
        attachments: [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      }

      console.log('Sending email to:', emailData.email)
      await transporter.sendMail(mailOptions)
      console.log('Email sent successfully')
      
      // Update invoice status to sent
      invoice.status = 'sent'
      // Add to status history if the field exists
      if (invoice.statusHistory) {
        invoice.statusHistory.push({
          status: 'sent',
          changedAt: new Date()
        })
      }
      await invoice.save()

      return { success: true, message: 'Invoice sent successfully' }
    } catch (error) {
      console.error('Email sending error:', error)
      throw new Error('Failed to send email: ' + error.message)
    }
  },

  testConnection() {
    try {
      const transporter = initializeTransporter()
      return transporter.verify()
    } catch (error) {
      throw new Error('Email connection test failed: ' + error.message)
    }
  }
}
