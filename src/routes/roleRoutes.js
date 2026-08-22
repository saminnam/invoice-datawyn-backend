import express from 'express'
import {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/roleController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(requirePermission('roles.view'), getAllRoles)
  .post(requirePermission('roles.create'), createRole)

router.route('/:id')
  .get(requirePermission('roles.view'), getRole)
  .put(requirePermission('roles.edit'), updateRole)
  .delete(requirePermission('roles.delete'), deleteRole)

export default router