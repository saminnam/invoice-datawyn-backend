import express from 'express'
import {
  getProposals,
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  duplicateProposal,
  updateProposalStatus,
  downloadPDF
} from '../controllers/proposalController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.route('/')
  .get(requirePermission('proposals.view'), getProposals)
  .post(requirePermission('proposals.create'), createProposal)

router.route('/:id')
  .get(requirePermission('proposals.view'), getProposal)
  .put(requirePermission('proposals.edit'), updateProposal)
  .delete(requirePermission('proposals.delete'), deleteProposal)

router.post('/:id/duplicate', requirePermission('proposals.create'), duplicateProposal)
router.patch('/:id/status', requirePermission('proposals.edit'), updateProposalStatus)
router.get('/:id/pdf', requirePermission('proposals.view'), downloadPDF)

export default router
