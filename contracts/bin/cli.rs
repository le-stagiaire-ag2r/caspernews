use yield_optimizer::YieldOptimizer;

fn main() {
    odra_cli::Cli::default()
        .with_contract::<YieldOptimizer>()
        .run();
}
