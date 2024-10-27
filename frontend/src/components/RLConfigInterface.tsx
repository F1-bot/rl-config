"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { CustomSlider } from './CustomSlider';
import { CustomSwitch } from './CustomSwitch';
import EnvironmentView from './EnvironmentView';
import styles from '@/styles/RLConfig.module.css';

const WS_URL = 'ws://127.0.0.1:8001/ws/train';

const RLConfigInterface = () => {
    const [status, setStatus] = useState('Not connected');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingData, setTrainingData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [gridState, setGridState] = useState<number[][][]>([]);

    const [envConfig, setEnvConfig] = useState({
        size: 6,
        nCoins: 1,
        nObstacles: 2,
        dynamicObstacles: false,
        rewards: {
            coinCollected: 1,
            collision: -1,
            step: -0.01,
            completion: 2,
            timeout: -0.5
        }
    });

    const [agentConfig, setAgentConfig] = useState({
        learningRate: 0.001,
        batchSize: 32,
        gamma: 0.95,
        epsilon: 1.0,
        epsilonDecay: 0.98,
        epsilonMin: 0.15,
        memorySize: 10000
    });

    const [trainingConfig, setTrainingConfig] = useState({
        episodes: 1000,
        renderEvery: 50
    });

    useEffect(() => {
        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [ws]);

    const startTraining = () => {
        if (ws) {
            ws.close();
            setWs(null);
        }

        try {
            console.log('Connecting to WebSocket...');
            const socket = new WebSocket(WS_URL);

            socket.onopen = () => {
                console.log('WebSocket connected');
                setStatus('Connected');
                setError(null);
                setTrainingData([]);
                setGridState([]);

                const config = {
                    envConfig,
                    agentConfig,
                    trainingConfig
                };
                socket.send(JSON.stringify(config));
                setIsTraining(true);
            };

            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log('Received:', message);

                switch (message.type) {
                    case 'progress':
                        setTrainingData(prev => [...prev, message.data]);
                        break;
                    case 'state':
                        setGridState(message.data);
                        break;
                    case 'complete':
                        setIsTraining(false);
                        setStatus('Training completed');
                        socket.close();
                        setWs(null);
                        break;
                    case 'error':
                        setError(message.data);
                        setStatus('Error occurred');
                        setIsTraining(false);
                        socket.close();
                        setWs(null);
                        break;
                }
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('Connection error occurred');
                setStatus('Error');
                setIsTraining(false);
                setWs(null);
            };

            socket.onclose = () => {
                console.log('WebSocket closed');
                setStatus('Disconnected');
                setIsTraining(false);
                setWs(null);
            };

            setWs(socket);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Failed to connect:', error);
            setError(`Connection failed: ${errorMessage}`);
            setStatus('Connection failed');
            setWs(null);
        }
    };

    const stopTraining = () => {
        if (ws) {
            ws.close();
            setWs(null);
            setGridState([]);
            setStatus('Disconnected');
        }
    };

    const handleStartTraining = () => {
        if (!isTraining && (!ws || ws.readyState !== WebSocket.OPEN)) {
            startTraining();
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>RL Training Configuration</h1>

            <div className={styles.statusBar}>
                <div className={styles.statusIndicator}>
                    <div className={`${styles.statusDot} ${styles[status.toLowerCase()]}`} />
                    <span>Status: {status}</span>
                </div>
                {isTraining && (
                    <div>Episode: {trainingData.length}</div>
                )}
            </div>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Environment Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Environment Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className={styles.sliderContainer}>
                                <div className={styles.sliderLabel}>
                                    <span>Grid Size</span>
                                    <span className="font-medium">{envConfig.size}</span>
                                </div>
                                <CustomSlider
                                    value={envConfig.size}
                                    onChange={(value) => {
                                        setEnvConfig({...envConfig, size: value});
                                        setGridState([]);
                                    }}
                                    min={4}
                                    max={12}
                                    step={1}
                                    disabled={isTraining}
                                />
                            </div>

                            <div className={styles.sliderContainer}>
                                <div className={styles.sliderLabel}>
                                    <span>Number of Coins</span>
                                    <span>{envConfig.nCoins}</span>
                                </div>
                                <CustomSlider
                                    value={envConfig.nCoins}
                                    onChange={(value) => setEnvConfig({...envConfig, nCoins: value})}
                                    min={1}
                                    max={5}
                                    step={1}
                                    disabled={isTraining}
                                />
                            </div>

                            <div className={styles.sliderContainer}>
                                <div className={styles.sliderLabel}>
                                    <span>Number of Obstacles</span>
                                    <span>{envConfig.nObstacles}</span>
                                </div>
                                <CustomSlider
                                    value={envConfig.nObstacles}
                                    onChange={(value) => setEnvConfig({...envConfig, nObstacles: value})}
                                    min={0}
                                    max={8}
                                    step={1}
                                    disabled={isTraining}
                                />
                            </div>

                            <div className={styles.switchContainer}>
                                <CustomSwitch
                                    checked={envConfig.dynamicObstacles}
                                    onChange={(checked) => setEnvConfig({...envConfig, dynamicObstacles: checked})}
                                    disabled={isTraining}
                                />
                                <span className={styles.switchLabel}>Dynamic Obstacles</span>
                            </div>

                            {/* Нові налаштування винагород */}
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold mb-4">Rewards Configuration</h3>

                                <div className="space-y-4">
                                    <div className={styles.sliderContainer}>
                                        <div className={styles.sliderLabel}>
                                            <span>Coin Collected Reward</span>
                                            <span>{envConfig.rewards.coinCollected}</span>
                                        </div>
                                        <CustomSlider
                                            value={envConfig.rewards.coinCollected}
                                            onChange={(value) => setEnvConfig({
                                                ...envConfig,
                                                rewards: {...envConfig.rewards, coinCollected: value}
                                            })}
                                            min={0}
                                            max={5}
                                            step={0.1}
                                            disabled={isTraining}
                                        />
                                    </div>

                                    <div className={styles.sliderContainer}>
                                        <div className={styles.sliderLabel}>
                                            <span>Collision Penalty</span>
                                            <span>{envConfig.rewards.collision}</span>
                                        </div>
                                        <CustomSlider
                                            value={Math.abs(envConfig.rewards.collision)}
                                            onChange={(value) => setEnvConfig({
                                                ...envConfig,
                                                rewards: {...envConfig.rewards, collision: -value}
                                            })}
                                            min={0}
                                            max={5}
                                            step={0.1}
                                            disabled={isTraining}
                                        />
                                    </div>

                                    <div className={styles.sliderContainer}>
                                        <div className={styles.sliderLabel}>
                                            <span>Step Penalty</span>
                                            <span>{envConfig.rewards.step}</span>
                                        </div>
                                        <CustomSlider
                                            value={Math.abs(envConfig.rewards.step)}
                                            onChange={(value) => setEnvConfig({
                                                ...envConfig,
                                                rewards: {...envConfig.rewards, step: -value}
                                            })}
                                            min={0}
                                            max={0.1}
                                            step={0.001}
                                            disabled={isTraining}
                                        />
                                    </div>

                                    <div className={styles.sliderContainer}>
                                        <div className={styles.sliderLabel}>
                                            <span>Completion Reward</span>
                                            <span>{envConfig.rewards.completion}</span>
                                        </div>
                                        <CustomSlider
                                            value={envConfig.rewards.completion}
                                            onChange={(value) => setEnvConfig({
                                                ...envConfig,
                                                rewards: {...envConfig.rewards, completion: value}
                                            })}
                                            min={0}
                                            max={10}
                                            step={0.1}
                                            disabled={isTraining}
                                        />
                                    </div>

                                    <div className={styles.sliderContainer}>
                                        <div className={styles.sliderLabel}>
                                            <span>Timeout Penalty</span>
                                            <span>{envConfig.rewards.timeout}</span>
                                        </div>
                                        <CustomSlider
                                            value={Math.abs(envConfig.rewards.timeout)}
                                            onChange={(value) => setEnvConfig({
                                                ...envConfig,
                                                rewards: {...envConfig.rewards, timeout: -value}
                                            })}
                                            min={0}
                                            max={5}
                                            step={0.1}
                                            disabled={isTraining}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Agent Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Agent Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Learning Rate */}
                            <div className={styles.sliderContainer}>
                                <div className={styles.sliderLabel}>
                                    <span>Learning Rate</span>
                                    <span className="font-medium">{agentConfig.learningRate.toFixed(4)}</span>
                                </div>
                                <CustomSlider
                                    value={agentConfig.learningRate * 1000}
                                    onChange={(value) => setAgentConfig({...agentConfig, learningRate: value / 1000})}
                                    min={0.1}
                                    max={10}
                                    step={0.1}
                                    disabled={isTraining}
                                />
                            </div>

                            {/* Batch Size */}
                            <div className={styles.sliderContainer}>
                                <div className={styles.sliderLabel}>
                                    <span>Batch Size</span>
                                    <span>{agentConfig.batchSize}</span>
                                </div>
                                <CustomSlider
                                    value={agentConfig.batchSize}
                                    onChange={(value) => setAgentConfig({...agentConfig, batchSize: value})}
                                    min={16}
                                    max={256}
                                    step={16}
                                    disabled={isTraining}
                                />
                            </div>

                            {/* Gamma */}
                            <div className={styles.sliderContainer}>
                                <div className={styles.sliderLabel}>
                                    <span>Gamma (Discount)</span>
                                    <span>{agentConfig.gamma}</span>
                                </div>
                                <CustomSlider
                                    value={agentConfig.gamma * 100}
                                    onChange={(value) => setAgentConfig({...agentConfig, gamma: value / 100})}
                                    min={80}
                                    max={100}
                                    step={1}
                                    disabled={isTraining}
                                />
                            </div>

                            {/* Epsilon Decay */}
                            <div className={styles.sliderContainer}>
                                <div className={styles.sliderLabel}>
                                    <span>Epsilon Decay</span>
                                    <span>{agentConfig.epsilonDecay}</span>
                                </div>
                                <CustomSlider
                                    value={agentConfig.epsilonDecay * 100}
                                    onChange={(value) => setAgentConfig({...agentConfig, epsilonDecay: value / 100})}
                                    min={90}
                                    max={100}
                                    step={1}
                                    disabled={isTraining}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Training Settings */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Training Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={styles.sliderContainer}>
                            <div className={styles.sliderLabel}>
                                <span>Episodes</span>
                                <span>{trainingConfig.episodes}</span>
                            </div>
                            <CustomSlider
                                value={trainingConfig.episodes}
                                onChange={(value) => setTrainingConfig({...trainingConfig, episodes: value})}
                                min={100}
                                max={2000}
                                step={100}
                                disabled={isTraining}
                            />
                        </div>

                        <div className={styles.sliderContainer}>
                            <div className={styles.sliderLabel}>
                                <span>Render Every</span>
                                <span>{trainingConfig.renderEvery}</span>
                            </div>
                            <CustomSlider
                                value={trainingConfig.renderEvery}
                                onChange={(value) => setTrainingConfig({...trainingConfig, renderEvery: value})}
                                min={1}
                                max={100}
                                step={1}
                                disabled={isTraining}
                            />
                            <span className="text-sm text-gray-500 mt-1 block">
                                Lower values will show more frequent updates but may slow down training
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className={styles.grid2Cols}>
                {/* Training Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle>Training Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.chartContainer}>
                            <LineChart width={800} height={400} data={trainingData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="episode" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="loss"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </div>
                    </CardContent>
                </Card>

                {/* Environment State */}
                <Card>
                    <CardHeader>
                        <CardTitle>Environment State</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <EnvironmentView
                            gridState={gridState}
                            size={envConfig.size}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Training Controls */}
            <div className="flex flex-col items-center gap-6">
                <Button
                    className={`${styles.button} ${isTraining ? styles.stop : ''}`}
                    onClick={isTraining ? stopTraining : handleStartTraining}
                    disabled={status === 'error'}
                >
                    {isTraining ? 'Stop Training' : 'Start Training'}
                </Button>

                <Alert className={styles.statusBar}>
                    <AlertDescription>
                        {isTraining ? 'Training in progress...' : 'Ready to train'}
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
};

export default RLConfigInterface;