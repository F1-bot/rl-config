import { useState, useCallback, useRef, useEffect } from 'react';
import {
    WSMessage,
    TrainingData,
    TrainingConfiguration,
    ConnectionStatus,
    isWebSocketError,
} from '@/types/websocket';

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error occurred';
};

export const useTraining = () => {
    const [isTraining, setIsTraining] = useState(false);
    const [progress, setProgress] = useState<TrainingData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [gridState, setGridState] = useState<number[][][]>([]);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 3;

    const connectWebSocket = useCallback(() => {
        try {
            console.log('Attempting to connect WebSocket...');
            const ws = new WebSocket('ws://localhost:8000/ws/train');
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected successfully');
                setConnectionStatus('connected');
                setError(null);
                reconnectAttempts.current = 0;
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed');
                setConnectionStatus('disconnected');
                setIsTraining(false);

                if (reconnectAttempts.current < maxReconnectAttempts) {
                    console.log(`Attempting to reconnect (${reconnectAttempts.current + 1}/${maxReconnectAttempts})...`);
                    reconnectAttempts.current += 1;
                    setTimeout(connectWebSocket, 1000);
                } else {
                    setError('Failed to establish WebSocket connection after multiple attempts');
                }
            };

            ws.onerror = (event: Event) => {
                const error = event as ErrorEvent;
                console.error('WebSocket error:', error);

                const errorMessage = isWebSocketError(error)
                    ? `WebSocket error (${error.code}): ${error.message}`
                    : 'WebSocket connection error';

                setError(errorMessage);
                setConnectionStatus('error');
            };

            ws.onmessage = (event: MessageEvent) => {
                try {
                    const message = JSON.parse(event.data) as WSMessage;
                    console.log('Received message:', message);

                    switch (message.type) {
                        case 'status':
                            console.log('Status update:', message.data);
                            break;
                        case 'progress':
                            setProgress(prev => [...prev, message.data]);
                            break;
                        case 'state':
                            setGridState(message.data);
                            break;
                        case 'complete':
                            setIsTraining(false);
                            break;
                        case 'error':
                            setError(message.data);
                            setIsTraining(false);
                            break;
                    }
                } catch (error: unknown) {
                    console.error('Error processing message:', error);
                    setError(`Error processing message: ${getErrorMessage(error)}`);
                }
            };

            return ws;
        } catch (error: unknown) {
            console.error('Error creating WebSocket:', error);
            setError(`Error creating WebSocket: ${getErrorMessage(error)}`);
            setConnectionStatus('error');
            return null;
        }
    }, []);

    const startTraining = useCallback((config: TrainingConfiguration) => {
        console.log('Starting training with config:', config);
        setError(null);
        setProgress([]);

        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            wsRef.current = connectWebSocket();
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(JSON.stringify(config));
                setIsTraining(true);
            } catch (error: unknown) {
                console.error('Error sending config:', error);
                setError(`Error sending configuration: ${getErrorMessage(error)}`);
            }
        } else {
            setError('No active WebSocket connection');
        }
    }, [connectWebSocket]);

    const stopTraining = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        setIsTraining(false);
    }, []);

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return {
        isTraining,
        progress,
        error,
        gridState,
        connectionStatus,
        startTraining,
        stopTraining
    };
};