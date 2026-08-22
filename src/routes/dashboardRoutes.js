import express from 'express'
import {
  getStats,
  getCharts
} from '../controllers/dashboardController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/stats', requirePermission('dashboard.view'), getStats)
router.get('/charts', requirePermission('dashboard.view'), getCharts)

export default router
