use odra::prelude::*;
use odra::casper_types::U512;

/// Custom errors for the contract
#[odra::odra_error]
pub enum Error {
    InsufficientShares = 1,
    InsufficientBalance = 2,
    ZeroAmount = 3,
    NotOwner = 4,
    ContractPaused = 5,
    PoolNotFound = 6,
    InsufficientTvl = 7,
    InsufficientAllocation = 8,
}

/// Events emitted by the contract
#[odra::event]
pub struct Deposit {
    pub user: Address,
    pub amount: U512,
    pub shares: U512,
    pub timestamp: u64,
}

#[odra::event]
pub struct Withdrawal {
    pub user: Address,
    pub amount: U512,
    pub shares: U512,
    pub timestamp: u64,
}

#[odra::event]
pub struct Rebalance {
    pub from_pool: String,
    pub to_pool: String,
    pub amount: U512,
    pub timestamp: u64,
}

#[odra::event]
pub struct RewardsHarvested {
    pub pool: String,
    pub amount: U512,
    pub timestamp: u64,
}

/// User position information
#[odra::odra_type]
pub struct UserPosition {
    pub shares: U512,
    pub deposited_amount: U512,
    pub last_deposit_time: u64,
    pub total_rewards: U512,
}

impl Default for UserPosition {
    fn default() -> Self {
        Self {
            shares: U512::zero(),
            deposited_amount: U512::zero(),
            last_deposit_time: 0,
            total_rewards: U512::zero(),
        }
    }
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
#[odra::module]
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
    pub fn init(&mut self, management_fee_bp: u32) {
        let caller = self.env().caller();
        self.owner.set(caller);
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
        position.shares = position.shares + shares;
        position.deposited_amount = position.deposited_amount + amount;
        position.last_deposit_time = self.env().get_block_time();

        self.user_positions.set(&caller, position);

        // Update global state
        let current_tvl = self.total_tvl.get().unwrap_or(U512::zero());
        self.total_tvl.set(current_tvl + amount);

        let current_shares = self.total_shares.get().unwrap_or(U512::zero());
        self.total_shares.set(current_shares + shares);

        // Emit event
        self.env().emit_event(Deposit {
            user: caller,
            amount,
            shares,
            timestamp: self.env().get_block_time(),
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
            self.env().revert(Error::InsufficientShares)
        }

        // Calculate withdrawal amount (shares to tokens)
        let amount = self.calculate_withdrawal_amount(shares_to_withdraw);

        // Verify contract has enough balance
        let current_tvl = self.total_tvl.get().unwrap_or(U512::zero());
        if current_tvl < amount {
            self.env().revert(Error::InsufficientBalance)
        }

        // Update user position
        position.shares = position.shares - shares_to_withdraw;
        if position.shares == U512::zero() {
            // Reset position if fully withdrawn
            position.deposited_amount = U512::zero();
            position.total_rewards = U512::zero();
        }
        self.user_positions.set(&caller, position);

        // Update global state
        self.total_tvl.set(current_tvl - amount);

        let current_shares = self.total_shares.get().unwrap_or(U512::zero());
        self.total_shares.set(current_shares - shares_to_withdraw);

        // Emit event
        self.env().emit_event(Withdrawal {
            user: caller,
            amount,
            shares: shares_to_withdraw,
            timestamp: self.env().get_block_time(),
        });
    }

    /// Get user position details
    pub fn get_position(&self, user: Address) -> UserPosition {
        self.get_user_position(&user)
    }

    /// Get total value locked
    pub fn get_tvl(&self) -> U512 {
        self.total_tvl.get().unwrap_or(U512::zero())
    }

    /// Get total shares issued
    pub fn get_total_shares(&self) -> U512 {
        self.total_shares.get().unwrap_or(U512::zero())
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
    pub fn add_pool(&mut self, name: String, initial_apy: u32, risk_level: u8) {
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

        if let Some(mut pool) = self.pools.get(&pool_name) {
            pool.current_apy = new_apy;
            self.pools.set(&pool_name, pool);
        } else {
            self.env().revert(Error::PoolNotFound)
        }
    }

    /// Get pool information
    pub fn get_pool_info(&self, pool_name: String) -> Option<PoolInfo> {
        self.pools.get(&pool_name)
    }

    /// Allocate funds to a pool (owner only)
    pub fn allocate_to_pool(&mut self, pool_name: String, amount: U512) {
        self.require_owner();
        self.require_positive_amount(amount);

        if let Some(mut pool) = self.pools.get(&pool_name) {
            // Verify sufficient TVL
            let current_tvl = self.total_tvl.get().unwrap_or(U512::zero());
            if current_tvl < amount {
                self.env().revert(Error::InsufficientTvl)
            }

            pool.total_allocated = pool.total_allocated + amount;
            self.pools.set(&pool_name, pool);
        } else {
            self.env().revert(Error::PoolNotFound)
        }
    }

    /// Rebalance between pools (owner only)
    pub fn rebalance_pools(&mut self, from_pool: String, to_pool: String, amount: U512) {
        self.require_owner();
        self.require_positive_amount(amount);

        // Get source pool
        let mut from = match self.pools.get(&from_pool) {
            Some(p) => p,
            None => self.env().revert(Error::PoolNotFound),
        };

        // Get destination pool
        let mut to = match self.pools.get(&to_pool) {
            Some(p) => p,
            None => self.env().revert(Error::PoolNotFound),
        };

        // Verify sufficient allocation in source pool
        if from.total_allocated < amount {
            self.env().revert(Error::InsufficientAllocation)
        }

        // Update allocations
        from.total_allocated = from.total_allocated - amount;
        to.total_allocated = to.total_allocated + amount;

        self.pools.set(&from_pool, from);
        self.pools.set(&to_pool, to);

        // Emit event
        self.env().emit_event(Rebalance {
            from_pool,
            to_pool,
            amount,
            timestamp: self.env().get_block_time(),
        });
    }

    /// Harvest rewards from a pool (owner only)
    pub fn harvest_rewards(&mut self, pool_name: String, amount: U512) {
        self.require_owner();
        self.require_positive_amount(amount);

        // Verify pool exists
        if self.pools.get(&pool_name).is_none() {
            self.env().revert(Error::PoolNotFound)
        }

        // Add rewards to TVL
        let current_tvl = self.total_tvl.get().unwrap_or(U512::zero());
        self.total_tvl.set(current_tvl + amount);

        // Emit event
        self.env().emit_event(RewardsHarvested {
            pool: pool_name,
            amount,
            timestamp: self.env().get_block_time(),
        });
    }

    /// Get contract owner
    pub fn get_owner(&self) -> Option<Address> {
        self.owner.get()
    }

    /// Get management fee
    pub fn get_management_fee(&self) -> u32 {
        self.management_fee.get().unwrap_or(0)
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
        self.paused.get().unwrap_or(false)
    }

    // ========== Internal Functions ==========

    fn calculate_shares(&self, amount: U512) -> U512 {
        let total_shares = self.total_shares.get().unwrap_or(U512::zero());
        let total_tvl = self.total_tvl.get().unwrap_or(U512::zero());

        if total_shares == U512::zero() || total_tvl == U512::zero() {
            // First deposit: shares = amount (1:1 ratio)
            return amount;
        }

        // shares = (amount * total_shares) / total_tvl
        amount * total_shares / total_tvl
    }

    fn calculate_withdrawal_amount(&self, shares: U512) -> U512 {
        let total_shares = self.total_shares.get().unwrap_or(U512::zero());
        let total_tvl = self.total_tvl.get().unwrap_or(U512::zero());

        if total_shares == U512::zero() {
            return U512::zero();
        }

        // amount = (shares * total_tvl) / total_shares
        shares * total_tvl / total_shares
    }

    fn get_user_position(&self, user: &Address) -> UserPosition {
        self.user_positions
            .get(user)
            .unwrap_or_else(|| UserPosition::default())
    }

    fn require_owner(&self) {
        let owner = match self.owner.get() {
            Some(addr) => addr,
            None => self.env().revert(Error::NotOwner),
        };

        if self.env().caller() != owner {
            self.env().revert(Error::NotOwner)
        }
    }

    fn require_not_paused(&self) {
        if self.paused.get().unwrap_or(false) {
            self.env().revert(Error::ContractPaused)
        }
    }

    fn require_positive_amount(&self, amount: U512) {
        if amount == U512::zero() {
            self.env().revert(Error::ZeroAmount)
        }
    }
}
