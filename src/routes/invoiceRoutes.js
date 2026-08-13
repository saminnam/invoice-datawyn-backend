import express from 'express'
import {
  getInvoices,
  getInvoice,
  downloadInvoicePDF
} from '../controllers/invoiceController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(getInvoices)

router.route('/:id')
  .get(getInvoice)

router.get('/:id/pdf', downloadInvoicePDF)

export default router
