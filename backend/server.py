from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import json
import logging
import asyncio
from environment import SimplifiedGameEnv
from agent import SimplifiedAgent

# Налаштування логування
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

async def run_training_episode(env, agent, websocket):
    state = env.reset()
    total_reward = 0
    episode_losses = []
    done = False

    while not done:
        action = agent.get_action(state)
        next_state, reward, done, _, info = env.step(action)

        agent.remember(state, action, reward, next_state, done)
        loss = agent.train()

        if loss is not None:
            episode_losses.append(float(loss))

        state = next_state
        total_reward += reward

    return total_reward, np.mean(episode_losses) if episode_losses else 0.0

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

            # Оновлюємо epsilon і відправляємо прогрес
            agent.update_epsilon()
            avg_loss = np.mean(episode_losses) if episode_losses else 0.0

            await websocket.send_json({
                "type": "progress",
                "data": {
                    "episode": episode,
                    "score": float(total_reward),
                    "loss": float(avg_loss),
                    "epsilon": float(agent.epsilon),
                    "steps": steps_in_episode
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