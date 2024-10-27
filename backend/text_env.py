# test_env.py
from environment import SimplifiedGameEnv

# Створюємо середовище
env = SimplifiedGameEnv(size=6, n_coins=1, n_obstacles=2)

# Тестуємо reset
state = env.reset()
print("Reset successful")
print("State shape:", state.shape)

# Тестуємо step
next_state, reward, done, truncated, info = env.step(0)
print("Step successful")
print("Reward:", reward)
print("Info:", info)

# Тестуємо render
env.render()