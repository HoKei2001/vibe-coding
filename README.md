# Huddle Up

A modern team collaboration chat application inspired by Slack, built with Python FastAPI backend and React TypeScript frontend.

## 🚀 Features

- **Team Management**: Create teams and invite members
- **Channel Organization**: Organize conversations into focused channels
- **Real-time Messaging**: Instant messaging with WebSocket support
- **Modern UI**: Clean, responsive interface built with React
- **Secure Authentication**: JWT-based authentication system

## 🏗️ Architecture

### Backend (Python)
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Primary database
- **WebSocket**: Real-time communication
- **JWT**: Authentication
- **Poetry**: Dependency management

### Frontend (Node.js)
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Modern tooling**: ESLint, Prettier, etc.

## 🛠️ Development Setup

This project uses DevContainers for a consistent development environment with python-user 24.04, Python 3.12, Node.js 18, and zsh.

### Prerequisites
- Docker & Docker Compose
- VS Code with Dev Containers extension

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd huddle-up
   ```

2. **Open in DevContainer**
   - Open VS Code
   - Press `F1` and run "Dev Containers: Open Folder in Container"
   - Select this project folder
   - Wait for the container to build (first time may take 5-10 minutes)

3. **Setup environment variables**
   ```bash
   # Backend
   cp huddle-up-backend/.env.example huddle-up-backend/.env
   
   # Frontend  
   cp huddle-up-frontend/.env.example huddle-up-frontend/.env
   ```

4. **Run the application**
   ```bash
   # Backend (Terminal 1)
   backend  # alias to cd /opt/python-user/code/huddle-up-backend
   poetry run uvicorn main:app --reload --host 0.0.0.0
   
   # Frontend (Terminal 2)
   frontend  # alias to cd /opt/python-user/code/huddle-up-frontend  
   npm start
   ```

## 🔧 DevContainer Features

### Pre-installed Tools
- **Python 3.12** with Poetry
- **Node.js 18** with npm/yarn
- **PostgreSQL client**
- **Oh My Zsh** with useful plugins
- **VS Code extensions** for Python/TypeScript development

### Useful Aliases
```bash
# Navigation
backend      # Go to backend directory
frontend     # Go to frontend directory  
root         # Go to project root

# Python
poetry-shell    # Activate poetry shell
poetry-install  # Install dependencies

# Node.js
ni          # npm install
ns          # npm start
nb          # npm run build

# Git
gs          # git status
ga          # git add
gc          # git commit
```

## 📦 Docker Deployment

### Local Development
```bash
# Run with docker-compose
docker-compose up --build
```

### Production Build
```bash
# Build backend
docker build -t huddle-up-backend ./huddle-up-backend

# Build frontend
docker build -t huddle-up-frontend ./huddle-up-frontend
```

## 🔧 Configuration

### Backend Environment Variables
```env
DATABASE_URL=postgresql://huddle_user:huddle_password@localhost:5432/huddle_db
SECRET_KEY=your-secret-key-here
DEBUG=True
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend Environment Variables
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_WEBSOCKET_URL=ws://localhost:8000
REACT_APP_ENVIRONMENT=development
```

## 🧪 Testing

### Backend Tests
```bash
cd huddle-up-backend
poetry run pytest
```

### Frontend Tests
```bash
cd huddle-up-frontend
npm test
```

## 📁 Project Structure

```
huddle-up/
├── huddle-up-backend/          # Python FastAPI backend
├── huddle-up-frontend/         # React TypeScript frontend
├── .devcontainer/              # DevContainer configuration
│   ├── devcontainer.json      # VS Code dev container settings
│   ├── docker-compose.yml     # Development services
│   ├── Dockerfile             # Development environment image
│   ├── setup.sh              # Environment setup script
│   └── zshrc                 # Zsh configuration
├── docker-compose.yml          # Production compose file
├── CHECKLIST.md               # Development checklist
└── README.md                  # This file
```

## 🚀 Deployment

### Cloud Platforms
- **AWS**: ECS, Lambda, RDS
- **Google Cloud**: Cloud Run, Cloud SQL
- **Azure**: Container Instances, PostgreSQL

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy backend and frontend containers
4. Set up reverse proxy/load balancer

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.