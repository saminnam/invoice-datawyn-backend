import express from 'express'
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(requirePermission('products.view'), getProducts)
  .post(requirePermission('products.create'), createProduct)

router.route('/:id')
  .get(requirePermission('products.view'), getProduct)
  .put(requirePermission('products.edit'), updateProduct)
  .delete(requirePermission('products.delete'), deleteProduct)

export default router
