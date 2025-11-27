import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database.js';

export function createApiRouter(db: DatabaseService): Router {
  const router = Router();

  /**
   * GET /api/health
   * Health check endpoint
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Casper DeFi Yield Optimizer Backend',
    });
  });

  /**
   * GET /api/stats
   * Get overall pool statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = db.getPoolStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  /**
   * GET /api/history/:address
   * Get transaction history for a user
   */
  router.get('/history/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const transactions = db.getUserTransactions(address, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
  });

  /**
   * GET /api/position/:address
   * Get user position details
   */
  router.get('/position/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const position = db.getUserPosition(address);

      if (!position) {
        res.json({
          user_address: address,
          total_shares: '0',
          total_deposited: '0',
          last_update: new Date().toISOString(),
        });
        return;
      }

      res.json(position);
    } catch (error) {
      console.error('Error fetching position:', error);
      res.status(500).json({ error: 'Failed to fetch user position' });
    }
  });

  /**
   * GET /api/transactions/recent
   * Get recent transactions across all users
   */
  router.get('/transactions/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = db.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  /**
   * POST /api/stats/refresh
   * Manually trigger statistics recalculation
   */
  router.post('/stats/refresh', async (req: Request, res: Response) => {
    try {
      const stats = db.calculateStats();
      db.updatePoolStats(stats);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error refreshing stats:', error);
      res.status(500).json({ error: 'Failed to refresh statistics' });
    }
  });

  return router;
}
