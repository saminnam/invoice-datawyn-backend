import express from 'express'
import {
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission
} from '../controllers/permissionController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(getAllPermissions)
  .post(createPermission)

router.route('/:id')
  .put(updatePermission)
  .delete(deletePermission)

export default router