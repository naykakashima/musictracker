# database.py
from models import User
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
def get_user(user_id: str) -> User:
    return db.session.get(User, user_id)

def update_user_token(user_id: str, access_token: str, refresh_token: str) -> None:
    user = get_user(user_id)
    if user:
        user.access_token = access_token
        user.refresh_token = refresh_token
        db.session.commit()