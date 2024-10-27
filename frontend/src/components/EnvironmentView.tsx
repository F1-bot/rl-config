import React from 'react';
import styles from '@/styles/RLConfig.module.css';

type EnvironmentViewProps = {
    gridState: number[][][];
    size: number;
};

const EnvironmentView: React.FC<EnvironmentViewProps> = ({ gridState, size }) => {
    const grid = Array(size).fill(0).map(() => Array(size).fill(null));

    if (gridState && gridState.length > 0 && gridState[0] &&
        gridState[0].length === size && gridState[0][0].length === size) {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                try {
                    if (gridState[0][i][j] === 1) grid[i][j] = 'agent';
                    else if (gridState[1][i][j] === 1) grid[i][j] = 'coin';
                    else if (gridState[2][i][j] === 1) grid[i][j] = 'obstacle';
                } catch (error) {
                    console.warn('Error accessing gridState:', error);
                }
            }
        }
    }

    const gridSize = Math.min(400, window.innerWidth - 40); // Максимальний розмір сітки
    const cellSize = Math.floor(gridSize / size); // Розмір комірки

    return (
        <div className={styles.environmentView}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
                    gap: '1px',
                    padding: '1px',
                    background: '#e2e8f0',
                    borderRadius: '0.5rem',
                    width: 'fit-content',
                    margin: '0 auto',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
            >
                {grid.map((row, i) =>
                    row.map((cell, j) => (
                        <div
                            key={`${i}-${j}`}
                            className={`${styles.envCell} ${
                                cell === 'agent' ? styles.envAgent :
                                    cell === 'coin' ? styles.envCoin :
                                        cell === 'obstacle' ? styles.envObstacle : ''
                            }`}
                            style={{
                                width: `${cellSize}px`,
                                height: `${cellSize}px`,
                                backgroundColor: cell ? undefined : 'white',
                                fontSize: `${Math.max(cellSize * 0.5, 12)}px`
                            }}
                        >
                            {cell === 'agent' ? '🤖' :
                                cell === 'coin' ? '💰' :
                                    cell === 'obstacle' ? '🚫' : ''}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EnvironmentView;