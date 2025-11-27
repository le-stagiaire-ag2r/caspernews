import WebSocket from 'ws';

export interface DeployProcessedEvent {
  deploy_hash: string;
  account: string;
  timestamp: string;
  block_hash: string;
  execution_result: {
    Success?: {
      effect: {
        transforms: any[];
      };
      transfers: string[];
      cost: string;
    };
    Failure?: {
      error_message: string;
    };
  };
}

export interface DepositEvent {
  user: string;
  amount: string;
  shares: string;
  timestamp: string;
  deploy_hash: string;
}

export interface WithdrawalEvent {
  user: string;
  amount: string;
  shares: string;
  timestamp: string;
  deploy_hash: string;
}

export interface RebalanceEvent {
  from_pool: string;
  to_pool: string;
  amount: string;
  timestamp: string;
  deploy_hash: string;
}

export class CasperEventStreaming {
  private ws: WebSocket | null = null;
  private streamingUrl: string;
  private contractHash: string;
  private reconnectInterval: number = 5000;
  private shouldReconnect: boolean = true;

  constructor(streamingUrl: string, contractHash: string) {
    this.streamingUrl = streamingUrl;
    this.contractHash = contractHash;
  }

  /**
   * Start listening to contract events
   */
  async start(
    onDeposit: (event: DepositEvent) => void,
    onWithdrawal: (event: WithdrawalEvent) => void,
    onRebalance: (event: RebalanceEvent) => void
  ): Promise<void> {
    console.log('🎧 Starting event stream listener...');
    console.log(`📍 Streaming URL: ${this.streamingUrl}`);
    console.log(`📝 Contract Hash: ${this.contractHash}`);

    this.connectWebSocket(onDeposit, onWithdrawal, onRebalance);
  }

  private connectWebSocket(
    onDeposit: (event: DepositEvent) => void,
    onWithdrawal: (event: WithdrawalEvent) => void,
    onRebalance: (event: RebalanceEvent) => void
  ): void {
    try {
      this.ws = new WebSocket(this.streamingUrl);

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected to CSPR.cloud');

        // Subscribe to deploy processed events for our contract
        const subscribeMessage = {
          action: 'subscribe',
          event_type: 'DeployProcessed',
          contract_hash: this.contractHash,
        };

        this.ws?.send(JSON.stringify(subscribeMessage));
        console.log('📡 Subscribed to DeployProcessed events');
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.event_type === 'DeployProcessed') {
            this.processEvent(message, onDeposit, onWithdrawal, onRebalance);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket disconnected');

        if (this.shouldReconnect) {
          console.log(`🔄 Reconnecting in ${this.reconnectInterval / 1000}s...`);
          setTimeout(() => {
            this.connectWebSocket(onDeposit, onWithdrawal, onRebalance);
          }, this.reconnectInterval);
        }
      });
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  /**
   * Process incoming blockchain events
   */
  private processEvent(
    event: DeployProcessedEvent,
    onDeposit: (event: DepositEvent) => void,
    onWithdrawal: (event: WithdrawalEvent) => void,
    onRebalance: (event: RebalanceEvent) => void
  ): void {
    try {
      const { deploy_hash, account, timestamp, execution_result } = event;

      // Check if execution was successful
      if (!execution_result.Success) {
        console.log(
          `❌ Deploy ${deploy_hash} failed:`,
          execution_result.Failure?.error_message
        );
        return;
      }

      // Parse the event type from contract events
      const transforms = execution_result.Success.effect.transforms;

      for (const transform of transforms) {
        // Look for contract events in transforms
        // This is a simplified version - actual parsing depends on Odra event format
        if (this.isDepositEvent(transform)) {
          console.log('💰 Deposit event detected');
          const depositEvent = this.parseDepositEvent(transform, deploy_hash, timestamp);
          onDeposit(depositEvent);
        } else if (this.isWithdrawalEvent(transform)) {
          console.log('💸 Withdrawal event detected');
          const withdrawalEvent = this.parseWithdrawalEvent(transform, deploy_hash, timestamp);
          onWithdrawal(withdrawalEvent);
        } else if (this.isRebalanceEvent(transform)) {
          console.log('🔄 Rebalance event detected');
          const rebalanceEvent = this.parseRebalanceEvent(transform, deploy_hash, timestamp);
          onRebalance(rebalanceEvent);
        }
      }
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  private isDepositEvent(transform: any): boolean {
    // Check if this transform contains a Deposit event
    // This depends on the actual Odra event structure
    return transform.key?.includes('Deposit') || transform.transform?.includes('Deposit');
  }

  private isWithdrawalEvent(transform: any): boolean {
    return transform.key?.includes('Withdrawal') || transform.transform?.includes('Withdrawal');
  }

  private isRebalanceEvent(transform: any): boolean {
    return transform.key?.includes('Rebalance') || transform.transform?.includes('Rebalance');
  }

  private parseDepositEvent(transform: any, deployHash: string, timestamp: string): DepositEvent {
    // Parse deposit event data
    // This is placeholder - actual parsing depends on Odra event format
    return {
      user: transform.user || 'unknown',
      amount: transform.amount || '0',
      shares: transform.shares || '0',
      timestamp,
      deploy_hash: deployHash,
    };
  }

  private parseWithdrawalEvent(transform: any, deployHash: string, timestamp: string): WithdrawalEvent {
    return {
      user: transform.user || 'unknown',
      amount: transform.amount || '0',
      shares: transform.shares || '0',
      timestamp,
      deploy_hash: deployHash,
    };
  }

  private parseRebalanceEvent(transform: any, deployHash: string, timestamp: string): RebalanceEvent {
    return {
      from_pool: transform.from_pool || 'unknown',
      to_pool: transform.to_pool || 'unknown',
      amount: transform.amount || '0',
      timestamp,
      deploy_hash: deployHash,
    };
  }

  /**
   * Stop the event stream
   */
  async stop(): Promise<void> {
    this.shouldReconnect = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('🛑 Event stream stopped');
  }
}
