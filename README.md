# Telegram React Web App

This project consists of a Telegram Bot with an integrated React Web Application, FastAPI backend, and PostgreSQL database.

## Project Structure

```
telegram_reactapp/
├── frontend/         # React web application
├── backend/         # FastAPI backend service
├── bot/            # Telegram bot service
└── docker-compose.yml
```

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Python 3.10+
- ngrok (for local development with Telegram)

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```env
BOT_TOKEN=your_telegram_bot_token
WEBAPP_URL=your_ngrok_url
```

2. Set up ngrok for local development:

```bash
# Install ngrok
# macOS (using Homebrew)
brew install ngrok

# Start ngrok on port 5173 (frontend port)
ngrok http 5173

# Copy the HTTPS URL provided by ngrok and set it as WEBAPP_URL in .env
# Example: https://1234-56-78-90-123.ngrok-free.app
```

## Running the Project

1. Start all services using Docker Compose:

```bash
docker-compose up --build
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:8000
- PostgreSQL on port 5432
- Telegram bot service

2. Set up your Telegram Bot:
   - Talk to [@BotFather](https://t.me/botfather) on Telegram
   - Create a new bot or select an existing one
   - Set the bot's web app URL to your ngrok URL
   - Copy the bot token and set it as `BOT_TOKEN` in `.env`

## Development

### Frontend Development
- Located in `frontend/`
- Built with React and Vite
- Uses TonConnect for wallet integration
- Environment variables are managed through Vite's env system

### Backend Development
- Located in `backend/`
- Built with FastAPI
- Requires Python 3.10+
- Main dependencies:
  - fastapi
  - uvicorn
  - sqlalchemy
  - python-telegram-bot
  - psycopg2-binary

### Bot Development
- Located in `bot/`
- Built with python-telegram-bot
- Handles Telegram bot interactions and web app integration

## Troubleshooting

1. If the frontend is not accessible through ngrok:
   - Make sure the ngrok URL matches your `WEBAPP_URL` in `.env`
   - Verify that the frontend container is running on port 5173
   - Check ngrok logs for any connection issues

2. If the bot is not responding:
   - Verify your `BOT_TOKEN` is correct
   - Check the bot container logs: `docker-compose logs bot`
   - Ensure the bot is running and webhook is set correctly

3. Database connection issues:
   - Check if PostgreSQL container is running: `docker-compose ps`
   - Verify database credentials in docker-compose.yml
   - Ensure the database is properly initialized

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request