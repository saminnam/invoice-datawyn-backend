import express from 'express'
import {
  getInvoices,
  getInvoice,
  downloadInvoicePDF,
  deleteInvoice,
  sendEmail,
  sendEmailWithPDF
} from '../controllers/invoiceController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'
import upload from '../config/multer.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(requirePermission('invoices.view'), getInvoices)

router.route('/:id')
  .get(requirePermission('invoices.view'), getInvoice)
  .delete(requirePermission('invoices.delete'), deleteInvoice)

router.get('/:id/pdf', requirePermission('invoices.view'), downloadInvoicePDF)
router.post('/:id/send-email', requirePermission('invoices.edit'), sendEmail)
router.post('/:id/send-email-pdf', upload.single('pdf'), requirePermission('invoices.edit'), sendEmailWithPDF)

export default router
