import express from 'express'
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  toggleUserStatus,
  createBulkUsers
} from '../controllers/userController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(requirePermission('users.view'), getAllUsers)
  .post(requirePermission('users.create'), createUser)

router.post('/bulk', requirePermission('users.create'), createBulkUsers)

router.route('/:id')
  .get(requirePermission('users.view'), getUser)
  .put(requirePermission('users.edit'), updateUser)
  .delete(requirePermission('users.delete'), deleteUser)

router.post('/:id/reset-password', requirePermission('users.edit'), resetPassword)
router.patch('/:id/toggle-status', requirePermission('users.edit'), toggleUserStatus)

export default router