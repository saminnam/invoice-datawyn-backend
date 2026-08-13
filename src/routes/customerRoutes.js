import express from 'express'
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerInvoices
} from '../controllers/customerController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(getCustomers)
  .post(createCustomer)

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer)

router.get('/:id/invoices', getCustomerInvoices)

export default router
