import express from 'express'
import {
  getCompanySettings,
  updateCompanySettings,
  getPublicCompanySettings,
  updateSignature
} from '../controllers/companyController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'
import { uploadLogo, uploadSignature, uploadCompanyFiles } from '../middleware/upload.js'

const router = express.Router()

// Public route - no authentication required
router.get('/public', getPublicCompanySettings)

// Protected routes - authentication required
router.use(authMiddleware)

router.route('/')
  .get(requirePermission('settings.view'), getCompanySettings)
  .put(requirePermission('settings.edit'), uploadCompanyFiles, updateCompanySettings)

router.put('/signature', requirePermission('settings.edit'), uploadSignature, updateSignature)

export default router
