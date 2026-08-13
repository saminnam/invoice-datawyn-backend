import express from 'express'
import {
  getCompanySettings,
  updateCompanySettings
} from '../controllers/companyController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import upload from '../middleware/upload.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(getCompanySettings)
  .put(upload.single('logo'), updateCompanySettings)

export default router
