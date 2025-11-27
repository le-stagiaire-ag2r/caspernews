# Part 5: Building the Backend with CSPR.cloud Streaming

In this final part, you'll create a Node.js backend that listens to blockchain events in real-time using CSPR.cloud, processes data, and exposes a REST API for your frontend.

## 📖 What You'll Learn

- Setting up a Node.js/Express backend with TypeScript
- Integrating CSPR.cloud for real-time event streaming
- Processing blockchain events (deposits, withdrawals, rebalances)
- Building REST APIs for frontend consumption
- Storing and querying transaction data
- Implementing WebSocket for live updates

## 🚀 Project Setup

### Initialize Backend

```bash
cd backend
npm init -y
```

### Install Dependencies

```bash
# Core dependencies
npm install express cors dotenv

# CSPR.cloud SDK
npm install @casperdash/streaming-client

# TypeScript
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon

# Database (optional - using in-memory for demo)
npm install sqlite3
npm install -D @types/better-sqlite3
```

### TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Package.json Scripts

Update `package.json`:

```json
{
  "name": "yield-optimizer-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

## 🔧 Environment Configuration

Create `.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Casper Network
CASPER_NETWORK=casper-test
CONTRACT_HASH=hash-xxxxxxxxxxxxx

# CSPR.cloud
CSPR_CLOUD_STREAMING_URL=wss://streaming.testnet.cspr.cloud

# Database
DATABASE_PATH=./data/optimizer.db
```

## 📡 CSPR.cloud Event Streaming

Create `src/services/eventStreaming.ts`:

```typescript
import { EventStream } from '@casperdash/streaming-client';

export interface DeployProcessedEvent {
  deploy_hash: string;
  account: string;
  timestamp: string;
  block_hash: string;
  execution_result: {
    Success?: {
      effect: {
        transforms: any[];
      };
      transfers: string[];
      cost: string;
    };
    Failure?: {
      error_message: string;
    };
  };
}

export class CasperEventStreaming {
  private stream: EventStream;
  private contractHash: string;

  constructor(streamingUrl: string, contractHash: string) {
    this.stream = new EventStream(streamingUrl);
    this.contractHash = contractHash;
  }

  /**
   * Start listening to contract events
   */
  async start(
    onDeposit: (event: any) => void,
    onWithdrawal: (event: any) => void,
    onRebalance: (event: any) => void
  ): Promise<void> {
    console.log('🎧 Starting event stream listener...');

    // Subscribe to deploys for our contract
    await this.stream.subscribe(
      {
        event_type: 'DeployProcessed',
        contract_hash: this.contractHash,
      },
      (event: DeployProcessedEvent) => {
        this.processEvent(event, onDeposit, onWithdrawal, onRebalance);
      }
    );

    console.log('✅ Event stream listener started');
  }

  /**
   * Process incoming blockchain events
   */
  private processEvent(
    event: DeployProcessedEvent,
    onDeposit: (event: any) => void,
    onWithdrawal: (event: any) => void,
    onRebalance: (event: any) => void
  ): void {
    try {
      const { deploy_hash, account, timestamp, execution_result } = event;

      // Check if execution was successful
      if (!execution_result.Success) {
        console.log(`❌ Deploy ${deploy_hash} failed:`,
          execution_result.Failure?.error_message);
        return;
      }

      // Parse the event type from contract events
      const transforms = execution_result.Success.effect.transforms;

      for (const transform of transforms) {
        // Look for contract events in transforms
        if (transform.key.includes('event-')) {
          const eventData = this.parseContractEvent(transform);

          if (eventData) {
            switch (eventData.type) {
              case 'Deposit':
                console.log('💰 Deposit event detected');
                onDeposit({
                  ...eventData,
                  deploy_hash,
                  timestamp,
                });
                break;

              case 'Withdrawal':
                console.log('💸 Withdrawal event detected');
                onWithdrawal({
                  ...eventData,
                  deploy_hash,
                  timestamp,
                });
                break;

              case 'Rebalance':
                console.log('🔄 Rebalance event detected');
                onRebalance({
                  ...eventData,
                  deploy_hash,
                  timestamp,
                });
                break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  /**
   * Parse contract event from transform
   */
  private parseContractEvent(transform: any): any | null {
    try {
      // Extract event data based on Odra event format
      // This is simplified - actual parsing depends on event structure
      const eventType = transform.event_type;
      const data = transform.data;

      return {
        type: eventType,
        ...data,
      };
    } catch (error) {
      console.error('Error parsing event:', error);
      return null;
    }
  }

  /**
   * Stop the event stream
   */
  async stop(): Promise<void> {
    await this.stream.unsubscribe();
    console.log('🛑 Event stream stopped');
  }
}
```

## 💾 Data Storage Service

Create `src/services/database.ts`:

```typescript
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export interface Transaction {
  id: number;
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

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
    this.initTables();
  }

  /**
   * Initialize database tables
   */
  private initTables(): void {
    this.db.serialize(() => {
      // Transactions table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          deploy_hash TEXT UNIQUE NOT NULL,
          user_address TEXT NOT NULL,
          type TEXT NOT NULL,
          amount TEXT NOT NULL,
          shares TEXT,
          timestamp TEXT NOT NULL,
          block_hash TEXT,
          status TEXT NOT NULL
        )
      `);

      // User positions table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS user_positions (
          user_address TEXT PRIMARY KEY,
          total_shares TEXT NOT NULL,
          total_deposited TEXT NOT NULL,
          last_update TEXT NOT NULL
        )
      `);

      // Pool statistics table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS pool_stats (
          id INTEGER PRIMARY KEY,
          tvl TEXT NOT NULL,
          total_users INTEGER NOT NULL,
          avg_apy REAL NOT NULL,
          last_update TEXT NOT NULL
        )
      `);

      console.log('✅ Database tables initialized');
    });
  }

  /**
   * Save a transaction
   */
  async saveTransaction(tx: Omit<Transaction, 'id'>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO transactions
         (deploy_hash, user_address, type, amount, shares, timestamp, block_hash, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tx.deploy_hash,
          tx.user_address,
          tx.type,
          tx.amount,
          tx.shares || null,
          tx.timestamp,
          tx.block_hash || null,
          tx.status,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Get user transaction history
   */
  async getUserTransactions(userAddress: string): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM transactions
         WHERE user_address = ?
         ORDER BY timestamp DESC`,
        [userAddress],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Transaction[]);
        }
      );
    });
  }

  /**
   * Get all recent transactions
   */
  async getRecentTransactions(limit: number = 50): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM transactions
         ORDER BY timestamp DESC
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Transaction[]);
        }
      );
    });
  }

  /**
   * Update user position
   */
  async updateUserPosition(
    userAddress: string,
    shares: string,
    deposited: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO user_positions
         (user_address, total_shares, total_deposited, last_update)
         VALUES (?, ?, ?, ?)`,
        [userAddress, shares, deposited, new Date().toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Get pool statistics
   */
  async getPoolStats(): Promise<PoolStats> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM pool_stats ORDER BY id DESC LIMIT 1`,
        (err, row: any) => {
          if (err) {
            reject(err);
          } else if (!row) {
            // Return default stats if none exist
            resolve({
              tvl: '0',
              avgApy: 0,
              totalUsers: 0,
              totalDeposits: '0',
              totalWithdrawals: '0',
            });
          } else {
            resolve({
              tvl: row.tvl,
              avgApy: row.avg_apy,
              totalUsers: row.total_users,
              totalDeposits: row.total_deposits || '0',
              totalWithdrawals: row.total_withdrawals || '0',
            });
          }
        }
      );
    });
  }

  /**
   * Update pool statistics
   */
  async updatePoolStats(stats: PoolStats): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO pool_stats
         (tvl, total_users, avg_apy, last_update)
         VALUES (?, ?, ?, ?)`,
        [stats.tvl, stats.totalUsers, stats.avgApy, new Date().toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
```

## 🛣️ REST API Routes

Create `src/routes/api.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { Database } from '../services/database';

export function createApiRouter(db: Database): Router {
  const router = Router();

  /**
   * GET /api/stats
   * Get overall pool statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await db.getPoolStats();
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
      const transactions = await db.getUserTransactions(address);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
  });

  /**
   * GET /api/transactions/recent
   * Get recent transactions across all users
   */
  router.get('/transactions/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await db.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  /**
   * GET /api/health
   * Health check endpoint
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}
```

## 🖥️ Main Server

Create `src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CasperEventStreaming } from './services/eventStreaming';
import { Database } from './services/database';
import { createApiRouter } from './routes/api';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const CONTRACT_HASH = process.env.CONTRACT_HASH!;
const STREAMING_URL = process.env.CSPR_CLOUD_STREAMING_URL!;
const DATABASE_PATH = process.env.DATABASE_PATH || './data/optimizer.db';

// Initialize services
const db = new Database(DATABASE_PATH);
const eventStream = new CasperEventStreaming(STREAMING_URL, CONTRACT_HASH);

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', createApiRouter(db));

// Event handlers
const handleDeposit = async (event: any) => {
  console.log('Processing deposit:', event);

  try {
    await db.saveTransaction({
      deploy_hash: event.deploy_hash,
      user_address: event.user,
      type: 'deposit',
      amount: event.amount,
      shares: event.shares,
      timestamp: event.timestamp,
      status: 'success',
    });

    // Update user position
    await db.updateUserPosition(event.user, event.shares, event.amount);

    console.log('✅ Deposit processed successfully');
  } catch (error) {
    console.error('❌ Error processing deposit:', error);
  }
};

const handleWithdrawal = async (event: any) => {
  console.log('Processing withdrawal:', event);

  try {
    await db.saveTransaction({
      deploy_hash: event.deploy_hash,
      user_address: event.user,
      type: 'withdraw',
      amount: event.amount,
      shares: event.shares,
      timestamp: event.timestamp,
      status: 'success',
    });

    console.log('✅ Withdrawal processed successfully');
  } catch (error) {
    console.error('❌ Error processing withdrawal:', error);
  }
};

const handleRebalance = async (event: any) => {
  console.log('Processing rebalance:', event);

  try {
    await db.saveTransaction({
      deploy_hash: event.deploy_hash,
      user_address: 'system',
      type: 'rebalance',
      amount: event.amount,
      timestamp: event.timestamp,
      status: 'success',
    });

    console.log('✅ Rebalance processed successfully');
  } catch (error) {
    console.error('❌ Error processing rebalance:', error);
  }
};

// Start server
async function start() {
  try {
    // Start event streaming
    await eventStream.start(handleDeposit, handleWithdrawal, handleRebalance);

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await eventStream.stop();
  db.close();
  process.exit(0);
});

// Start the application
start();
```

## 🚀 Running the Backend

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3001/api/health

# Get statistics
curl http://localhost:3001/api/stats

# Get user history
curl http://localhost:3001/api/history/account-hash-xxxxx

# Get recent transactions
curl http://localhost:3001/api/transactions/recent?limit=10
```

### Using REST Client

Install a REST client like Insomnia or Postman and test the endpoints.

## 📊 Monitoring and Logging

Create `src/utils/logger.ts`:

```typescript
export class Logger {
  static info(message: string, data?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  }

  static error(message: string, error?: any) {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error || ''
    );
  }

  static warn(message: string, data?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
  }
}
```

## ✅ Checklist

- [ ] Backend project initialized with TypeScript
- [ ] CSPR.cloud streaming integrated
- [ ] Event processing for deposits/withdrawals
- [ ] Database setup with SQLite
- [ ] REST API endpoints implemented
- [ ] Transaction history tracking
- [ ] Statistics calculation
- [ ] Error handling and logging
- [ ] Environment variables configured
- [ ] Server running and processing events

## 🎓 What You've Learned

- Building a Node.js backend with TypeScript
- Real-time blockchain event processing with CSPR.cloud
- Database design for DeFi applications
- REST API development with Express
- Handling blockchain data and transactions
- Production-ready error handling and logging

## 🎉 Project Complete!

Congratulations! You've built a complete DeFi Yield Optimizer on Casper Network with:

- ✅ Modern React frontend with wallet integration
- ✅ Smart contracts written in Odra
- ✅ Real-time backend with CSPR.cloud
- ✅ Full transaction flow from UI to blockchain
- ✅ Production-ready architecture

## 🚀 Next Steps

### For the Hackathon

1. **Deploy to testnet** and verify all components work together
2. **Create a demo video** showing your application in action
3. **Document your code** thoroughly
4. **Prepare your submission** with clear instructions

### For Production

1. Implement proper database (PostgreSQL/MongoDB)
2. Add authentication and rate limiting
3. Implement caching layer (Redis)
4. Add comprehensive monitoring (Prometheus/Grafana)
5. Set up CI/CD pipeline
6. Implement advanced yield strategies
7. Add security audits
8. Deploy to mainnet

## 📚 Additional Resources

- [CSPR.cloud Documentation](https://docs.cspr.cloud/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Production Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 💡 Pro Tips

- Use PM2 for process management in production
- Implement proper logging with Winston or Pino
- Add WebSocket support for real-time frontend updates
- Consider implementing a queue system (Bull/BullMQ) for heavy processing
- Monitor API performance and optimize slow endpoints
- Implement rate limiting to prevent abuse

---

**Previous**: [← Part 4: Smart Contracts](../04-smart-contracts/README.md)

**🎉 Tutorial Complete! You've successfully built a full-stack DeFi dApp on Casper Network!**
