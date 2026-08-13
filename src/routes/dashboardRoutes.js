import express from 'express'
import {
  getStats,
  getCharts
} from '../controllers/dashboardController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/stats', getStats)
router.get('/charts', getCharts)

export default router
