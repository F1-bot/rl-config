# Reinforcement Learning Training Interface

Interactive web interface for training and configuring Reinforcement Learning agents.

## Project Structure
```
rl-config/
├── backend/             # Python FastAPI backend
│   ├── init.py
│   ├── agent.py        # RL agent implementation
│   ├── environment.py  # Training environment
│   ├── server.py        # FastAPI server
│   ├── model.py       # Neural network models
│   └── utils.py       # Utility functions
├── frontend/           # Next.js frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── styles/    # CSS styles
│   │   └── types/     # TypeScript types
│   └── public/        # Static files
└── requirements.txt    # Python dependencies
```

## Requirements

- Git 2.47.0+
- Python 3.8+
- Node.js 16+
- npm 8+

## Installation

1. Clone the repository:
```bash
git clone https://github.com/F1-bot/rl-config.git
cd rl-config
```

2. Set up the Python backend:
# Create and activate virtual environment
```
python -m venv venv
```

# On Windows:
```
venv\Scripts\activate
```

# On Unix or MacOS:
```
source venv/bin/activate
```

# Install dependencies
```
pip install -r requirements.txt
```

# Start the backend server
```
cd backend
python server.py
```

3. Set up the frontend:
# Install dependencies
```
cd frontend
npm install
```

# Start the development server
```
npm run dev
```

4. Open the web interface in your browser:
```
http://localhost:3000
```

# Usage

### Configure environment settings:

1. Grid Size (4-12)
2. Number of Coins (1-5)
3. Number of Obstacles (0-8)
4. Dynamic Obstacles option


### Adjust agent parameters:

1. Learning Rate 
2. Batch Size 
3. Gamma (Discount)
4. Epsilon Decay


### Set training parameters:

1. Number of Episodes 
2. Render Frequency


### Click "Start Training" to begin the training process


# Development
### To run the project in development mode:

### Start the backend server:
```bash
cd backend
python main.py
```

### In a separate terminal, start the frontend development server:

```bash
cd frontend
npm run dev
```
