# plot_results.py

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator
import seaborn as sns


def plot_results(scores, losses, window=10):
    """
    Покращена функція для візуалізації результатів тренування

    Args:
        scores: список оцінок за епізоди
        losses: список значень функції втрат
        window: розмір вікна для згладжування
    """
    # Створюємо вікно з графіками
    plt.figure(figsize=(15, 10))

    # Налаштування стилю
    sns.set_style("whitegrid")
    plt.rcParams['figure.facecolor'] = 'white'

    # Згладжування даних
    def smooth(data, window_size):
        return np.convolve(data, np.ones(window_size) / window_size, mode='valid')

    # Графік оцінок
    plt.subplot(2, 1, 1)
    episodes = range(len(scores))
    plt.plot(episodes, scores, 'b-', alpha=0.3, label='Raw scores')
    if len(scores) > window:
        smoothed_scores = smooth(scores, window)
        plt.plot(episodes[window - 1:], smoothed_scores, 'r-',
                 label=f'Smoothed scores (window={window})')

    plt.title('Training Progress - Scores', fontsize=12, pad=10)
    plt.xlabel('Episode')
    plt.ylabel('Score')
    plt.legend()
    plt.grid(True, alpha=0.3)

    # Графік функції втрат
    plt.subplot(2, 1, 2)
    if losses:
        episodes_loss = range(len(losses))
        plt.plot(episodes_loss, losses, 'g-', alpha=0.3, label='Raw loss')
        if len(losses) > window:
            smoothed_losses = smooth(losses, window)
            plt.plot(episodes_loss[window - 1:], smoothed_losses, 'm-',
                     label=f'Smoothed loss (window={window})')

        plt.title('Training Progress - Loss', fontsize=12, pad=10)
        plt.xlabel('Episode')
        plt.ylabel('Loss')
        plt.legend()
        plt.grid(True, alpha=0.3)

    # Додаткова інформація
    plt.figtext(0.02, 0.02, f'Total episodes: {len(scores)}\n' +
                f'Final score: {scores[-1]:.2f}\n' +
                f'Best score: {max(scores):.2f}\n' +
                f'Average score: {np.mean(scores):.2f}',
                fontsize=10, bbox=dict(facecolor='white', alpha=0.8))

    # Зберігаємо та показуємо графіки
    plt.tight_layout()
    plt.savefig('training_results.png', dpi=300, bbox_inches='tight')
    plt.show()
    plt.close()


# Додаємо функцію для живого оновлення графіків
def create_live_plot():
    """Створює живий графік для відображення процесу навчання"""
    plt.ion()  # Включаємо інтерактивний режим
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))

    line1, = ax1.plot([], [], 'b-', label='Score')
    line2, = ax1.plot([], [], 'r-', label='Average Score')
    ax1.set_title('Training Progress - Score')
    ax1.set_xlabel('Episode')
    ax1.set_ylabel('Score')
    ax1.grid(True)
    ax1.legend()

    line3, = ax2.plot([], [], 'g-', label='Loss')
    ax2.set_title('Training Progress - Loss')
    ax2.set_xlabel('Episode')
    ax2.set_ylabel('Loss')
    ax2.grid(True)
    ax2.legend()

    plt.tight_layout()
    return fig, (line1, line2, line3)


def update_live_plot(fig, lines, scores, losses, window=100):
    """Оновлює живий графік"""
    line1, line2, line3 = lines
    episodes = list(range(len(scores)))

    # Оновлюємо графік оцінок
    line1.set_data(episodes, scores)

    # Оновлюємо графік середніх оцінок
    if len(scores) >= window:
        avg_scores = [np.mean(scores[max(0, i - window):i]) for i in range(1, len(scores) + 1)]
        line2.set_data(episodes, avg_scores)

    # Оновлюємо графік втрат
    if losses:
        line3.set_data(range(len(losses)), losses)

    # Оновлюємо межі осей
    for ax in fig.axes:
        ax.relim()
        ax.autoscale_view()

    fig.canvas.draw()
    fig.canvas.flush_events()