import express from 'express'
import {
  getProformaInvoices,
  getProformaInvoice,
  createProformaInvoice,
  updateProformaInvoice,
  deleteProformaInvoice,
  duplicateProformaInvoice,
  updateInvoiceStatus,
  downloadPDF,
  convertToInvoice
} from '../controllers/proformaController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(requirePermission('proforma.view'), getProformaInvoices)
  .post(requirePermission('proforma.create'), createProformaInvoice)

router.route('/:id')
  .get(requirePermission('proforma.view'), getProformaInvoice)
  .put(requirePermission('proforma.edit'), updateProformaInvoice)
  .delete(requirePermission('proforma.delete'), deleteProformaInvoice)

router.post('/:id/duplicate', requirePermission('proforma.create'), duplicateProformaInvoice)
router.patch('/:id/status', requirePermission('proforma.edit'), updateInvoiceStatus)
router.get('/:id/pdf', requirePermission('proforma.view'), downloadPDF)
router.post('/:id/convert', requirePermission('proforma.convert'), convertToInvoice)

export default router
