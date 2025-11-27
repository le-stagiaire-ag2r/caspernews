# Casper DeFi Yield Optimizer

> A comprehensive DeFi platform offering automated yield farming strategies on Casper Network, maximizing returns from various liquidity pools through smart contract algorithms.

[![Casper Network](https://img.shields.io/badge/Casper-Network-red)](https://casper.network/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Overview

The **DeFi Yield Optimizer** is a full-stack decentralized application (dApp) built on Casper Network that automatically optimizes yield farming strategies to maximize user returns. The platform leverages smart contract algorithms to manage liquidity across multiple pools, auto-compound rewards, and rebalance positions based on APY performance.

This project serves as both a functional DeFi platform and a comprehensive tutorial for building production-ready dApps on Casper Network using modern tools from the CSPR ecosystem.

## 🏗️ Architecture

The application consists of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│              CSPR.click Wallet Integration                  │
│     Dashboard • Deposit/Withdraw • APY Tracking             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ REST API
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Backend (Node.js)                              │
│         CSPR.cloud Event Streaming                          │
│      Real-time Position & Yield Analytics                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Blockchain Events
                  │
┌─────────────────▼───────────────────────────────────────────┐
│         Smart Contracts (Odra Framework)                    │
│  Yield Optimizer • Strategy Manager • Pool Allocator        │
│              Casper Network Testnet v2.1.0                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

- **Automated Yield Optimization**: Smart contracts automatically select and rebalance positions across multiple liquidity pools
- **Multi-Wallet Support**: Connect using CSPR.click with support for multiple wallet providers
- **Real-time Analytics**: Live tracking of APY, total value locked (TVL), and user positions
- **Auto-compounding**: Automatic harvesting and reinvestment of farming rewards
- **Gas Optimization**: Efficient transaction batching and gas estimation
- **Event-driven Architecture**: Real-time updates via CSPR.cloud streaming

## 📚 Tutorial Structure

This project follows a comprehensive 5-part tutorial structure, teaching you how to build production-ready dApps on Casper:

### [Part 1: Introduction to Building Casper dApps](./tutorial/01-introduction)
- Overview of the Casper ecosystem and development tools
- Project architecture and component interaction
- Setting up your development environment
- Understanding the DeFi Yield Optimizer design

### [Part 2: Building the Frontend with CSPR.click and React](./tutorial/02-frontend)
- Creating a modern React application
- Integrating CSPR.click for wallet connectivity
- Building the user interface (deposit/withdraw, dashboard, analytics)
- Managing user authentication and state

### [Part 3: Constructing and Signing Casper Transactions](./tutorial/03-transactions)
- Understanding the Casper transaction model
- Constructing deposit and withdrawal deploys
- Estimating gas costs and optimizing transactions
- Signing and submitting transactions with connected wallets

### [Part 4: Writing Smart Contracts with Odra](./tutorial/04-smart-contracts)
- Building yield optimizer contracts with Odra framework
- Implementing strategy algorithms and pool management
- Storage patterns, events, and error handling
- Testing, deployment, and verification on Casper Network

### [Part 5: Building the Backend with CSPR.cloud Streaming](./tutorial/05-backend)
- Creating a Node.js backend service
- Real-time blockchain event processing with CSPR.cloud
- Building REST APIs for frontend data
- Position tracking and yield analytics

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Rust and Cargo (latest stable)
- Casper wallet (Casper Wallet, Ledger, or compatible)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/le-stagiaire-ag2r/caspernews.git
cd caspernews
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Install backend dependencies**
```bash
cd ../backend
npm install
```

4. **Build smart contracts**
```bash
cd ../contracts
cargo build --release
```

### Running the Application

1. **Start the backend**
```bash
cd backend
npm start
```

2. **Start the frontend**
```bash
cd frontend
npm run dev
```

3. **Access the application**
Open your browser and navigate to `http://localhost:3000`

## 📁 Project Structure

```
caspernews/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API and blockchain services
│   │   └── utils/         # Utility functions
│   └── package.json
├── contracts/             # Odra smart contracts
│   ├── src/
│   │   ├── yield_optimizer.rs
│   │   ├── strategy_manager.rs
│   │   └── pool_allocator.rs
│   └── Cargo.toml
├── backend/               # Node.js backend service
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── streaming/     # CSPR.cloud integration
│   └── package.json
└── tutorial/              # Step-by-step tutorial documentation
    ├── 01-introduction/
    ├── 02-frontend/
    ├── 03-transactions/
    ├── 04-smart-contracts/
    └── 05-backend/
```

## 🔧 Technology Stack

### Frontend
- **React** - Modern UI framework
- **TypeScript** - Type-safe development
- **CSPR.click** - Wallet integration SDK
- **TailwindCSS** - Styling framework
- **Vite** - Build tool and dev server

### Smart Contracts
- **Odra** - Rust framework for Casper contracts
- **Casper Types** - Native Casper blockchain types
- **Cargo** - Rust package manager

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **CSPR.cloud** - Blockchain event streaming
- **TypeScript** - Type-safe development

### Blockchain
- **Casper Network Testnet v2.1.0** - 8-second block time
- **Fee burn mechanism** - Transaction fee optimization

## 🌐 Network Information

- **Network**: Casper Testnet
- **Node Version**: v2.1.0
- **Block Time**: 8 seconds
- **Fee Structure**: Burn mechanism active

## 🎓 Learning Objectives

By completing this tutorial, you will learn:

1. **Casper Blockchain Development**
   - Transaction construction and signing
   - Smart contract deployment and interaction
   - Event handling and monitoring

2. **DeFi Protocol Design**
   - Yield optimization strategies
   - Liquidity pool management
   - Risk assessment and rebalancing

3. **Full-Stack dApp Development**
   - React frontend with wallet integration
   - Real-time blockchain data streaming
   - Backend API design and implementation

4. **Production Best Practices**
   - Error handling and validation
   - Gas optimization techniques
   - Security considerations
   - Testing strategies

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Casper Network Documentation](https://docs.casper.network/)
- [Odra Framework](https://odra.dev/)
- [CSPR.click Documentation](https://cspr.click/)
- [CSPR.cloud](https://cspr.cloud/)
- [Casper Node v2.1.0 Release](https://github.com/casper-network/casper-node/releases/tag/v2.1.0)

## 🏆 Hackathon Project

This project was created for the Casper Hackathon with the following requirements:
- ✅ On-chain component (Odra smart contracts)
- ✅ Full-stack dApp architecture
- ✅ Integration with Casper ecosystem tools
- ✅ Production-ready code quality

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ on Casper Network**
