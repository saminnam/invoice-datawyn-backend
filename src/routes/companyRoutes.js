import express from 'express'
import {
  getCompanySettings,
  updateCompanySettings,
  getPublicCompanySettings
} from '../controllers/companyController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// Public route - no authentication required
router.get('/public', getPublicCompanySettings)

// Protected routes - authentication required
router.use(authMiddleware)

router.route('/')
  .get(getCompanySettings)
  .put(upload.single('logo'), updateCompanySettings)

export default router
