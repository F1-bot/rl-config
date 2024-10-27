# train.py
import time
import matplotlib.pyplot as plt
import numpy as np
from environment import EnhancedGameEnv
from agent import Agent
from utils import DEVICE, setup_cuda, set_seed
from plot_results import plot_results, create_live_plot, update_live_plot


def train(env, agent, episodes=500, render_every=50):
    scores = []
    losses = []

    # Створюємо живий графік
    fig, lines = create_live_plot()

    for episode in range(episodes):
        state = env.reset()
        total_reward = 0
        episode_losses = []

        while True:
            if episode % render_every == 0:
                env.render()

            action = agent.get_action(state)
            next_state, reward, done, _, info = env.step(action)

            agent.remember(state, action, reward, next_state, done)
            loss = agent.train()

            if loss is not None:
                episode_losses.append(loss)

            state = next_state
            total_reward += reward

            if done:
                break

        agent.update_epsilon()
        scores.append(total_reward)
        if episode_losses:
            losses.append(np.mean(episode_losses))

        # Оновлюємо живий графік
        update_live_plot(fig, lines, scores, losses)

        if episode % 10 == 0:
            avg_score = np.mean(scores[-100:]) if len(scores) >= 100 else np.mean(scores)
            print(f'Episode: {episode}, Score: {total_reward:.2f}, '
                  f'Average Score: {avg_score:.2f}, Epsilon: {agent.epsilon:.3f}')

    env.close()
    plt.close(fig)

    # Зберігаємо фінальні графіки
    plot_results(scores, losses)
    return scores, losses