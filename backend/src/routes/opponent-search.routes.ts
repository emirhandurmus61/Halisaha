import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createOpponentListing,
  searchOpponentListings,
  getMyTeamListings,
  updateOpponentListing,
  deleteOpponentListing,
  createMatchProposal,
  respondToMatchProposal,
  getReceivedProposals,
  getSentProposals,
} from '../controllers/opponent-search.controller';

const router = Router();

// Rakip arama ilanları
router.post('/listings', authenticateToken, createOpponentListing);
router.get('/listings/search', authenticateToken, searchOpponentListings);
router.get('/listings/my-team', authenticateToken, getMyTeamListings);
router.put('/listings/:listingId', authenticateToken, updateOpponentListing);
router.delete('/listings/:listingId', authenticateToken, deleteOpponentListing);

// Maç teklifleri
router.post('/proposals', authenticateToken, createMatchProposal);
router.post('/proposals/:proposalId/respond', authenticateToken, respondToMatchProposal);
router.get('/proposals/received', authenticateToken, getReceivedProposals);
router.get('/proposals/sent', authenticateToken, getSentProposals);

export default router;
