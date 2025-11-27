import { useQuery } from '@tanstack/react-query';
import { fetchPoolStats } from '../services/api';
import { useClick } from '@make-software/csprclick-ui';
import { motesToCspr } from '../services/casper';

export const Dashboard = () => {
  const { activeAccount } = useClick();

  // Fetch pool statistics from backend
  const { data: stats, isLoading } = useQuery({
    queryKey: ['poolStats'],
    queryFn: fetchPoolStats,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const tvlCspr = stats ? motesToCspr(stats.tvl) : '0';
  const userPositionCspr = '0'; // Will be updated with real position data

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        label="Total Value Locked"
        value={`${parseFloat(tvlCspr).toFixed(2)} CSPR`}
        trend="+0%"
        isLoading={isLoading}
      />
      <StatCard
        label="Average APY"
        value={`${stats?.avgApy || 0}%`}
        trend="+0%"
        isLoading={isLoading}
      />
      <StatCard
        label="Your Position"
        value={`${userPositionCspr} CSPR`}
        trend="+0%"
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
