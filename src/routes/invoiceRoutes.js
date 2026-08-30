import express from 'express'
import {
  getInvoices,
  getInvoice,
  downloadInvoicePDF,
  deleteInvoice,
  sendEmail
} from '../controllers/invoiceController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(requirePermission('invoices.view'), getInvoices)

router.route('/:id')
  .get(requirePermission('invoices.view'), getInvoice)
  .delete(requirePermission('invoices.delete'), deleteInvoice)

router.get('/:id/pdf', requirePermission('invoices.view'), downloadInvoicePDF)
router.post('/:id/send-email', requirePermission('invoices.edit'), sendEmail)

export default router
