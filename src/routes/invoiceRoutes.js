import express from 'express'
import {
  getInvoices,
  getInvoice,
  downloadInvoicePDF,
  deleteInvoice
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

export default router
