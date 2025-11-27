# Casper DeFi Yield Optimizer - Backend

Backend service for the Casper DeFi Yield Optimizer. Built with Node.js, Express, and TypeScript.

## Features

- 🎧 **Real-time Event Streaming**: Listens to blockchain events via CSPR.cloud WebSocket
- 💾 **SQLite Database**: Stores transactions, user positions, and pool statistics
- 🌐 **REST API**: Provides data to the frontend application
- 📊 **Statistics Calculation**: Automatically calculates TVL, APY, and user metrics
- 🔄 **Auto-reconnection**: Handles WebSocket disconnections gracefully

## Prerequisites

- Node.js v18 or higher
- npm or yarn

## Installation

```bash
cd backend
npm install
```

## Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Casper Network
CONTRACT_HASH=hash-xxxxxxxxxxxxx
CSPR_CLOUD_STREAMING_URL=wss://streaming.testnet.cspr.cloud

# Database
DATABASE_PATH=./data/optimizer.db

# CORS (optional)
CORS_ORIGIN=http://localhost:5173
```

## Running the Server

### Development Mode

```bash
npm run dev
```

The server will start with hot-reload enabled using `tsx watch`.

### Production Mode

```bash
# Build TypeScript
npm run build

# Start the server
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

Returns server status and timestamp.

### Get Pool Statistics
```
GET /api/stats
```

Returns overall pool statistics:
- Total Value Locked (TVL)
- Average APY
- Total users
- Total deposits/withdrawals

### Get User Transaction History
```
GET /api/history/:address?limit=50
```

Returns transaction history for a specific user address.

### Get User Position
```
GET /api/position/:address
```

Returns current position for a user (shares, deposited amount).

### Get Recent Transactions
```
GET /api/transactions/recent?limit=50
```

Returns recent transactions across all users.

### Refresh Statistics
```
POST /api/stats/refresh
```

Manually triggers statistics recalculation.

## Event Processing

The backend listens to the following blockchain events:

- **Deposit**: User deposits funds into the optimizer
- **Withdrawal**: User withdraws funds from the optimizer
- **Rebalance**: Admin rebalances funds between pools
- **RewardsHarvested**: Rewards are harvested from pools

Events are automatically processed and stored in the database.

## Database Schema

### transactions
- `id`: Auto-increment primary key
- `deploy_hash`: Unique transaction hash
- `user_address`: Casper account address
- `type`: Transaction type (deposit/withdraw/rebalance)
- `amount`: Transaction amount in motes
- `shares`: Number of shares (for deposits/withdrawals)
- `timestamp`: Transaction timestamp
- `status`: success/failed/pending

### user_positions
- `user_address`: User's Casper account (primary key)
- `total_shares`: Total shares owned
- `total_deposited`: Total amount deposited
- `last_update`: Last update timestamp

### pool_stats
- `id`: Auto-increment primary key
- `tvl`: Total Value Locked
- `total_users`: Number of unique users
- `avg_apy`: Average APY across pools
- `total_deposits`: Sum of all deposits
- `total_withdrawals`: Sum of all withdrawals
- `last_update`: Last calculation timestamp

## Architecture

```
┌─────────────────────────────────────┐
│     CSPR.cloud WebSocket Stream     │
└──────────────┬──────────────────────┘
               │ Events
               ▼
┌─────────────────────────────────────┐
│      Event Streaming Service        │
│  - Parse blockchain events          │
│  - Extract transaction data         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Database Service              │
│  - Store transactions               │
│  - Update user positions            │
│  - Calculate statistics             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          REST API                   │
│  - Serve data to frontend           │
│  - Provide statistics               │
└─────────────────────────────────────┘
```

## Troubleshooting

### WebSocket Connection Issues

If the WebSocket fails to connect to CSPR.cloud:
- Check your internet connection
- Verify the CSPR_CLOUD_STREAMING_URL is correct
- The service will automatically retry connection every 5 seconds

### Database Locked

If you get "database is locked" errors:
- Make sure only one instance of the server is running
- Check file permissions for the database directory

### Missing Events

If events aren't being captured:
- Verify the CONTRACT_HASH is correct
- Check that your smart contract is deployed on testnet
- Ensure the contract emits Odra events correctly

## Development

### Project Structure

```
backend/
├── src/
│   ├── server.ts              # Main server entry point
│   ├── routes/
│   │   └── api.ts            # API route definitions
│   └── services/
│       ├── eventStreaming.ts # CSPR.cloud WebSocket client
│       └── database.ts       # SQLite database service
├── data/                     # SQLite database files (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Endpoints

1. Add route handler in `src/routes/api.ts`
2. Implement business logic in service layer if needed
3. Update this README with endpoint documentation

### Testing

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test stats endpoint
curl http://localhost:3001/api/stats

# Test user history
curl http://localhost:3001/api/history/account-hash-xxxxx
```

## License

MIT
