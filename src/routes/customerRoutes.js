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
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(requirePermission('customers.view'), getCustomers)
  .post(requirePermission('customers.create'), createCustomer)

router.route('/:id')
  .get(requirePermission('customers.view'), getCustomer)
  .put(requirePermission('customers.edit'), updateCustomer)
  .delete(requirePermission('customers.delete'), deleteCustomer)

router.get('/:id/invoices', requirePermission('customers.view'), getCustomerInvoices)

export default router
