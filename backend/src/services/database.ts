import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

export interface Transaction {
  id?: number;
  deploy_hash: string;
  user_address: string;
  type: 'deposit' | 'withdraw' | 'rebalance';
  amount: string;
  shares?: string;
  timestamp: string;
  block_hash?: string;
  status: 'pending' | 'success' | 'failed';
}

export interface PoolStats {
  tvl: string;
  avgApy: number;
  totalUsers: number;
  totalDeposits: string;
  totalWithdrawals: string;
}

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = dirname(dbPath);
    mkdirSync(dir, { recursive: true });

    this.db = new Database(dbPath);
    this.initTables();
    console.log('✅ Database initialized at:', dbPath);
  }

  /**
   * Initialize database tables
   */
  private initTables(): void {
    // Transactions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deploy_hash TEXT UNIQUE NOT NULL,
        user_address TEXT NOT NULL,
        type TEXT NOT NULL,
        amount TEXT NOT NULL,
        shares TEXT,
        timestamp TEXT NOT NULL,
        block_hash TEXT,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User positions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_positions (
        user_address TEXT PRIMARY KEY,
        total_shares TEXT NOT NULL,
        total_deposited TEXT NOT NULL,
        last_update TEXT NOT NULL
      )
    `);

    // Pool statistics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pool_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tvl TEXT NOT NULL,
        total_users INTEGER NOT NULL,
        avg_apy REAL NOT NULL,
        total_deposits TEXT NOT NULL DEFAULT '0',
        total_withdrawals TEXT NOT NULL DEFAULT '0',
        last_update TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_address);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
    `);

    console.log('✅ Database tables initialized');
  }

  /**
   * Save a transaction
   */
  saveTransaction(tx: Transaction): void {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (deploy_hash, user_address, type, amount, shares, timestamp, block_hash, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        tx.deploy_hash,
        tx.user_address,
        tx.type,
        tx.amount,
        tx.shares || null,
        tx.timestamp,
        tx.block_hash || null,
        tx.status
      );
      console.log(`✅ Transaction saved: ${tx.deploy_hash}`);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.log(`⚠️  Transaction already exists: ${tx.deploy_hash}`);
      } else {
        console.error('Error saving transaction:', error);
        throw error;
      }
    }
  }

  /**
   * Get user transaction history
   */
  getUserTransactions(userAddress: string, limit: number = 50): Transaction[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions
      WHERE user_address = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    return stmt.all(userAddress, limit) as Transaction[];
  }

  /**
   * Get all recent transactions
   */
  getRecentTransactions(limit: number = 50): Transaction[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    return stmt.all(limit) as Transaction[];
  }

  /**
   * Update user position
   */
  updateUserPosition(userAddress: string, shares: string, deposited: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO user_positions (user_address, total_shares, total_deposited, last_update)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_address) DO UPDATE SET
        total_shares = excluded.total_shares,
        total_deposited = excluded.total_deposited,
        last_update = excluded.last_update
    `);

    stmt.run(userAddress, shares, deposited, new Date().toISOString());
  }

  /**
   * Get user position
   */
  getUserPosition(userAddress: string): any {
    const stmt = this.db.prepare(`
      SELECT * FROM user_positions
      WHERE user_address = ?
    `);

    return stmt.get(userAddress);
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): PoolStats {
    const stmt = this.db.prepare(`
      SELECT * FROM pool_stats
      ORDER BY id DESC
      LIMIT 1
    `);

    const row: any = stmt.get();

    if (!row) {
      // Return default stats if none exist
      return {
        tvl: '0',
        avgApy: 0,
        totalUsers: 0,
        totalDeposits: '0',
        totalWithdrawals: '0',
      };
    }

    return {
      tvl: row.tvl,
      avgApy: row.avg_apy,
      totalUsers: row.total_users,
      totalDeposits: row.total_deposits || '0',
      totalWithdrawals: row.total_withdrawals || '0',
    };
  }

  /**
   * Update pool statistics
   */
  updatePoolStats(stats: PoolStats): void {
    const stmt = this.db.prepare(`
      INSERT INTO pool_stats (tvl, total_users, avg_apy, total_deposits, total_withdrawals, last_update)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      stats.tvl,
      stats.totalUsers,
      stats.avgApy,
      stats.totalDeposits,
      stats.totalWithdrawals,
      new Date().toISOString()
    );
  }

  /**
   * Calculate statistics from transactions
   */
  calculateStats(): PoolStats {
    // Count unique users
    const usersStmt = this.db.prepare(`
      SELECT COUNT(DISTINCT user_address) as count FROM transactions
    `);
    const usersResult: any = usersStmt.get();

    // Sum deposits
    const depositsStmt = this.db.prepare(`
      SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as total
      FROM transactions
      WHERE type = 'deposit' AND status = 'success'
    `);
    const depositsResult: any = depositsStmt.get();

    // Sum withdrawals
    const withdrawalsStmt = this.db.prepare(`
      SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as total
      FROM transactions
      WHERE type = 'withdraw' AND status = 'success'
    `);
    const withdrawalsResult: any = withdrawalsStmt.get();

    const totalDeposits = depositsResult.total.toString();
    const totalWithdrawals = withdrawalsResult.total.toString();
    const tvl = (depositsResult.total - withdrawalsResult.total).toString();

    return {
      tvl,
      avgApy: 12.5, // Placeholder - should be calculated from pool data
      totalUsers: usersResult.count,
      totalDeposits,
      totalWithdrawals,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    console.log('🔒 Database connection closed');
  }
}
