"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { CustomSlider } from './CustomSlider';
// import { CustomSwitch } from './CustomSwitch';
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
                    <div className={`${styles.statusDot} ${styles[status.toLowerCase()]}`}/>
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

            <div className={styles.cardContainer}>
                {/* Environment Settings */}
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Environment Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={styles.settingsGrid}>
                                <div className={styles.settingItem}>
                                    <div className={styles.settingLabel}>
                                        <span className={styles.settingName}>Grid Size</span>
                                        <span className={styles.settingValue}>{envConfig.size}</span>
                                    </div>
                                    <CustomSlider
                                        value={envConfig.size}
                                        onChange={(value) => setEnvConfig({...envConfig, size: value})}
                                        min={4}
                                        max={12}
                                        step={1}
                                        disabled={isTraining}
                                    />
                                </div>

                                <div className={styles.settingItem}>
                                    <div className={styles.settingLabel}>
                                        <span className={styles.settingName}>Number of Coins</span>
                                        <span className={styles.settingValue}>{envConfig.nCoins}</span>
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

                                <div className={styles.settingItem}>
                                    <div className={styles.settingLabel}>
                                        <span className={styles.settingName}>Number of Obstacles</span>
                                        <span className={styles.settingValue}>{envConfig.nObstacles}</span>
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

                                <div className={styles.settingItem}>
                                    <div className={styles.switchContainer}>
                                        <label className={styles.switchLabel}>
                                            <span className={styles.switchText}>Dynamic Obstacles</span>
                                            <div className={styles.switchControl}>
                                                <input
                                                    type="checkbox"
                                                    checked={envConfig.dynamicObstacles}
                                                    onChange={(e) => setEnvConfig({
                                                        ...envConfig,
                                                        dynamicObstacles: e.target.checked
                                                    })}
                                                    disabled={isTraining}
                                                    className={styles.switchInput}
                                                />
                                                <div className={styles.switchTrack}/>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rewards Configuration as separate card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Rewards Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={styles.settingsGrid}>
                                <div className={styles.settingItem}>
                                    <div className={styles.settingLabel}>
                                        <span className={styles.settingName}>Coin Collected Reward</span>
                                        <span className={styles.settingValue}>{envConfig.rewards.coinCollected}</span>
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

                                <div className={styles.settingItem}>
                                    <div className={styles.settingLabel}>
                                        <span className={styles.settingName}>Collision Penalty</span>
                                        <span className={styles.settingValue}>{Math.abs(envConfig.rewards.collision)}</span>
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

                                <div className={styles.settingItem}>
                                    <div className={styles.settingLabel}>
                                        <span className={styles.settingName}>Step Penalty</span>
                                        <span className={styles.settingValue}>{envConfig.rewards.step}</span>
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

                                <div className={styles.settingItem}>
                                    <div className={styles.settingLabel}>
                                        <span className={styles.settingName}>Completion Reward</span>
                                        <span className={styles.settingValue}>{envConfig.rewards.completion}</span>
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

                                <div className={styles.settingItem}>
                                    <div className={styles.settingLabel}>
                                        <span className={styles.settingName}>Timeout Penalty</span>
                                        <span className={styles.settingValue}>{Math.abs(envConfig.rewards.timeout)}</span>
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
                        </CardContent>
                    </Card>
                </div>

                <div className={styles.cardContainer}>
                {/* Agent Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Agent Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.settingsGrid}>
                            <div className={styles.settingItem}>
                                <div className={styles.settingLabel}>
                                    <span className={styles.settingName}>Learning Rate</span>
                                    <span className={styles.settingValue}>{agentConfig.learningRate.toFixed(4)}</span>
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

                            <div className={styles.settingItem}>
                                <div className={styles.settingLabel}>
                                    <span className={styles.settingName}>Batch Size</span>
                                    <span className={styles.settingValue}>{agentConfig.batchSize}</span>
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

                            <div className={styles.settingItem}>
                                <div className={styles.settingLabel}>
                                    <span className={styles.settingName}>Gamma (Discount)</span>
                                    <span className={styles.settingValue}>{agentConfig.gamma}</span>
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

                            <div className={styles.settingItem}>
                                <div className={styles.settingLabel}>
                                    <span className={styles.settingName}>Initial Epsilon</span>
                                    <span className={styles.settingValue}>{agentConfig.epsilon.toFixed(2)}</span>
                                </div>
                                <CustomSlider
                                    value={agentConfig.epsilon * 100}
                                    onChange={(value) => setAgentConfig({...agentConfig, epsilon: value / 100})}
                                    min={0}
                                    max={100}
                                    step={5}
                                    disabled={isTraining}
                                />
                            </div>

                            <div className={styles.settingItem}>
                                <div className={styles.settingLabel}>
                                    <span className={styles.settingName}>Epsilon Decay</span>
                                    <span className={styles.settingValue}>{agentConfig.epsilonDecay}</span>
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

                            <div className={styles.settingItem}>
                                <div className={styles.settingLabel}>
                                    <span className={styles.settingName}>Minimum Epsilon</span>
                                    <span className={styles.settingValue}>{agentConfig.epsilonMin}</span>
                                </div>
                                <CustomSlider
                                    value={agentConfig.epsilonMin * 100}
                                    onChange={(value) => setAgentConfig({...agentConfig, epsilonMin: value / 100})}
                                    min={1}
                                    max={30}
                                    step={1}
                                    disabled={isTraining}
                                />
                            </div>

                            <div className={styles.settingItem}>
                                <div className={styles.settingLabel}>
                                    <span className={styles.settingName}>Memory Size</span>
                                    <span className={styles.settingValue}>{agentConfig.memorySize}</span>
                                </div>
                                <CustomSlider
                                    value={agentConfig.memorySize}
                                    onChange={(value) => setAgentConfig({...agentConfig, memorySize: value})}
                                    min={1000}
                                    max={50000}
                                    step={1000}
                                    disabled={isTraining}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </div>

                {/* Training Settings */}
                <div className={styles.cardContainer}>
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Training Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.settingsGrid}>
                            <div className={styles.settingItem}>
                                <div className={styles.settingLabel}>
                                    <span className={styles.settingName}>Episodes</span>
                                    <span className={styles.settingValue}>{trainingConfig.episodes}</span>
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

                            <div className={styles.settingItem}>
                                <div className={styles.settingLabel}>
                                    <span className={styles.settingName}>Render Every</span>
                                    <span className={styles.settingValue}>{trainingConfig.renderEvery}</span>
                                </div>
                                <CustomSlider
                                    value={trainingConfig.renderEvery}
                                    onChange={(value) => setTrainingConfig({...trainingConfig, renderEvery: value})}
                                    min={1}
                                    max={100}
                                    step={1}
                                    disabled={isTraining}
                                />
                                <div className={styles.settingHint}>
                                    Lower values will show more frequent updates but may slow down training
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            </div>

            <div className={styles.grid2Cols}>
                {/* Training Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle>Training Progress</CardTitle>
                    </CardHeader>
                    <CardContent>

                        {/* Stats Display */}
                        <div className={styles.statsGrid}>
                            <div className={styles.statItem}>
                                <div className={styles.statLabel}>Average Reward</div>
                                <div className={`${styles.statValue} ${styles.reward}`}>
                                    {trainingData[trainingData.length - 1]?.stats?.averageReward?.toFixed(3) || "0.000"}
                                </div>
                            </div>

                            <div className={styles.statItem}>
                                <div className={styles.statLabel}>Training Time</div>
                                <div className={`${styles.statValue} ${styles.time}`}>
                                    {trainingData[trainingData.length - 1]?.stats?.trainingTime || "00:00:00"}
                                </div>
                            </div>

                            <div className={styles.statItem}>
                                <div className={styles.statLabel}>Best Reward</div>
                                <div className={`${styles.statValue} ${styles.best}`}>
                                    {trainingData[trainingData.length - 1]?.stats?.bestReward?.toFixed(3) || "0.000"}
                                </div>
                            </div>

                            <div className={styles.statItem}>
                                <div className={styles.statLabel}>Steps/Second</div>
                                <div className={`${styles.statValue} ${styles.steps}`}>
                                    {trainingData[trainingData.length - 1]?.stats?.stepsPerSecond?.toFixed(1) || "0.0"}
                                </div>
                            </div>
                        </div>

                        <div className={styles.chartContainer}>
                            <LineChart width={window.innerWidth < 768 ? 300 : 800} height={400} data={trainingData} className={styles.chart}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="episode"/>
                                <YAxis yAxisId="left"/>
                                <YAxis yAxisId="right" orientation="right"/>
                                <Tooltip/>
                                <Legend/>
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
                <button
                    className={`${styles.trainingButton} ${
                        isTraining ? styles.stopTraining : styles.startTraining
                    }`}
                    onClick={isTraining ? stopTraining : handleStartTraining}
                    disabled={status === 'error'}

                >
                    {isTraining ? (
                        <>
                            <span className={styles.buttonIcon}></span>
                            Stop Training
                        </>
                    ) : (
                        <>
                            <span className={styles.buttonIcon}></span>
                            Start Training
                        </>
                    )}
                </button>

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