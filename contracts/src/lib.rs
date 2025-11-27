#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub mod yield_optimizer;

pub use yield_optimizer::YieldOptimizer;
pub use yield_optimizer::YieldOptimizerHostRef;
pub use yield_optimizer::YieldOptimizerInitArgs;

#[cfg(test)]
mod tests;
