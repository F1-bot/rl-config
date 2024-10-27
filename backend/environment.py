import numpy as np
import random
from typing import List, Tuple, Dict

class SimplifiedGameEnv:
    def __init__(self, size: int = 6, n_coins: int = 1, n_obstacles: int = 2,
                 dynamic_obstacles: bool = False, rewards: dict = None):
        self.size = size
        self.n_coins = n_coins
        self.n_obstacles = n_obstacles
        self.dynamic_obstacles = dynamic_obstacles
        self.rewards = rewards or {
            'coinCollected': 1,
            'collision': -1,
            'step': -0.01,
            'completion': 2,
            'timeout': -0.5
        }
        self.action_space_n = 8
        self.observation_space_shape = (7, size, size)
        self.max_steps = size * size
        self.steps = 0
        self.grid = np.zeros((7, size, size))
        self.score = 0
        self.reset()

    def reset(self):
        self.steps = 0
        self.score = 0
        self.grid.fill(0)

        # Розміщення агента в центрі
        self.agent_pos = [self.size // 2, self.size // 2]

        # Розміщення монет та перешкод
        self.coins = []
        self.obstacles = []
        self._place_objects(self.coins, self.n_coins)
        self._place_objects(self.obstacles, self.n_obstacles)

        self.update_grid()
        return self.get_state()

    def _place_objects(self, objects: List, count: int) -> None:
        # Створюємо список всіх можливих позицій
        available_positions = []
        for i in range(self.size):
            for j in range(self.size):
                if ([i, j] != self.agent_pos and
                        [i, j] not in self.coins and
                        [i, j] not in self.obstacles):
                    available_positions.append([i, j])

        # Вибираємо випадкові позиції
        n_positions = min(count, len(available_positions))
        if n_positions > 0:
            selected_positions = random.sample(available_positions, n_positions)
            objects.extend(selected_positions)

    def update_grid(self) -> None:
        self.grid.fill(0)

        # Базові канали
        self.grid[0, self.agent_pos[0], self.agent_pos[1]] = 1
        for coin in self.coins:
            self.grid[1, coin[0], coin[1]] = 1
        for obs in self.obstacles:
            self.grid[2, obs[0], obs[1]] = 1

        # Distance map для монет
        if self.coins:
            for i in range(self.size):
                for j in range(self.size):
                    min_dist = min(abs(i - coin[0]) + abs(j - coin[1])
                                 for coin in self.coins)
                    self.grid[3, i, j] = 1 - min_dist / (2 * self.size)

        # Вільний простір
        self.grid[4] = 1 - (self.grid[0] + self.grid[1] + self.grid[2])

        # Додаємо напрямки до найближчої монети
        if self.coins:
            closest_coin = min(self.coins,
                             key=lambda c: abs(c[0] - self.agent_pos[0]) +
                                         abs(c[1] - self.agent_pos[1]))
            dx = closest_coin[0] - self.agent_pos[0]
            dy = closest_coin[1] - self.agent_pos[1]
            dist = max(abs(dx), abs(dy), 1)
            self.grid[5].fill(dx / dist)
            self.grid[6].fill(dy / dist)

    def get_state(self) -> np.ndarray:
        return self.grid.copy()

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict]:
        self.steps += 1
        old_pos = self.agent_pos.copy()

        # Рух агента
        moves = [(-1, 0), (-1, 1), (0, 1), (1, 1),
                (1, 0), (1, -1), (0, -1), (-1, -1)]
        dx, dy = moves[action]
        self.agent_pos[0] = np.clip(self.agent_pos[0] + dx, 0, self.size - 1)
        self.agent_pos[1] = np.clip(self.agent_pos[1] + dy, 0, self.size - 1)

        # Перевірка колізій та винагород
        if self.agent_pos in self.obstacles:
            self.agent_pos = old_pos
            reward = self.rewards['collision']
            done = False
        else:
            reward = self.rewards['step']
            done = False

            # Збір монет
            if self.agent_pos in self.coins:
                self.coins.remove(self.agent_pos)
                reward = self.rewards['coinCollected']
                self.score += 1
                if not self.coins:
                    reward += self.rewards['completion']
                    done = True

            # Перевірка ліміту кроків
            if self.steps >= self.max_steps:
                reward += self.rewards['timeout']
                done = True

        # Динамічні перешкоди
        if self.dynamic_obstacles and not done and random.random() < 0.1:
            self._update_dynamic_obstacles()

        self.update_grid()
        info = {
            "score": self.score,
            "steps": self.steps,
            "coins_left": len(self.coins)
        }

        return self.get_state(), reward, done, False, info

    def _update_dynamic_obstacles(self):
        # Рухаємо кожну перешкоду з певною ймовірністю
        for i, obs in enumerate(self.obstacles):
            if random.random() < 0.3:  # 30% шанс руху
                possible_moves = [
                    (dx, dy) for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]
                    if 0 <= obs[0] + dx < self.size and 0 <= obs[1] + dy < self.size
                ]
                if possible_moves:
                    dx, dy = random.choice(possible_moves)
                    new_pos = [obs[0] + dx, obs[1] + dy]
                    # Перевіряємо, чи нова позиція не зайнята
                    if (new_pos != self.agent_pos and
                        new_pos not in self.coins and
                        new_pos not in self.obstacles):
                        self.obstacles[i] = new_pos

    def render(self) -> None:
        grid = [[' ' for _ in range(self.size)] for _ in range(self.size)]

        for obs in self.obstacles:
            grid[obs[0]][obs[1]] = 'X'
        for coin in self.coins:
            grid[coin[0]][coin[1]] = 'O'
        grid[self.agent_pos[0]][self.agent_pos[1]] = 'A'

        print("\n".join([''.join(row) for row in grid]))
        print(f"Score: {self.score}, Steps: {self.steps}")