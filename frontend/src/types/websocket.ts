export interface TrainingData {
    episode: number;
    score: number;
    loss: number;
    epsilon: number;
}

export interface StateMessage {
    type: 'state';
    data: number[][][];
}

export interface ProgressMessage {
    type: 'progress';
    data: TrainingData;
}

export interface ErrorMessage {
    type: 'error';
    data: string;
}

export interface CompleteMessage {
    type: 'complete';
    data: string;
}

export interface StatusMessage {
    type: 'status';
    data: string;
}

export type WSMessage =
    | StateMessage
    | ProgressMessage
    | ErrorMessage
    | CompleteMessage
    | StatusMessage;

export interface WebSocketCustomError extends Error {
    code?: number;
    type?: string;
}

export const isWebSocketError = (error: unknown): error is WebSocketCustomError => {
    return error instanceof Error && ('code' in error || 'type' in error);
};

export interface TrainingConfiguration {
    envConfig: EnvConfig;
    agentConfig: AgentConfig;
    trainingConfig: TrainingConfig;
}

export interface EnvConfig {
    size: number;
    nCoins: number;
    nObstacles: number;
    dynamicObstacles: boolean;
    rewards: {
        coinCollected: number;
        collision: number;
        step: number;
        completion: number;
        timeout: number;
    };
}

export interface AgentConfig {
    learningRate: number;
    batchSize: number;
    gamma: number;
    epsilon: number;
    epsilonDecay: number;
    epsilonMin: number;
    memorySize: number;
}

export interface TrainingConfig {
    episodes: number;
    renderEvery: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';