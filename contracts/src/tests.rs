use super::*;
use odra::host::{Deployer, HostEnv, HostRef};
use odra::casper_types::U512;

fn setup() -> (HostEnv, HostRef<YieldOptimizer>) {
    let env = odra::host::env();
    let mut contract = YieldOptimizerHostRef::deploy(&env, YieldOptimizerInitArgs {
        management_fee_bp: 100, // 1% management fee
    });
    (env, contract)
}

#[test]
fn test_initialization() {
    let (_env, contract) = setup();

    assert_eq!(contract.get_tvl(), U512::zero());
    assert_eq!(contract.get_total_shares(), U512::zero());
    assert_eq!(contract.is_paused(), false);
    assert_eq!(contract.get_management_fee(), 100);
}

#[test]
fn test_deposit() {
    let (env, mut contract) = setup();

    let user = env.get_account(1);
    env.set_caller(user);

    let deposit_amount = U512::from(1_000_000_000u64); // 1 CSPR in motes

    contract.deposit(deposit_amount);

    assert_eq!(contract.get_tvl(), deposit_amount);

    let position = contract.get_position(user);
    assert_eq!(position.deposited_amount, deposit_amount);
    assert_eq!(position.shares, deposit_amount); // First deposit: 1:1 ratio
}

#[test]
fn test_multiple_deposits_same_user() {
    let (env, mut contract) = setup();

    let user = env.get_account(1);
    env.set_caller(user);

    let deposit1 = U512::from(1_000_000_000u64);
    let deposit2 = U512::from(500_000_000u64);

    contract.deposit(deposit1);
    contract.deposit(deposit2);

    let position = contract.get_position(user);
    assert_eq!(position.deposited_amount, deposit1 + deposit2);
    assert_eq!(contract.get_tvl(), deposit1 + deposit2);
}

#[test]
fn test_multiple_users_deposit() {
    let (env, mut contract) = setup();

    let user1 = env.get_account(1);
    let user2 = env.get_account(2);

    // User 1 deposits
    env.set_caller(user1);
    contract.deposit(U512::from(1_000_000_000u64)); // 1 CSPR

    // User 2 deposits
    env.set_caller(user2);
    contract.deposit(U512::from(2_000_000_000u64)); // 2 CSPR

    assert_eq!(contract.get_tvl(), U512::from(3_000_000_000u64));

    let pos1 = contract.get_position(user1);
    let pos2 = contract.get_position(user2);

    assert_eq!(pos1.deposited_amount, U512::from(1_000_000_000u64));
    assert_eq!(pos2.deposited_amount, U512::from(2_000_000_000u64));
}

#[test]
fn test_withdraw() {
    let (env, mut contract) = setup();

    let user = env.get_account(1);
    env.set_caller(user);

    // Deposit
    let deposit_amount = U512::from(1_000_000_000u64);
    contract.deposit(deposit_amount);

    let position = contract.get_position(user);
    let shares = position.shares;

    // Withdraw half
    let withdraw_shares = shares / U512::from(2u64);
    contract.withdraw(withdraw_shares);

    let new_position = contract.get_position(user);
    assert_eq!(new_position.shares, shares - withdraw_shares);

    // TVL should be reduced by approximately half
    let remaining_tvl = contract.get_tvl();
    assert!(remaining_tvl > U512::from(400_000_000u64)); // Allow some margin
    assert!(remaining_tvl < U512::from(600_000_000u64));
}

#[test]
fn test_full_withdrawal() {
    let (env, mut contract) = setup();

    let user = env.get_account(1);
    env.set_caller(user);

    let deposit_amount = U512::from(1_000_000_000u64);
    contract.deposit(deposit_amount);

    let position = contract.get_position(user);
    contract.withdraw(position.shares);

    let new_position = contract.get_position(user);
    assert_eq!(new_position.shares, U512::zero());
    assert_eq!(new_position.deposited_amount, U512::zero());
    assert_eq!(contract.get_tvl(), U512::zero());
}

#[test]
#[should_panic(expected = "Insufficient shares")]
fn test_withdraw_insufficient_shares() {
    let (env, mut contract) = setup();

    let user = env.get_account(1);
    env.set_caller(user);

    contract.deposit(U512::from(1_000_000_000u64));

    // Try to withdraw more than deposited
    contract.withdraw(U512::from(2_000_000_000u64));
}

#[test]
#[should_panic(expected = "Amount must be greater than zero")]
fn test_deposit_zero_amount() {
    let (env, mut contract) = setup();

    let user = env.get_account(1);
    env.set_caller(user);

    contract.deposit(U512::zero());
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
    assert_eq!(pool_info.name, "Pool A");
    assert_eq!(pool_info.current_apy, 1250);
    assert_eq!(pool_info.risk_level, 2);
    assert_eq!(pool_info.total_allocated, U512::zero());
}

#[test]
fn test_update_pool_apy() {
    let (env, mut contract) = setup();

    let owner = env.get_account(0);
    env.set_caller(owner);

    contract.add_pool("Pool A".to_string(), 1250, 2);
    contract.update_pool_apy("Pool A".to_string(), 1500); // Update to 15%

    let pool = contract.get_pool_info("Pool A".to_string()).unwrap();
    assert_eq!(pool.current_apy, 1500);
}

#[test]
#[should_panic(expected = "Pool not found")]
fn test_update_nonexistent_pool() {
    let (env, mut contract) = setup();

    let owner = env.get_account(0);
    env.set_caller(owner);

    contract.update_pool_apy("Nonexistent".to_string(), 1500);
}

#[test]
fn test_allocate_to_pool() {
    let (env, mut contract) = setup();

    let owner = env.get_account(0);
    let user = env.get_account(1);

    // User deposits
    env.set_caller(user);
    contract.deposit(U512::from(10_000_000_000u64)); // 10 CSPR

    // Owner adds pool and allocates
    env.set_caller(owner);
    contract.add_pool("Pool A".to_string(), 1250, 2);
    contract.allocate_to_pool("Pool A".to_string(), U512::from(5_000_000_000u64));

    let pool = contract.get_pool_info("Pool A".to_string()).unwrap();
    assert_eq!(pool.total_allocated, U512::from(5_000_000_000u64));
}

#[test]
#[should_panic(expected = "Insufficient TVL")]
fn test_allocate_exceeds_tvl() {
    let (env, mut contract) = setup();

    let owner = env.get_account(0);
    env.set_caller(owner);

    contract.add_pool("Pool A".to_string(), 1250, 2);

    // Try to allocate more than TVL
    contract.allocate_to_pool("Pool A".to_string(), U512::from(10_000_000_000u64));
}

#[test]
fn test_rebalance_pools() {
    let (env, mut contract) = setup();

    let owner = env.get_account(0);
    let user = env.get_account(1);

    // User deposits
    env.set_caller(user);
    contract.deposit(U512::from(10_000_000_000u64)); // 10 CSPR

    // Owner sets up pools
    env.set_caller(owner);
    contract.add_pool("Pool A".to_string(), 1250, 2);
    contract.add_pool("Pool B".to_string(), 1500, 3);

    // Allocate to Pool A
    contract.allocate_to_pool("Pool A".to_string(), U512::from(8_000_000_000u64));

    // Rebalance from A to B
    contract.rebalance_pools(
        "Pool A".to_string(),
        "Pool B".to_string(),
        U512::from(3_000_000_000u64),
    );

    let pool_a = contract.get_pool_info("Pool A".to_string()).unwrap();
    let pool_b = contract.get_pool_info("Pool B".to_string()).unwrap();

    assert_eq!(pool_a.total_allocated, U512::from(5_000_000_000u64));
    assert_eq!(pool_b.total_allocated, U512::from(3_000_000_000u64));
}

#[test]
#[should_panic(expected = "Insufficient allocation in source pool")]
fn test_rebalance_insufficient_allocation() {
    let (env, mut contract) = setup();

    let owner = env.get_account(0);
    env.set_caller(owner);

    contract.add_pool("Pool A".to_string(), 1250, 2);
    contract.add_pool("Pool B".to_string(), 1500, 3);

    // Try to rebalance without allocation
    contract.rebalance_pools(
        "Pool A".to_string(),
        "Pool B".to_string(),
        U512::from(1_000_000_000u64),
    );
}

#[test]
fn test_harvest_rewards() {
    let (env, mut contract) = setup();

    let owner = env.get_account(0);
    let user = env.get_account(1);

    // User deposits
    env.set_caller(user);
    let initial_deposit = U512::from(10_000_000_000u64);
    contract.deposit(initial_deposit);

    // Owner harvests rewards
    env.set_caller(owner);
    contract.add_pool("Pool A".to_string(), 1250, 2);

    let rewards = U512::from(1_000_000_000u64); // 1 CSPR rewards
    contract.harvest_rewards("Pool A".to_string(), rewards);

    // TVL should increase
    assert_eq!(contract.get_tvl(), initial_deposit + rewards);

    // User's value should also increase proportionally
    let user_value = contract.get_user_value(user);
    assert_eq!(user_value, initial_deposit + rewards);
}

#[test]
fn test_share_calculation_with_rewards() {
    let (env, mut contract) = setup();

    let owner = env.get_account(0);
    let user1 = env.get_account(1);
    let user2 = env.get_account(2);

    // User 1 deposits
    env.set_caller(user1);
    contract.deposit(U512::from(10_000_000_000u64)); // 10 CSPR

    // Simulate rewards (owner harvests)
    env.set_caller(owner);
    contract.add_pool("Pool A".to_string(), 1250, 2);
    contract.harvest_rewards("Pool A".to_string(), U512::from(1_000_000_000u64)); // +1 CSPR

    // Now TVL is 11 CSPR but shares are still 10
    // User 2 deposits 11 CSPR
    env.set_caller(user2);
    contract.deposit(U512::from(11_000_000_000u64));

    let pos1 = contract.get_position(user1);
    let pos2 = contract.get_position(user2);

    // User 1 should have 10 shares
    assert_eq!(pos1.shares, U512::from(10_000_000_000u64));

    // User 2 should have 10 shares (11 CSPR / 11 CSPR per share = 10 shares)
    assert_eq!(pos2.shares, U512::from(10_000_000_000u64));
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
    contract.deposit(U512::from(1_000_000_000u64));
}

#[test]
#[should_panic(expected = "Caller is not owner")]
fn test_non_owner_cannot_pause() {
    let (env, mut contract) = setup();

    let user = env.get_account(1);
    env.set_caller(user);

    contract.pause();
}

#[test]
#[should_panic(expected = "Caller is not owner")]
fn test_non_owner_cannot_add_pool() {
    let (env, mut contract) = setup();

    let user = env.get_account(1);
    env.set_caller(user);

    contract.add_pool("Pool A".to_string(), 1250, 2);
}

#[test]
fn test_get_user_value() {
    let (env, mut contract) = setup();

    let user = env.get_account(1);
    env.set_caller(user);

    let deposit_amount = U512::from(5_000_000_000u64);
    contract.deposit(deposit_amount);

    let user_value = contract.get_user_value(user);
    assert_eq!(user_value, deposit_amount);
}

#[test]
fn test_owner_is_set_correctly() {
    let (env, contract) = setup();

    let owner = env.get_account(0);
    assert_eq!(contract.get_owner(), owner);
}
