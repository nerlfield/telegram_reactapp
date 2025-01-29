import os
import hmac
import hashlib
import json
import time
import logging
from urllib.parse import urlencode
from telegram import Update, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL")

def generate_init_data(user):
    """Generate init data for Telegram Web App."""
    init_data = {
        "query_id": "",  # Optional query ID
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name if user.last_name else "",
            "username": user.username if user.username else "",
            "language_code": user.language_code if user.language_code else "en"
        },
        "auth_date": int(time.time()),
        "start_param": ""  # Optional start parameter
    }
    
    # Sort dictionary items for consistent data check string
    sorted_items = []
    for key in sorted(init_data.keys()):
        value = init_data[key]
        if key == "user":
            # Handle user object separately
            user_items = []
            for user_key in sorted(value.keys()):
                user_value = value[user_key]
                if user_value:  # Only include non-empty values
                    user_items.append(f"{user_key}={user_value}")
            sorted_items.append(f"user={{{','.join(user_items)}}}")
        else:
            if value:  # Only include non-empty values
                sorted_items.append(f"{key}={value}")
    
    data_check_string = "\n".join(sorted_items)
    
    # Generate hash
    secret_key = hmac.new("WebAppData".encode(), BOT_TOKEN.encode(), hashlib.sha256).digest()
    init_data["hash"] = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    return urlencode({"tgWebAppData": json.dumps(init_data)})

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a message with a button that opens the web app."""
    init_data = generate_init_data(update.effective_user)
    webapp_url = f"{WEBAPP_URL}?{init_data}"
    
    logger.info(f"Generated WebApp URL: {webapp_url}")
    
    button = KeyboardButton(
        text="Play Snake! 🐍",
        web_app=WebAppInfo(url=webapp_url)
    )
    keyboard = ReplyKeyboardMarkup([[button]], resize_keyboard=True)
    await update.message.reply_text(
        "Welcome to Snake Game! Click the button below to start playing:",
        reply_markup=keyboard
    )

def main():
    """Start the bot."""
    logger.info("Starting bot...")
    
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN environment variable is not set")
        raise ValueError("BOT_TOKEN environment variable is not set")
    
    if not WEBAPP_URL:
        logger.error("WEBAPP_URL environment variable is not set")
        raise ValueError("WEBAPP_URL environment variable is not set")
    
    logger.info(f"Using WEBAPP_URL: {WEBAPP_URL}")
        
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    
    logger.info("Bot is ready to handle updates")
    application.run_polling()

if __name__ == "__main__":
    main() 