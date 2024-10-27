# optimized_environment.py
import numpy as np
from environment import EnhancedGameEnv


class SimplifiedGameEnv(EnhancedGameEnv):
    def __init__(self, size: int = 6, n_coins: int = 1, n_obstacles: int = 2):
        super().__init__(size, n_coins, n_obstacles, dynamic_obstacles=False)
        self.prev_coin_distance = None
        self.steps_without_improvement = 0
        self.max_steps = size * size  # Зменшуємо максимальну кількість кроків

    def _get_closest_coin_distance(self):
        if not self.coins:
            return 0
        return min(abs(self.agent_pos[0] - coin[0]) + abs(self.agent_pos[1] - coin[1])
                   for coin in self.coins)

    def _get_normalized_direction_to_coin(self):
        if not self.coins:
            return [0, 0]
        closest_coin = min(self.coins, key=lambda c: abs(c[0] - self.agent_pos[0]) + abs(c[1] - self.agent_pos[1]))
        dx = closest_coin[0] - self.agent_pos[0]
        dy = closest_coin[1] - self.agent_pos[1]
        dist = max(abs(dx), abs(dy), 1)
        return [dx / dist, dy / dist]

    def reset(self):
        state = super().reset()
        self.prev_coin_distance = self._get_closest_coin_distance()
        self.steps_without_improvement = 0
        return self._get_enhanced_state()

    def _get_enhanced_state(self):
        # Додаємо нормалізований вектор напрямку до монети
        direction = self._get_normalized_direction_to_coin()

        # Створюємо спрощений стан
        state = np.zeros((7, self.size, self.size))
        state[0:5] = self.grid  # Оригінальні канали

        # Додаємо канали з напрямком до монети
        state[5].fill(direction[0])
        state[6].fill(direction[1])

        return state

    def step(self, action):
        old_distance = self._get_closest_coin_distance()
        old_pos = self.agent_pos.copy()

        _, _, done, truncated, info = super().step(action)
        new_distance = self._get_closest_coin_distance()

        # Розрахунок винагороди
        reward = 0

        # Базова винагорода за рух до цілі
        distance_improvement = old_distance - new_distance
        reward += distance_improvement * 2.0

        # Велика винагорода за збір монети
        if len(self.coins) < info['coins_left']:
            reward += 20.0
            self.steps_without_improvement = 0

        # Штраф за зіткнення
        if self.agent_pos == old_pos and self.agent_pos in self.obstacles:
            reward -= 2.0
            done = True  # Завершуємо епізод при зіткненні

        # Перевірка прогресу
        if distance_improvement <= 0:
            self.steps_without_improvement += 1
        else:
            self.steps_without_improvement = 0

        # Завершуємо епізод, якщо довго немає прогресу
        if self.steps_without_improvement > self.size * 2:
            done = True
            reward -= 5.0

        # Завершуємо епізод при досягненні максимальної кількості кроків
        if self.steps >= self.max_steps:
            done = True
            reward -= 5.0

        return self._get_enhanced_state(), reward, done, truncated, info


class MultiCoinGameEnv(EnhancedGameEnv):
    def __init__(self, size: int = 6, n_coins: int = 3, n_obstacles: int = 2):
        # Ініціалізуємо власні змінні перед викликом батьківського конструктора
        self.initial_coins = n_coins
        self.prev_coin_distances = None
        self.steps_without_coin = 0

        # Викликаємо батьківський конструктор
        super().__init__(size, n_coins, n_obstacles, dynamic_obstacles=False)

        # Встановлюємо максимальну кількість кроків
        self.max_steps = size * size * n_coins

    def _get_all_coin_distances(self):
        if not self.coins:
            return [0]
        distances = []
        for coin in self.coins:
            dist = abs(self.agent_pos[0] - coin[0]) + abs(self.agent_pos[1] - coin[1])
            distances.append(dist)
        return distances

    def _get_coin_directions(self):
        if not self.coins:
            return np.zeros((self.size, self.size, 2))

        directions = np.zeros((self.size, self.size, 2))
        for coin in self.coins:
            dx = coin[0] - self.agent_pos[0]
            dy = coin[1] - self.agent_pos[1]
            dist = max(abs(dx), abs(dy), 1)
            directions[:, :, 0] += dx / dist
            directions[:, :, 1] += dy / dist

        return directions

    def reset(self):
        _ = super().reset()
        self.prev_coin_distances = self._get_all_coin_distances()
        self.steps_without_coin = 0
        return self._get_enhanced_state()

    def _get_enhanced_state(self):
        # Базовий стан
        state = np.zeros((8, self.size, self.size))
        state[0:5] = self.grid

        # Додаємо інформацію про напрямки до монет
        directions = self._get_coin_directions()
        state[5] = directions[:, :, 0]  # X-напрямок
        state[6] = directions[:, :, 1]  # Y-напрямок

        # Додаємо канал з прогресом збору монет
        coins_collected = self.initial_coins - len(self.coins)
        state[7].fill(coins_collected / self.initial_coins)

        return state

    def step(self, action):
        old_distances = self._get_all_coin_distances()
        old_pos = self.agent_pos.copy()
        old_coins = len(self.coins)

        _, _, done, truncated, info = super().step(action)
        new_distances = self._get_all_coin_distances()

        # Розрахунок винагороди
        reward = 0

        # Винагорода за збір монети
        coins_collected = old_coins - len(self.coins)
        if coins_collected > 0:
            reward += 20.0  # Базова винагорода за монету
            reward += 10.0 * (self.initial_coins - len(self.coins))  # Додаткова винагорода за прогрес
            self.steps_without_coin = 0

        # Винагорода за наближення до найближчої монети
        if new_distances:
            min_old = min(old_distances)
            min_new = min(new_distances)
            distance_improvement = min_old - min_new
            reward += distance_improvement * 2.0

        # Штрафи
        if self.agent_pos == old_pos and self.agent_pos in self.obstacles:
            reward -= 5.0
            done = True

        # Перевірка прогресу
        if not coins_collected:
            self.steps_without_coin += 1
            if self.steps_without_coin > self.size * 3:
                reward -= 1.0

        # Умови завершення епізоду
        if len(self.coins) == 0:  # Всі монети зібрані
            reward += 50.0
            done = True
        elif self.steps >= self.max_steps:  # Перевищено ліміт кроків
            reward -= 10.0
            done = True

        return self._get_enhanced_state(), reward, done, truncated, info