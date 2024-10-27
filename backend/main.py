from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import logging
from environment import SimplifiedGameEnv
from agent import SimplifiedAgent

# Налаштування логування
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# Налаштування CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/train")
async def train(websocket: WebSocket):
    logger.info("New WebSocket connection attempt")
    try:
        await websocket.accept()
        logger.info("WebSocket connection accepted")

        try:
            # Очікуємо конфігурацію
            config_str = await websocket.receive_text()
            logger.info(f"Received configuration: {config_str}")
            config = json.loads(config_str)

            # Створюємо середовище
            env = SimplifiedGameEnv(
                size=config['envConfig']['size'],
                n_coins=config['envConfig']['nCoins'],
                n_obstacles=config['envConfig']['nObstacles']
            )
            logger.info("Environment created successfully")

            # Створюємо агента
            agent = SimplifiedAgent(
                state_shape=(7, config['envConfig']['size'], config['envConfig']['size']),
                n_actions=8,
                learning_rate=config['agentConfig']['learningRate']
            )
            logger.info("Agent created successfully")

            # Надсилаємо підтвердження
            await websocket.send_json({
                "type": "status",
                "data": "Training initialized successfully"
            })

            # Цикл тренування
            for episode in range(config['trainingConfig']['episodes']):
                logger.info(f"Starting episode {episode}")

                state = env.reset()
                total_reward = 0
                episode_losses = []

                while True:
                    action = agent.get_action(state)
                    next_state, reward, done, _, info = env.step(action)

                    agent.remember(state, action, reward, next_state, done)
                    loss = agent.train()

                    if loss is not None:
                        episode_losses.append(float(loss))

                    state = next_state
                    total_reward += reward

                    if done:
                        break

                agent.update_epsilon()
                avg_loss = sum(episode_losses) / len(episode_losses) if episode_losses else 0

                # Відправляємо прогрес
                await websocket.send_json({
                    "type": "progress",
                    "data": {
                        "episode": episode,
                        "score": float(total_reward),
                        "loss": float(avg_loss),
                        "epsilon": float(agent.epsilon)
                    }
                })

                # Відправляємо стан середовища
                if episode % config['trainingConfig']['renderEvery'] == 0:
                    await websocket.send_json({
                        "type": "state",
                        "data": env.grid.tolist()
                    })

                # Затримка для стабільності
                await asyncio.sleep(0.01)

            # Завершення тренування
            await websocket.send_json({
                "type": "complete",
                "data": "Training completed successfully"
            })

        except WebSocketDisconnect:
            logger.warning("Client disconnected")
        except Exception as e:
            logger.error(f"Error during training: {str(e)}", exc_info=True)
            await websocket.send_json({
                "type": "error",
                "data": str(e)
            })

    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}", exc_info=True)
    finally:
        logger.info("WebSocket connection closed")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug")