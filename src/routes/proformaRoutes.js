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

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(getProformaInvoices)
  .post(createProformaInvoice)

router.route('/:id')
  .get(getProformaInvoice)
  .put(updateProformaInvoice)
  .delete(deleteProformaInvoice)

router.post('/:id/duplicate', duplicateProformaInvoice)
router.patch('/:id/status', updateInvoiceStatus)
router.get('/:id/pdf', downloadPDF)
router.post('/:id/convert', convertToInvoice)

export default router
