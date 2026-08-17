import express from 'express'
import {
  getCompanySettings,
  updateCompanySettings,
  getPublicCompanySettings,
  updateSignature
} from '../controllers/companyController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { uploadLogo, uploadSignature } from '../middleware/upload.js'

const router = express.Router()

// Public route - no authentication required
router.get('/public', getPublicCompanySettings)

// Protected routes - authentication required
router.use(authMiddleware)

router.route('/')
  .get(getCompanySettings)
  .put(uploadLogo, updateCompanySettings)

router.put('/signature', uploadSignature, updateSignature)

export default router
