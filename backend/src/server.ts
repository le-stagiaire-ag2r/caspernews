import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CasperEventStreaming, DepositEvent, WithdrawalEvent, RebalanceEvent } from './services/eventStreaming.js';
import { DatabaseService } from './services/database.js';
import { createApiRouter } from './routes/api.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const CONTRACT_HASH = process.env.CONTRACT_HASH || 'hash-placeholder';
const STREAMING_URL = process.env.CSPR_CLOUD_STREAMING_URL || 'wss://streaming.testnet.cspr.cloud';
const DATABASE_PATH = process.env.DATABASE_PATH || './data/optimizer.db';

console.log('🚀 Starting Casper DeFi Yield Optimizer Backend...');
console.log('📍 Configuration:');
console.log(`   - Port: ${PORT}`);
console.log(`   - Contract Hash: ${CONTRACT_HASH}`);
console.log(`   - Streaming URL: ${STREAMING_URL}`);
console.log(`   - Database: ${DATABASE_PATH}`);

// Initialize services
const db = new DatabaseService(DATABASE_PATH);
const eventStream = new CasperEventStreaming(STREAMING_URL, CONTRACT_HASH);

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', createApiRouter(db));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Casper DeFi Yield Optimizer API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      stats: '/api/stats',
      history: '/api/history/:address',
      position: '/api/position/:address',
      recentTransactions: '/api/transactions/recent',
    },
  });
});

// Event handlers
const handleDeposit = async (event: DepositEvent) => {
  console.log('📥 Processing deposit event:', event);

  try {
    // Save transaction
    db.saveTransaction({
      deploy_hash: event.deploy_hash,
      user_address: event.user,
      type: 'deposit',
      amount: event.amount,
      shares: event.shares,
      timestamp: event.timestamp,
      status: 'success',
    });

    // Update user position
    const currentPosition = db.getUserPosition(event.user);
    const currentShares = currentPosition?.total_shares || '0';
    const currentDeposited = currentPosition?.total_deposited || '0';

    const newShares = (BigInt(currentShares) + BigInt(event.shares)).toString();
    const newDeposited = (BigInt(currentDeposited) + BigInt(event.amount)).toString();

    db.updateUserPosition(event.user, newShares, newDeposited);

    // Recalculate and update stats
    const stats = db.calculateStats();
    db.updatePoolStats(stats);

    console.log('✅ Deposit processed successfully');
  } catch (error) {
    console.error('❌ Error processing deposit:', error);
  }
};

const handleWithdrawal = async (event: WithdrawalEvent) => {
  console.log('📤 Processing withdrawal event:', event);

  try {
    // Save transaction
    db.saveTransaction({
      deploy_hash: event.deploy_hash,
      user_address: event.user,
      type: 'withdraw',
      amount: event.amount,
      shares: event.shares,
      timestamp: event.timestamp,
      status: 'success',
    });

    // Update user position
    const currentPosition = db.getUserPosition(event.user);
    if (currentPosition) {
      const currentShares = BigInt(currentPosition.total_shares);
      const withdrawnShares = BigInt(event.shares);
      const newShares = (currentShares - withdrawnShares).toString();

      // Keep deposited amount same, only shares decrease
      db.updateUserPosition(event.user, newShares, currentPosition.total_deposited);
    }

    // Recalculate and update stats
    const stats = db.calculateStats();
    db.updatePoolStats(stats);

    console.log('✅ Withdrawal processed successfully');
  } catch (error) {
    console.error('❌ Error processing withdrawal:', error);
  }
};

const handleRebalance = async (event: RebalanceEvent) => {
  console.log('🔄 Processing rebalance event:', event);

  try {
    // Save transaction
    db.saveTransaction({
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
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
      console.log('📡 Listening for blockchain events...\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await eventStream.stop();
  db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await eventStream.stop();
  db.close();
  process.exit(0);
});

// Start the application
start();
