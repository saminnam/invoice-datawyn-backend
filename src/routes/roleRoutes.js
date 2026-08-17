import express from 'express'
import {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/roleController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(getAllRoles)
  .post(createRole)

router.route('/:id')
  .get(getRole)
  .put(updateRole)
  .delete(deleteRole)

export default router