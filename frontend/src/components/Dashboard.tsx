export const Dashboard = () => {
  // TODO: Fetch real data from backend
  const stats = {
    tvl: '0',
    avgApy: '0',
    userPosition: '0',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        label="Total Value Locked"
        value={`${stats.tvl} CSPR`}
        trend="+0%"
      />
      <StatCard
        label="Average APY"
        value={`${stats.avgApy}%`}
        trend="+0%"
      />
      <StatCard
        label="Your Position"
        value={`${stats.userPosition} CSPR`}
        trend="+0%"
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
}

const StatCard = ({ label, value, trend }: StatCardProps) => {
  const isPositive = trend.startsWith('+');

  return (
    <div className="card">
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {trend} <span className="text-gray-500">24h</span>
      </div>
    </div>
  );
};
