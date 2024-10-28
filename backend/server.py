from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import json
import logging
import asyncio
import time
from environment import SimplifiedGameEnv
from agent import SimplifiedAgent

class TrainingStats:
    def __init__(self):
        self.start_time = None
        self.total_steps = 0
        self.best_reward = float('-inf')
        self.total_reward = 0
        self.episode_count = 0

    def start(self):
        self.start_time = time.time()

    def update(self, reward, steps):
        self.total_steps += steps
        self.total_reward += reward
        self.episode_count += 1
        self.best_reward = max(self.best_reward, reward)

    @property
    def average_reward(self):
        return self.total_reward / max(1, self.episode_count)

    @property
    def training_time(self):
        if self.start_time is None:
            return 0
        return int(time.time() - self.start_time)

    @property
    def steps_per_second(self):
        training_time = self.training_time
        if training_time == 0:
            return 0.0
        return self.total_steps / training_time

    def get_stats(self):
        return {
            "averageReward": round(self.average_reward, 3),
            "trainingTime": self.format_time(self.training_time),
            "bestReward": round(self.best_reward, 3),
            "stepsPerSecond": round(self.steps_per_second, 1)
        }

    @staticmethod
    def format_time(seconds):
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        seconds = seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.websocket("/ws/train")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("Receiving websocket connection...")
    await websocket.accept()
    logger.info("Websocket connection accepted")

    try:
        # Отримуємо конфігурацію
        config = await websocket.receive_json()
        logger.info(f"Received config: {config}")

        # Створюємо середовище і агента
        env = SimplifiedGameEnv(
            size=config['envConfig']['size'],
            n_coins=config['envConfig']['nCoins'],
            n_obstacles=config['envConfig']['nObstacles'],
            dynamic_obstacles=config['envConfig']['dynamicObstacles'],
            rewards=config['envConfig']['rewards']
        )

        agent = SimplifiedAgent(
            state_shape=(7, config['envConfig']['size'], config['envConfig']['size']),
            n_actions=8,
            learning_rate=config['agentConfig']['learningRate']
        )

        render_every = config['trainingConfig'].get('renderEvery', 50)
        logger.info(f"Render frequency: every {render_every} episodes")

        stats = TrainingStats()
        stats.start()

        # Цикл тренування
        for episode in range(config['trainingConfig']['episodes']):
            state = env.reset()
            total_reward = 0
            episode_losses = []
            done = False
            steps_in_episode = 0

            # Відправляємо початковий стан тільки для епізодів, які треба рендерити
            if episode % render_every == 0:
                await websocket.send_json({
                    "type": "state",
                    "data": env.grid.tolist()
                })

            while not done:
                action = agent.get_action(state)
                next_state, reward, done, _, info = env.step(action)

                agent.remember(state, action, reward, next_state, done)
                loss = agent.train()

                if loss is not None:
                    episode_losses.append(float(loss))

                state = next_state
                total_reward += reward
                steps_in_episode += 1

                # Відправляємо оновлений стан тільки для епізодів, які треба рендерити
                if episode % render_every == 0:
                    await websocket.send_json({
                        "type": "state",
                        "data": env.grid.tolist()
                    })
                    # Затримка тільки при візуалізації
                    await asyncio.sleep(0.05)

            # Оновлюємо статистику і epsilon
            stats.update(total_reward, steps_in_episode)
            agent.update_epsilon()
            avg_loss = np.mean(episode_losses) if episode_losses else 0.0

            await websocket.send_json({
                "type": "progress",
                "data": {
                    "episode": episode,
                    "score": float(total_reward),
                    "loss": float(avg_loss),
                    "epsilon": float(agent.epsilon),
                    "steps": steps_in_episode,
                    "stats": stats.get_stats()
                }
            })

            # Коротша затримка між епізодами, коли не рендеримо
            await asyncio.sleep(0.01 if episode % render_every != 0 else 0.1)

        # Повідомляємо про завершення тренування
        await websocket.send_json({
            "type": "complete",
            "data": "Training completed successfully"
        })

    except Exception as e:
        logger.error(f"Error during training: {str(e)}", exc_info=True)
        await websocket.send_json({
            "type": "error",
            "data": str(e)
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")