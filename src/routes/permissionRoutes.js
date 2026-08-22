import express from 'express'
import {
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission
} from '../controllers/permissionController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(requirePermission('roles.view'), getAllPermissions)
  .post(requirePermission('roles.create'), createPermission)

router.route('/:id')
  .put(requirePermission('roles.edit'), updatePermission)
  .delete(requirePermission('roles.delete'), deletePermission)

export default router