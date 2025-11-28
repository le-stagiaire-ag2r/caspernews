import { useQuery } from '@tanstack/react-query';
import { getDeployStatus } from '../services/casper';

export interface DeployInfo {
  status: 'pending' | 'success' | 'failed';
  hash: string;
  errorMessage?: string;
  cost?: string;
}

/**
 * Monitor deploy status using Casper RPC
 */
export const useDeployStatus = (deployHash: string | null) => {
  return useQuery({
    queryKey: ['deployStatus', deployHash],
    queryFn: async (): Promise<DeployInfo | null> => {
      if (!deployHash) return null;

      try {
        console.log('🔍 Checking deploy status for:', deployHash);

        const result = await getDeployStatus(deployHash);

        // Check if deploy was executed
        if (!result[1]?.execution_results?.length) {
          return {
            status: 'pending',
            hash: deployHash,
          };
        }

        const executionResult = result[1].execution_results[0].result;

        // Check if execution was successful
        if (executionResult.Success) {
          console.log('✅ Deploy successful');
          return {
            status: 'success',
            hash: deployHash,
            cost: executionResult.Success.cost,
          };
        } else if (executionResult.Failure) {
          console.log('❌ Deploy failed:', executionResult.Failure.error_message);
          return {
            status: 'failed',
            hash: deployHash,
            errorMessage: executionResult.Failure.error_message,
          };
        }

        return {
          status: 'pending',
          hash: deployHash,
        };
      } catch (error: any) {
        console.error('Failed to fetch deploy status:', error);
        // If deploy not found, it might still be pending
        return {
          status: 'pending',
          hash: deployHash,
        };
      }
    },
    enabled: !!deployHash,
    refetchInterval: (query) => {
      // Refetch every 5 seconds while pending, stop when success/failed
      const data = query.state.data;
      if (data && data.status === 'pending') {
        return 5000;
      }
      return false;
    },
  });
};
