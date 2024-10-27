# utils.py
import torch
import torch.multiprocessing as mp
import random
import numpy as np
from collections import namedtuple
import time

# Constants
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
Experience = namedtuple('Experience', ['state', 'action', 'reward', 'next_state', 'done'])

def setup_cuda():
    """Enhanced CUDA setup with additional optimizations"""
    torch.backends.cudnn.benchmark = True
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True
    torch.backends.cudnn.deterministic = False
    torch.set_num_threads(mp.cpu_count())
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

def set_seed(seed: int = 42):
    """Enhanced seed setting for reproducibility"""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)