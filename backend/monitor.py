# monitor.py
import numpy as np
import matplotlib.pyplot as plt
from collections import deque
import time
import wandb
import seaborn as sns
from IPython.display import clear_output
import torch
import torch.optim as optim
from agent import Agent, ReplayBuffer


class RLMonitor:
    def __init__(self, window_size=100):
        self.window_size = window_size
        self.scores_window = deque(maxlen=window_size)
        self.losses_window = deque(maxlen=window_size)
        self.rewards_window = deque(maxlen=window_size)
        self.steps_window = deque(maxlen=window_size)

        self.scores = []
        self.losses = []
        self.avg_scores = []
        self.epsilons = []
        self.steps = []
        self.rewards = []

        # Performance metrics
        self.training_start = time.time()
        self.episode_times = deque(maxlen=window_size)

        # Initialize plots
        plt.ion()
        self.fig = plt.figure(figsize=(15, 10))
        self.initialize_plots()

    def initialize_plots(self):
        self.fig.clear()
        # Create subplots
        self.ax_score = self.fig.add_subplot(321)
        self.ax_loss = self.fig.add_subplot(322)
        self.ax_steps = self.fig.add_subplot(323)
        self.ax_reward = self.fig.add_subplot(324)
        self.ax_epsilon = self.fig.add_subplot(325)
        self.ax_heatmap = self.fig.add_subplot(326)

        # Set titles and labels
        self.ax_score.set_title('Training Score')
        self.ax_loss.set_title('Loss')
        self.ax_steps.set_title('Steps per Episode')
        self.ax_reward.set_title('Average Reward')
        self.ax_epsilon.set_title('Epsilon Value')
        self.ax_heatmap.set_title('Action Distribution')

        plt.tight_layout()

    def update(self, episode, score, loss, epsilon, steps, rewards, action_dist=None):
        # Update windows
        self.scores_window.append(score)
        if loss is not None:
            self.losses_window.append(loss)
        self.steps_window.append(steps)
        self.rewards_window.append(np.mean(rewards))

        # Update lists
        self.scores.append(score)
        self.losses.append(loss if loss is not None else 0)
        self.avg_scores.append(np.mean(self.scores_window))
        self.epsilons.append(epsilon)
        self.steps.append(steps)
        self.rewards.append(np.mean(rewards))

        # Update plots
        self.update_plots(episode, action_dist)

    def update_plots(self, episode, action_dist=None):
        self.fig.clear()
        self.initialize_plots()

        # Plot scores
        self.ax_score.plot(self.scores, alpha=0.6, label='Score')
        self.ax_score.plot(self.avg_scores, label='Average Score')
        self.ax_score.legend()

        # Plot losses
        if self.losses:
            self.ax_loss.plot(self.losses, alpha=0.6)

        # Plot steps
        self.ax_steps.plot(self.steps, alpha=0.6)

        # Plot rewards
        self.ax_reward.plot(self.rewards, alpha=0.6)

        # Plot epsilon
        self.ax_epsilon.plot(self.epsilons, alpha=0.6)

        # Plot action distribution heatmap
        if action_dist is not None:
            sns.heatmap(action_dist.reshape(1, -1),
                        ax=self.ax_heatmap,
                        cmap='YlOrRd',
                        cbar=True)
            self.ax_heatmap.set_xlabel('Action')

        plt.pause(0.1)

    def get_stats(self):
        return {
            'avg_score': np.mean(self.scores_window),
            'avg_loss': np.mean(self.losses_window) if self.losses_window else 0,
            'avg_steps': np.mean(self.steps_window),
            'avg_reward': np.mean(self.rewards_window),
            'training_time': time.time() - self.training_start
        }


# Enhanced training function
def enhanced_train(env, agent, episodes=500, render_every=50):
    monitor = RLMonitor()
    action_distribution = np.zeros(env.action_space_n)
    best_score = float('-inf')

    for episode in range(episodes):
        state = env.reset()
        total_reward = 0
        episode_losses = []
        episode_rewards = []
        steps = 0

        while True:
            if episode % render_every == 0:
                env.render()

            # Get action and update distribution
            action = agent.get_action(state)
            action_distribution[action] += 1

            next_state, reward, done, _, info = env.step(action)

            # Store experience with N-step returns
            agent.remember(state, action, reward, next_state, done)

            # Train agent
            loss = agent.train()
            if loss is not None:
                episode_losses.append(loss)

            state = next_state
            total_reward += reward
            episode_rewards.append(reward)
            steps += 1

            if done:
                break

        # Update agent and monitoring
        agent.update_epsilon()
        avg_loss = np.mean(episode_losses) if episode_losses else None

        # Update monitoring system
        monitor.update(
            episode=episode,
            score=total_reward,
            loss=avg_loss,
            epsilon=agent.epsilon,
            steps=steps,
            rewards=episode_rewards,
            action_dist=action_distribution / action_distribution.sum()
        )

        # Save best model
        if total_reward > best_score:
            best_score = total_reward
            torch.save(agent.policy_net.state_dict(), 'best_model.pth')

        # Print progress
        if episode % 10 == 0:
            stats = monitor.get_stats()
            print(f"\nEpisode: {episode}")
            print(f"Score: {total_reward:.2f}")
            print(f"Average Score: {stats['avg_score']:.2f}")
            print(f"Steps: {steps}")
            print(f"Epsilon: {agent.epsilon:.3f}")
            print(f"Training Time: {stats['training_time']:.2f}s")

    env.close()
    return monitor.scores, monitor.losses


# Optimizations for the Agent class
class OptimizedAgent(Agent):
    def __init__(self, state_shape, n_actions, learning_rate=3e-4):
        super().__init__(state_shape, n_actions, learning_rate)

        # Enhanced hyperparameters
        self.batch_size = 256  # Increased batch size
        self.gamma = 0.99
        self.epsilon = 1.0
        self.epsilon_decay = 0.997  # Slower decay
        self.epsilon_min = 0.05  # Higher minimum exploration
        self.target_update = 5  # More frequent updates
        self.steps = 0

        # Prioritized Experience Replay
        self.memory = ReplayBuffer(100000)  # Larger buffer

        # Optimizer improvements
        self.optimizer = optim.AdamW(
            self.policy_net.parameters(),
            lr=learning_rate,
            amsgrad=True,
            weight_decay=1e-6
        )

        # Learning rate scheduler
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer,
            mode='max',
            factor=0.5,
            patience=20,
            verbose=True
        )