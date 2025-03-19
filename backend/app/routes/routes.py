from flask import Blueprint

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return 'Welcome to Music Tracker!'

@bp.route('/spotify')
def spotify():
    return 'Spotify Route'