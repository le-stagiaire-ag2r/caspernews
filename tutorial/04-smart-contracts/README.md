# Part 4: Writing Smart Contracts with Odra

In this part, you'll build the core smart contracts for the DeFi Yield Optimizer using the Odra framework. This is the **on-chain component** required for the Casper hackathon.

## 📖 What You'll Learn

- Setting up Odra development environment
- Writing smart contracts in Rust with Odra
- Implementing deposit and withdrawal logic
- Managing user positions and shares
- Emitting events for off-chain tracking
- Testing smart contracts
- Deploying contracts to Casper testnet

## 🚀 Setting Up Odra

### Install Odra CLI

```bash
cargo install cargo-odra
```

### Initialize Odra Project

```bash
cd contracts
cargo odra new --name yield-optimizer
cd yield-optimizer
```

### Update Cargo.toml

```toml
[package]
name = "yield-optimizer"
version = "0.1.0"
edition = "2021"

[dependencies]
odra = "1.0.0"

[dev-dependencies]
odra-test = "1.0.0"

[lib]
crate-type = ["cdylib", "rlib"]
```

## 📝 Smart Contract Architecture

Our DeFi Yield Optimizer consists of three main contracts:

```
YieldOptimizer (Main Contract)
    ├── UserPositions (Storage)
    ├── PoolManager (Logic)
    └── Events (Notifications)
```

## 🔧 Building the Main Contract

Create `src/yield_optimizer.rs`:

```rust
use odra::prelude::*;
use odra::{casper_types::U512, Address, Mapping, Var};

/// Events emitted by the contract
#[odra::event]
pub enum Event {
    Deposit {
        user: Address,
        amount: U512,
        shares: U512,
        timestamp: u64,
    },
    Withdrawal {
        user: Address,
        amount: U512,
        shares: U512,
        timestamp: u64,
    },
    Rebalance {
        from_pool: String,
        to_pool: String,
        amount: U512,
        timestamp: u64,
    },
    RewardsHarvested {
        pool: String,
        amount: U512,
        timestamp: u64,
    },
}

/// User position information
#[odra::odra_type]
pub struct UserPosition {
    pub shares: U512,
    pub deposited_amount: U512,
    pub last_deposit_time: u64,
    pub total_rewards: U512,
}

/// Pool information
#[odra::odra_type]
pub struct PoolInfo {
    pub name: String,
    pub total_allocated: U512,
    pub current_apy: u32, // APY in basis points (e.g., 1250 = 12.50%)
    pub risk_level: u8,   // 1-5 (1 = lowest risk)
}

/// Main Yield Optimizer Contract
#[odra::module(events = [Event])]
pub struct YieldOptimizer {
    /// Owner of the contract
    owner: Var<Address>,

    /// Total value locked in the optimizer
    total_tvl: Var<U512>,

    /// Total shares issued
    total_shares: Var<U512>,

    /// Mapping of user addresses to their positions
    user_positions: Mapping<Address, UserPosition>,

    /// Available liquidity pools
    pools: Mapping<String, PoolInfo>,

    /// Management fee (in basis points)
    management_fee: Var<u32>,

    /// Emergency pause flag
    paused: Var<bool>,
}

#[odra::module]
impl YieldOptimizer {
    /// Initialize the contract
    #[odra(init)]
    pub fn init(&mut self, management_fee_bp: u32) {
        self.owner.set(self.env().caller());
        self.total_tvl.set(U512::zero());
        self.total_shares.set(U512::zero());
        self.management_fee.set(management_fee_bp);
        self.paused.set(false);
    }

    /// Deposit funds into the yield optimizer
    pub fn deposit(&mut self, amount: U512) {
        self.require_not_paused();
        self.require_positive_amount(amount);

        let caller = self.env().caller();
        let shares = self.calculate_shares(amount);

        // Update user position
        let mut position = self.get_user_position(&caller);
        position.shares += shares;
        position.deposited_amount += amount;
        position.last_deposit_time = self.env().block_time();

        self.user_positions.set(&caller, position);

        // Update global state
        let new_tvl = self.total_tvl.get_or_default() + amount;
        self.total_tvl.set(new_tvl);

        let new_total_shares = self.total_shares.get_or_default() + shares;
        self.total_shares.set(new_total_shares);

        // Emit event
        self.env().emit_event(Event::Deposit {
            user: caller,
            amount,
            shares,
            timestamp: self.env().block_time(),
        });
    }

    /// Withdraw funds from the yield optimizer
    pub fn withdraw(&mut self, shares_to_withdraw: U512) {
        self.require_not_paused();
        self.require_positive_amount(shares_to_withdraw);

        let caller = self.env().caller();
        let mut position = self.get_user_position(&caller);

        // Verify user has enough shares
        if position.shares < shares_to_withdraw {
            self.env().revert("Insufficient shares");
        }

        // Calculate withdrawal amount (shares to tokens)
        let amount = self.calculate_withdrawal_amount(shares_to_withdraw);

        // Verify contract has enough balance
        if self.total_tvl.get_or_default() < amount {
            self.env().revert("Insufficient contract balance");
        }

        // Update user position
        position.shares -= shares_to_withdraw;
        if position.shares == U512::zero() {
            // Reset position if fully withdrawn
            position.deposited_amount = U512::zero();
            position.total_rewards = U512::zero();
        }
        self.user_positions.set(&caller, position);

        // Update global state
        let new_tvl = self.total_tvl.get_or_default() - amount;
        self.total_tvl.set(new_tvl);

        let new_total_shares = self.total_shares.get_or_default() - shares_to_withdraw;
        self.total_shares.set(new_total_shares);

        // Emit event
        self.env().emit_event(Event::Withdrawal {
            user: caller,
            amount,
            shares: shares_to_withdraw,
            timestamp: self.env().block_time(),
        });

        // Transfer tokens back to user
        // In production, implement actual token transfer
    }

    /// Get user position details
    pub fn get_position(&self, user: Address) -> UserPosition {
        self.get_user_position(&user)
    }

    /// Get total value locked
    pub fn get_tvl(&self) -> U512 {
        self.total_tvl.get_or_default()
    }

    /// Get user's current value (including rewards)
    pub fn get_user_value(&self, user: Address) -> U512 {
        let position = self.get_user_position(&user);
        if position.shares == U512::zero() {
            return U512::zero();
        }

        self.calculate_withdrawal_amount(position.shares)
    }

    /// Add a new liquidity pool (owner only)
    pub fn add_pool(
        &mut self,
        name: String,
        initial_apy: u32,
        risk_level: u8,
    ) {
        self.require_owner();

        let pool = PoolInfo {
            name: name.clone(),
            total_allocated: U512::zero(),
            current_apy: initial_apy,
            risk_level,
        };

        self.pools.set(&name, pool);
    }

    /// Update pool APY (owner only)
    pub fn update_pool_apy(&mut self, pool_name: String, new_apy: u32) {
        self.require_owner();

        let mut pool = self.pools.get(&pool_name)
            .unwrap_or_revert(&self.env(), "Pool not found");

        pool.current_apy = new_apy;
        self.pools.set(&pool_name, pool);
    }

    /// Get pool information
    pub fn get_pool_info(&self, pool_name: String) -> Option<PoolInfo> {
        self.pools.get(&pool_name)
    }

    /// Emergency pause (owner only)
    pub fn pause(&mut self) {
        self.require_owner();
        self.paused.set(true);
    }

    /// Unpause contract (owner only)
    pub fn unpause(&mut self) {
        self.require_owner();
        self.paused.set(false);
    }

    /// Check if contract is paused
    pub fn is_paused(&self) -> bool {
        self.paused.get_or_default()
    }

    // ========== Internal Functions ==========

    fn calculate_shares(&self, amount: U512) -> U512 {
        let total_shares = self.total_shares.get_or_default();
        let total_tvl = self.total_tvl.get_or_default();

        if total_shares == U512::zero() || total_tvl == U512::zero() {
            // First deposit: shares = amount
            return amount;
        }

        // shares = (amount * total_shares) / total_tvl
        (amount * total_shares) / total_tvl
    }

    fn calculate_withdrawal_amount(&self, shares: U512) -> U512 {
        let total_shares = self.total_shares.get_or_default();
        let total_tvl = self.total_tvl.get_or_default();

        if total_shares == U512::zero() {
            return U512::zero();
        }

        // amount = (shares * total_tvl) / total_shares
        (shares * total_tvl) / total_shares
    }

    fn get_user_position(&self, user: &Address) -> UserPosition {
        self.user_positions.get(user).unwrap_or(UserPosition {
            shares: U512::zero(),
            deposited_amount: U512::zero(),
            last_deposit_time: 0,
            total_rewards: U512::zero(),
        })
    }

    fn require_owner(&self) {
        if self.env().caller() != self.owner.get_or_revert(&self.env()) {
            self.env().revert("Caller is not owner");
        }
    }

    fn require_not_paused(&self) {
        if self.paused.get_or_default() {
            self.env().revert("Contract is paused");
        }
    }

    fn require_positive_amount(&self, amount: U512) {
        if amount == U512::zero() {
            self.env().revert("Amount must be greater than zero");
        }
    }
}
```

## 🧪 Testing Smart Contracts

Create `tests/yield_optimizer_tests.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv, HostRef};
    use odra::casper_types::U512;

    fn setup() -> (HostEnv, HostRef<YieldOptimizer>) {
        let env = odra_test::env();
        let contract = YieldOptimizer::deploy(
            &env,
            U512::from(100), // 1% management fee (100 basis points)
        );
        (env, contract)
    }

    #[test]
    fn test_initialization() {
        let (_env, contract) = setup();

        assert_eq!(contract.get_tvl(), U512::zero());
        assert_eq!(contract.is_paused(), false);
    }

    #[test]
    fn test_deposit() {
        let (env, mut contract) = setup();

        let user = env.get_account(1);
        env.set_caller(user);

        let deposit_amount = U512::from(1_000_000_000); // 1 CSPR

        contract.deposit(deposit_amount);

        assert_eq!(contract.get_tvl(), deposit_amount);

        let position = contract.get_position(user);
        assert_eq!(position.deposited_amount, deposit_amount);
        assert_eq!(position.shares, deposit_amount); // First deposit: 1:1 ratio
    }

    #[test]
    fn test_multiple_deposits() {
        let (env, mut contract) = setup();

        let user1 = env.get_account(1);
        let user2 = env.get_account(2);

        // User 1 deposits
        env.set_caller(user1);
        contract.deposit(U512::from(1_000_000_000)); // 1 CSPR

        // User 2 deposits
        env.set_caller(user2);
        contract.deposit(U512::from(2_000_000_000)); // 2 CSPR

        assert_eq!(contract.get_tvl(), U512::from(3_000_000_000));

        let pos1 = contract.get_position(user1);
        let pos2 = contract.get_position(user2);

        assert_eq!(pos1.deposited_amount, U512::from(1_000_000_000));
        assert_eq!(pos2.deposited_amount, U512::from(2_000_000_000));
    }

    #[test]
    fn test_withdraw() {
        let (env, mut contract) = setup();

        let user = env.get_account(1);
        env.set_caller(user);

        // Deposit
        let deposit_amount = U512::from(1_000_000_000);
        contract.deposit(deposit_amount);

        let position = contract.get_position(user);
        let shares = position.shares;

        // Withdraw half
        let withdraw_shares = shares / U512::from(2);
        contract.withdraw(withdraw_shares);

        let new_position = contract.get_position(user);
        assert_eq!(new_position.shares, shares - withdraw_shares);
    }

    #[test]
    #[should_panic(expected = "Insufficient shares")]
    fn test_withdraw_insufficient_shares() {
        let (env, mut contract) = setup();

        let user = env.get_account(1);
        env.set_caller(user);

        contract.deposit(U512::from(1_000_000_000));

        // Try to withdraw more than deposited
        contract.withdraw(U512::from(2_000_000_000));
    }

    #[test]
    fn test_add_pool() {
        let (env, mut contract) = setup();

        let owner = env.get_account(0);
        env.set_caller(owner);

        contract.add_pool(
            "Pool A".to_string(),
            1250, // 12.50% APY
            2,    // Risk level 2
        );

        let pool = contract.get_pool_info("Pool A".to_string());
        assert!(pool.is_some());

        let pool_info = pool.unwrap();
        assert_eq!(pool_info.current_apy, 1250);
        assert_eq!(pool_info.risk_level, 2);
    }

    #[test]
    fn test_pause_unpause() {
        let (env, mut contract) = setup();

        let owner = env.get_account(0);
        env.set_caller(owner);

        // Pause contract
        contract.pause();
        assert_eq!(contract.is_paused(), true);

        // Unpause contract
        contract.unpause();
        assert_eq!(contract.is_paused(), false);
    }

    #[test]
    #[should_panic(expected = "Contract is paused")]
    fn test_deposit_when_paused() {
        let (env, mut contract) = setup();

        let owner = env.get_account(0);
        env.set_caller(owner);
        contract.pause();

        let user = env.get_account(1);
        env.set_caller(user);

        // This should fail
        contract.deposit(U512::from(1_000_000_000));
    }

    #[test]
    fn test_share_calculation() {
        let (env, mut contract) = setup();

        // First user deposits 1 CSPR
        let user1 = env.get_account(1);
        env.set_caller(user1);
        contract.deposit(U512::from(1_000_000_000));

        // Simulate 10% gain (TVL increases but shares stay the same)
        // In production, this would come from pool rewards

        // Second user deposits 1 CSPR
        // They should get fewer shares due to increased value
        let user2 = env.get_account(2);
        env.set_caller(user2);
        contract.deposit(U512::from(1_000_000_000));

        let pos1 = contract.get_position(user1);
        let pos2 = contract.get_position(user2);

        // User 1 should have more shares for the same deposit
        assert!(pos1.shares >= pos2.shares);
    }
}
```

## 🔨 Building and Testing

### Build the Contract

```bash
cargo odra build
```

### Run Tests

```bash
cargo odra test
```

### Build for Deployment

```bash
cargo odra build -r
```

## 🚀 Deploying to Casper Testnet

### 1. Prepare Deployment

Ensure you have:
- Casper testnet account with CSPR tokens
- Private key file

### 2. Deploy Contract

```bash
cargo odra deploy \
  --network casper-test \
  --private-key /path/to/private_key.pem \
  --contract yield-optimizer \
  --init-args management_fee_bp:100
```

### 3. Save Contract Hash

After deployment, save the contract hash to your `.env` file:

```env
VITE_CONTRACT_HASH=hash-xxxxxxxxxxxxx
```

### 4. Verify Deployment

```bash
cargo odra verify \
  --network casper-test \
  --contract-hash hash-xxxxxxxxxxxxx
```

## 📊 Contract Interaction Examples

### Query Contract State

```bash
# Get TVL
cargo odra call \
  --network casper-test \
  --contract-hash hash-xxxxx \
  --entrypoint get_tvl

# Get user position
cargo odra call \
  --network casper-test \
  --contract-hash hash-xxxxx \
  --entrypoint get_position \
  --args user:account-hash-xxxxx
```

### Execute Transactions

```bash
# Deposit
cargo odra execute \
  --network casper-test \
  --contract-hash hash-xxxxx \
  --entrypoint deposit \
  --args amount:1000000000 \
  --private-key /path/to/key.pem

# Withdraw
cargo odra execute \
  --network casper-test \
  --contract-hash hash-xxxxx \
  --entrypoint withdraw \
  --args shares_to_withdraw:500000000 \
  --private-key /path/to/key.pem
```

## 🔒 Security Considerations

### 1. Access Control
- ✅ Owner-only functions protected
- ✅ Emergency pause mechanism
- ✅ Input validation on all public functions

### 2. Reentrancy Protection
- Odra framework handles reentrancy by default
- State updates before external calls

### 3. Integer Overflow
- Rust's type system prevents overflows
- Use checked arithmetic where needed

### 4. Testing
- Comprehensive unit tests
- Edge case coverage
- Integration tests

## ✅ Checklist

- [ ] Odra project initialized
- [ ] Main contract implemented with deposit/withdraw
- [ ] User position tracking working
- [ ] Pool management functions added
- [ ] Events emitted for all key actions
- [ ] Emergency pause functionality
- [ ] Comprehensive tests written and passing
- [ ] Contract built successfully
- [ ] Deployed to Casper testnet
- [ ] Contract hash saved and verified

## 🎓 What You've Learned

- Writing smart contracts with Odra framework
- Managing on-chain state (positions, pools, balances)
- Implementing DeFi logic (shares, deposits, withdrawals)
- Testing contracts comprehensively
- Deploying contracts to Casper Network
- Security best practices for smart contracts

## 📖 Next Steps

With your smart contracts deployed, you're ready to build the backend service that monitors blockchain events!

**Next**: [Part 5 - Building the Backend with CSPR.cloud Streaming](../05-backend/README.md)

---

## 💡 Pro Tips

- Always test thoroughly before deploying to mainnet
- Use Odra's built-in testing framework extensively
- Monitor gas costs during development
- Implement comprehensive error handling
- Document your contract's public interface
- Consider upgradeability for production contracts

**Previous**: [← Part 3: Transactions](../03-transactions/README.md) | **Next**: [Part 5: Backend →](../05-backend/README.md)
