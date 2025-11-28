import { useClick } from '@make-software/csprclick-ui';

// DEMO DATA - Replace with real data from backend in Phase 3
const DEMO_STATS = {
  tvl: 50234.56,        // Total Value Locked in CSPR
  avgApy: 12.5,         // Average APY across all pools
  userPosition: 1250.00, // User's position if connected
  tvlTrend: '+5.2',     // 24h trend
  apyTrend: '+0.8',     // 24h trend
  positionTrend: '+3.1' // 24h trend
};

export const Dashboard = () => {
  const { activeAccount } = useClick();

  // Using demo data for now - will be replaced with real API calls in Phase 3
  const isLoading = false;
  const stats = DEMO_STATS;

  const tvlCspr = stats.tvl.toFixed(2);
  const userPositionCspr = activeAccount ? stats.userPosition.toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        label="Total Value Locked"
        value={`${tvlCspr} CSPR`}
        trend={`${stats.tvlTrend}%`}
        isLoading={isLoading}
      />
      <StatCard
        label="Average APY"
        value={`${stats.avgApy}%`}
        trend={`${stats.apyTrend}%`}
        isLoading={isLoading}
      />
      <StatCard
        label="Your Position"
        value={`${userPositionCspr} CSPR`}
        trend={activeAccount ? `${stats.positionTrend}%` : '+0%'}
        isLoading={isLoading}
        highlight={!!activeAccount}
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  isLoading?: boolean;
  highlight?: boolean;
}

const StatCard = ({ label, value, trend, isLoading, highlight }: StatCardProps) => {
  const isPositive = trend.startsWith('+');

  return (
    <div className={`card ${highlight ? 'ring-2 ring-casper-red' : ''}`}>
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
        </div>
      ) : (
        <>
          <div className="text-3xl font-bold mb-2">{value}</div>
          <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {trend} <span className="text-gray-500">24h</span>
          </div>
        </>
      )}
    </div>
  );
};
