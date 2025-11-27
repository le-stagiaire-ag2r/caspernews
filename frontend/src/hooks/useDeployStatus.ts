import { useQuery } from '@tanstack/react-query';
import { RPC_URL } from '../services/casper';

export type DeployStatus = 'pending' | 'success' | 'failed';

export interface DeployInfo {
  status: DeployStatus;
  blockHash?: string;
  timestamp?: string;
  cost?: string;
  errorMessage?: string;
}

/**
 * Monitor deploy status on the blockchain
 */
export const useDeployStatus = (deployHash: string | null) => {
  return useQuery({
    queryKey: ['deployStatus', deployHash],
    queryFn: () => fetchDeployStatus(deployHash!),
    enabled: !!deployHash,
    refetchInterval: (data) => {
      // Stop refetching once deploy is finalized
      if (data?.status === 'success' || data?.status === 'failed') {
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
  });
};

/**
 * Fetch deploy status from Casper RPC
 */
const fetchDeployStatus = async (
  deployHash: string,
): Promise<DeployInfo> => {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'info_get_deploy',
        params: {
          deploy_hash: deployHash,
        },
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.error) {
      return {
        status: 'failed',
        errorMessage: result.error.message,
      };
    }

    if (!result.result || !result.result.execution_results) {
      return { status: 'pending' };
    }

    const executionResults = result.result.execution_results;

    if (!executionResults || executionResults.length === 0) {
      return { status: 'pending' };
    }

    const execution = executionResults[0].result;

    if (execution.Success) {
      return {
        status: 'success',
        blockHash: execution.Success.block_hash,
        cost: execution.Success.cost,
      };
    }

    if (execution.Failure) {
      return {
        status: 'failed',
        errorMessage: execution.Failure.error_message,
      };
    }

    return { status: 'pending' };
  } catch (error: any) {
    console.error('Error fetching deploy status:', error);
    return {
      status: 'failed',
      errorMessage: error.message || 'Failed to fetch deploy status',
    };
  }
};
