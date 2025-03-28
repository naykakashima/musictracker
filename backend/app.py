import os
import requests
from flask import Flask, request, redirect, session, url_for, jsonify
from flask_restful import Api, Resource
from collections import Counter
from dotenv import load_dotenv
from urllib.parse import urlencode
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import time
from datetime import timedelta
db = SQLAlchemy()
api = Api()

# Load config
load_dotenv('.env.local')

def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv('SECRET_KEY')
    
    # Enhanced CORS configuration
    CORS(app, 
        supports_credentials=True,
        resources={
            r"/*": {
                "origins": ["http://localhost:3001"],
                "methods": ["GET", "POST", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"]
            }
        }
    )

    # Secure session configuration
    app.config.update(
        SESSION_COOKIE_NAME='spotify_session',
        SESSION_COOKIE_SAMESITE='None',
        SESSION_COOKIE_SECURE=True,  # Must be True for SameSite=None
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_DOMAIN='localhost',
        PERMANENT_SESSION_LIFETIME=timedelta(hours=1),
        SESSION_REFRESH_EACH_REQUEST=True
    )
    # Configure DB
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions with app
    db.init_app(app)
    api.init_app(app)
    

    
    # Create tables (only needed once)
    with app.app_context():
        db.create_all()
    
    
    return app

app = create_app()
from models import User
# Spotify credentials
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = os.getenv('REDIRECT_URI')
# Helper functions
def get_spotify_headers():
    """Returns authorization headers with current access token"""
    return {
        'Authorization': f'Bearer {session.get("access_token")}'
    }

def spotify_api_request(endpoint: str, params: dict = None):
    """Generic Spotify API request handler"""
    if not session.get('access_token'):
        return None
        
    response = requests.get(
        f'https://api.spotify.com/v1/{endpoint}',
        headers=get_spotify_headers(),
        params=params
    )
    return response.json() if response.status_code == 200 else None

# Auth routes
@app.route('/login')
def login():
    params = {
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'scope': 'user-read-private user-read-email user-library-read user-top-read user-read-recently-played',
        'show_dialog': 'true'  # Forces fresh auth and cookie acceptance
    } 
    #add cors headers
    headers = {
        'Access-Control-Allow-Origin': 'http://localhost:3001',
        'Access-Control-Allow-Credentials': 'true'
    }
    # Redirect to Spotify authorization page
    # Add CORS headers to the response
    response = redirect(f"https://accounts.spotify.com/authorize?{urlencode(params)}")
    response.headers.update(headers)
    return response
@app.route('/callback')
def callback():
    # Existing token retrieval code
    code = request.args.get('code')
    token_response = requests.post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }
    )
    token_response_data = token_response.json()
    access_token = token_response_data.get('access_token')
    session['access_token'] = access_token
    print(session['access_token'])  # Debug
    session['refresh_token'] = token_response_data.get('refresh_token')
    # Get user profile from Spotify
    headers = {'Authorization': f'Bearer {access_token}'}
    profile_response = requests.get('https://api.spotify.com/v1/me', headers=headers)
    if profile_response.status_code != 200:
        print("Error getting profile", profile_response.status_code, profile_response.text)
    profile_data = profile_response.json()

    # Create/update user in database
    with app.app_context():
        try:
            # Ensure user is fetched from the session, and use session-bound object
            user = db.session.get(User, profile_data['id'])
            
            if not user:
                # Create a new user instance if it doesn't exist
                user = User(
                    id=profile_data['id'],
                    display_name=profile_data.get('display_name'),
                    email=profile_data.get('email'),
                    access_token=access_token,
                    refresh_token=token_response_data.get('refresh_token'),
                    expires_at=int(time.time()) + token_response_data.get('expires_in', 3600)
                )
                db.session.add(user)  # Ensure user is added to the session
            else:
                # Update user if it exists
                user.access_token = access_token
                user.refresh_token = token_response_data.get('refresh_token')
                user.expires_at = int(time.time()) + token_response_data.get('expires_in', 3600)

            db.session.commit()
            # Store in session
            session['user_id'] = user.id
            session['is_admin'] = user.is_admin  # Commit changes to the database
            print(f"User {user.display_name} logged in")
            print(session)

        except Exception as e:
            db.session.rollback()  # Rollback any changes on error
            print(f"Database error: {str(e)}")
            return "Database error", 500    
    # Enhanced session handling
    session.permanent = True
    session.update(
        access_token=access_token,
        refresh_token=token_response_data.get('refresh_token'),
        user_id=profile_data['id'],
        is_admin=user.is_admin if user else False
    )

    # Create proper redirect response
    frontend_url = f"http://localhost:3001/dashboard"
    response = redirect(frontend_url, code=303)
    
    # Set cross-origin cookies
    response.set_cookie(
        'spotify_session',
        value=session['user_id'],
        secure=True,
        samesite='None',
        domain='localhost',
        httponly=True,
        max_age=3600
    )
    
    response.headers.extend({
        'Access-Control-Allow-Origin': 'http://localhost:3001',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Expose-Headers': 'Set-Cookie'
    })
    
    return response

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        print(session)
        return redirect(url_for('login'))
    
    # Get user data from database
    user = db.session.get(User, session['user_id'])
    if not user:
        return redirect(url_for('login'))
    
    # Prepare basic user data to pass to frontend
    user_data = {
        'id': user.id,
        'display_name': user.display_name,
        'email': user.email,
        'is_admin': user.is_admin
    }
    response = jsonify(user_data)
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3001')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response
@app.route('/api/user/genres')
def get_user_genres():
    # Verify authentication
    if 'user_id' not in session:
        print(session)
        return {'error': 'User not authenticated'}, 401
    
    # Get top artists from Spotify
    headers = {'Authorization': f'Bearer {session["access_token"]}'}
    response = requests.get(
        'https://api.spotify.com/v1/me/top/artists',
        headers=headers,
        params={'limit': 50, 'time_range': 'medium_term'}
    )
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch artists'}), 400
    
    # Count genres
    genre_counter = Counter()
    for artist in response.json()['items']:
        genre_counter.update(artist['genres'])
    
    # Return top 10 genres
    return jsonify(dict(genre_counter.most_common(10)))
@app.before_request
def check_session():
    if request.endpoint in ['login', 'callback']:
        return
        
    if 'user_id' not in session:
        print(f"Session invalid: {dict(session)}")
        return jsonify({'error': 'Session expired'}), 401
@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()  # Properly close sessions
# API Resources
class SpotifyData(Resource):
    """Base class for Spotify data endpoints"""
    def check_auth(self):
        if not session.get('access_token'):
            return redirect(url_for('login'))
        return None

class TopTracks(SpotifyData):
    def get(self):
        if (auth_check := self.check_auth()):
            return auth_check
        return spotify_api_request('me/top/tracks', {'limit': 5})

class TopArtists(SpotifyData):
    def get(self):
        if (auth_check := self.check_auth()):
            return auth_check
        return spotify_api_request('me/top/artists', {
            'limit': 5,
            'time_range': 'medium_term'  # or short_term/long_term
        })

class RecentlyPlayed(SpotifyData):
    def get(self):
        if (auth_check := self.check_auth()):
            return auth_check
        return spotify_api_request('me/player/recently-played', {'limit': 5})

# Register routes
api.add_resource(TopTracks, '/api/user/tracks')
api.add_resource(TopArtists, '/api/user/artists')
api.add_resource(RecentlyPlayed, '/api/user/recent')

if __name__ == '__main__':
    app.run(debug=True)