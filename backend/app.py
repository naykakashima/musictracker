import os
import requests
import time
from flask import Flask, request, redirect, jsonify
from flask_restful import Api
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from collections import Counter
from dotenv import load_dotenv
from urllib.parse import urlencode
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import timedelta
import secrets

# Load environment variables
load_dotenv('.env.local')

# Initialize extensions
db = SQLAlchemy()
api = Api()

def create_app():
    app = Flask(__name__)
    
    # Strong secret key for JWT signing
    app.secret_key = os.getenv('SECRET_KEY') or secrets.token_hex(32)
    
    # JWT Configuration - UPDATED
    app.config.update(
        JWT_SECRET_KEY=app.secret_key,
        JWT_ACCESS_COOKIE_NAME='access_token',
        JWT_REFRESH_COOKIE_NAME='refresh_token',
        JWT_COOKIE_SECURE=False,                # Keep False for localhost
        JWT_COOKIE_SAMESITE='None',              
        JWT_TOKEN_LOCATION=["cookies"],         # Only use cookies
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=1),
        # Remove JWT_COOKIE_DOMAIN to let browser handle it automatically
        JWT_COOKIE_CSRF_PROTECT=False,          # Disable CSRF for testing
    )
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize JWT with cookie handling
    jwt = JWTManager(app)
    
    # CORS Configuration - UPDATED
    CORS(app, 
        supports_credentials=True,  # Essential for cookies
        origins=["http://localhost:3000"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type", "Authorization", "Set-Cookie"],
        allow_credentials=True  # Allow credentials (cookies) to be sent    
    )
    
    # Initialize database and API
    db.init_app(app)
    api.init_app(app)
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    return app

# Create Flask application
app = create_app()

# Import models after app creation to avoid circular imports
from models import User

# Spotify credentials
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = os.getenv('REDIRECT_URI')

# Authentication routes
@app.route('/login')
def login():
    """
    The `login` function initiates the Spotify OAuth flow by generating a CSRF protection state value,
    setting necessary parameters, redirecting to the Spotify authorization page, and setting a cookie
    with the state value.
    :return: A response object is being returned, which is a redirect to the Spotify authorization page
    with the specified parameters for the OAuth flow. Additionally, a cookie named 'spotify_auth_state'
    is being set with the generated state value for CSRF protection.
"""
    # Generate a state value for CSRF protection
    state = secrets.token_hex(16)
    
    params = {
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'scope': 'user-read-private user-read-email user-library-read user-top-read user-read-recently-played',
        'state': state,
        'show_dialog': 'true'
    }
    
    # Redirect to Spotify authorization page
    response = redirect(f"https://accounts.spotify.com/authorize?{urlencode(params)}")
    
    # Set a cookie with the state - UPDATED
    response.set_cookie(
        'spotify_auth_state',
        state,
        httponly=True,
        secure=False,
        samesite='Lax',  # Consistent SameSite setting
        max_age=3600  # 1 hour
    )
    return response

@app.route('/callback')

def callback():
    """
    The function handles the OAuth2 authorization flow with Spotify, retrieves user profile data, stores
    user information in a database, creates JWT tokens, and redirects to a frontend dashboard with the
    tokens set as cookies.
    :return: The callback function returns a response containing JSON data with a success status and a
    redirect URL to the frontend dashboard. Additionally, it sets two cookies ('access_token' and
    'refresh_token') with JWT tokens for authentication. The response also includes specific CORS
    headers to allow cross-origin requests from the frontend application. Finally, it logs a success
    message indicating that the user has logged in successfully.
    """
    # Get authorization code
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'No authorization code received'}), 400
    
    # Exchange code for tokens
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
    
    if token_response.status_code != 200:
        return jsonify({'error': 'Failed to get access token'}), 400
    
    token_data = token_response.json()
    access_token = token_data.get('access_token')
    print(access_token)  # Debug logging
    refresh_token = token_data.get('refresh_token')
    expires_in = token_data.get('expires_in', 3600)
    
    # Get user profile from Spotify
    headers = {'Authorization': f'Bearer {access_token}'}
    profile_response = requests.get('https://api.spotify.com/v1/me', headers=headers)
    
    if profile_response.status_code != 200:
        return jsonify({'error': 'Failed to get user profile'}), 400
    
    profile_data = profile_response.json()
    spotify_id = profile_data['id']
    
    # Store user in database
    try:
        with app.app_context():
            user = db.session.get(User, spotify_id)
            
            if not user:
                user = User(
                    id=spotify_id,
                    display_name=profile_data.get('display_name'),
                    email=profile_data.get('email'),
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expires_at=int(time.time()) + expires_in
                )
                db.session.add(user)
            else:
                user.display_name = profile_data.get('display_name')
                user.email = profile_data.get('email')
                user.access_token = access_token
                user.refresh_token = refresh_token
                user.expires_at = int(time.time()) + expires_in
            
            db.session.commit()
            
            # Create JWT tokens with user info
            jwt_access_token = create_access_token(
                identity=spotify_id,
                additional_claims={
                    "display_name": user.display_name,
                    "email": user.email,
                    "is_admin": user.is_admin if user else False
                }
            )
            
            jwt_refresh_token = create_refresh_token(identity=spotify_id)
            
            # Redirect to frontend dashboard with tokens in cookies
            response = jsonify({
                "status": "success",
                "redirect_url": "http://localhost:3000/dashboard"
            })
            
            # Set cookies directly on this response
            response.set_cookie(
                'access_token',
                jwt_access_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                path='/'  # Note: removed max_age to make it a session cookie
            )

            response.set_cookie(
                'refresh_token',
                jwt_refresh_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                path='/'  # Note: removed max_age to make it a session cookie
            )
            
            # Delete the state cookie that worked
            response.delete_cookie('spotify_auth_state')
            # Add specific CORS headers to this response
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
            print(f"User {spotify_id} logged in successfully, with token {jwt_access_token[:10]}...")
            return response
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

# Token refresh endpoint - UPDATED
@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    The `refresh` function in this Python Flask app refreshes the JWT access token using the refresh
    token and sets the new access token in a cookie with specified attributes.
    :return: The `refresh` route in the Flask application is returning a JSON response with a message
    indicating that the token was refreshed successfully. Additionally, a new access token is set as a
    cookie named 'access_token' with the specified attributes (httpOnly, secure, sameSite, path,
    max_age).
    """
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Create new access token
    access_token = create_access_token(
        identity=current_user_id,
        additional_claims={
            "display_name": user.display_name,
            "email": user.email,
            "is_admin": user.is_admin
        }
    )
    
    response = jsonify({"message": "Token refreshed successfully"})
    # CONSISTENCY in cookie attributes
    response.set_cookie(
        'access_token',
        access_token,
        httponly=True,
        secure=False,
        samesite='Lax',
        path='/',
        max_age=3600  # 1 hour
    )

    return response

# ADDED: Test endpoint to verify cookie is being received
@app.route('/api/test-cookies')
def test_cookies():
    """Debug endpoint to check cookies"""
    cookies = {k: v for k, v in request.cookies.items()}
    
    access_token = request.cookies.get('access_token', 'Not found')
    refresh_token = request.cookies.get('refresh_token', 'Not found')
    
    return jsonify({
        'access_token_present': 'access_token' in request.cookies,
        'refresh_token_present': 'refresh_token' in request.cookies,
        'all_cookies': cookies
    })

# User data endpoint
@app.route('/api/me')

@jwt_required(optional=True)
def get_user_data():
    """
    The function `get_user_data` retrieves user information by extracting the user ID from a JWT token
    in various ways, including from the JWT identity, cookies, and Authorization header.
    :return: The `get_user_data` function returns user data in JSON format. If the user is successfully
    authenticated and found in the database, the function returns the user's ID, display name, email,
    admin status, and a boolean indicating whether the user has a Spotify token. If the user is not
    found or if authentication fails, appropriate error messages are returned along with additional
    debug information like cookies, headers,
    """
    # Try to get user from JWT identity first (standard flow)
    current_user_id = get_jwt_identity()
    print(f"JWT Identity: {current_user_id}")  # Debug logging
    
    # If standard JWT identity extraction fails, try fallback methods
    if not current_user_id:
        print("No JWT identity found, checking fallbacks")
        
        # Try to extract JWT from cookie directly
        jwt_token = request.cookies.get('access_token')
        
        if jwt_token:
            print(f"Found JWT token in cookies, attempting to decode")
            try:
                # Manually decode the JWT token
                from flask_jwt_extended import decode_token
                decoded_token = decode_token(jwt_token)
                
                # Extract user ID from the decoded token
                if 'sub' in decoded_token:
                    current_user_id = decoded_token['sub']  # 'sub' is the standard claim for subject/identity
                    print(f"Successfully extracted user ID from JWT: {current_user_id}")
                else:
                    print("JWT token does not contain 'sub' claim")
            except Exception as e:
                print(f"Error decoding JWT token: {str(e)}")
        
        # If we still don't have a user ID, check for Authorization header
        if not current_user_id:
            auth_header = request.headers.get('Authorization')
            
            if auth_header and auth_header.startswith('Bearer '):
                jwt_token = auth_header[7:]  # Extract token from 'Bearer <token>'
                print(f"Found token in Authorization header")
                
                try:
                    # Manually decode the JWT token from header
                    from flask_jwt_extended import decode_token
                    decoded_token = decode_token(jwt_token)
                    
                    # Extract user ID from the decoded token
                    if 'sub' in decoded_token:
                        current_user_id = decoded_token['sub']
                        print(f"Successfully extracted user ID from header JWT: {current_user_id}")
                    else:
                        print("JWT token in header does not contain 'sub' claim")
                except Exception as e:
                    print(f"Error decoding JWT token from header: {str(e)}")
        
        # If we still don't have a user ID after all fallbacks, return error
        if not current_user_id:
            return jsonify({
                "error": "Authentication failed",
                "debug": {
                    "cookies": list(request.cookies.keys()),
                    "headers": {k: v for k, v in request.headers.items() if k.lower() in ['authorization', 'content-type', 'host']},
                    "method": request.method,
                    "path": request.path
                }
            }), 401
    
    # Now we should have a user ID one way or another, so fetch the user
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Successfully found user, return their data
    return jsonify({
        'id': user.id,
        'display_name': user.display_name,
        'email': user.email,
        'is_admin': user.is_admin,
        'has_spotify_token': bool(user.access_token)  # Helpful for debugging
    })

# Debug endpoint
@app.route('/debug-auth')
def debug_auth():
    """Debug endpoint to check auth status"""
    return jsonify({
        'cookies': dict(request.cookies),
        'headers': dict(request.headers)
    })

# Helper function for Spotify API requests with automatic token refresh
def spotify_api_request(user_id, endpoint, params=None):
    """
    The function `spotify_api_request` handles making API requests to Spotify, including token
    refreshing and error handling.
    
    :param user_id: The `user_id` parameter in the `spotify_api_request` function is used to identify
    the user for whom the Spotify API request is being made. It is used to retrieve the user's
    information from the database and manage their access token for making authenticated requests to the
    Spotify API
    :param endpoint: The `endpoint` parameter in the `spotify_api_request` function is the specific API
    endpoint that you want to access in the Spotify API. It represents the resource you are trying to
    interact with, such as `/me` for user information or `/search` for searching tracks, artists, or
    albums
    :param params: The `params` parameter in the `spotify_api_request` function is used to pass any
    additional parameters that may be required for the Spotify API request. These parameters could
    include things like query parameters for filtering or sorting data, or any other parameters specific
    to the endpoint being called
    :return: The `spotify_api_request` function returns a tuple containing either the response JSON data
    or `None` (if there was an error) as the first element, and an error message string or `None` as the
    second element.
    """
    user = db.session.get(User, user_id)
    if not user:
        return None, "User not found"
    
    # Check if token is expired and needs refresh
    current_time = int(time.time())
    if current_time >= user.expires_at:
        print(f"Token expired for user {user_id}, refreshing...")
        # Refresh the token
        response = requests.post(
            'https://accounts.spotify.com/api/token',
            data={
                'grant_type': 'refresh_token',
                'refresh_token': user.refresh_token,
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET
            }
        )
        
        if response.status_code != 200:
            print(f"Failed to refresh token: {response.status_code}")
            return None, "Failed to refresh Spotify token"
        
        token_data = response.json()
        user.access_token = token_data.get('access_token')
        user.expires_at = current_time + token_data.get('expires_in', 3600)
        
        # Get new refresh token if provided
        if 'refresh_token' in token_data:
            user.refresh_token = token_data.get('refresh_token')
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Database error: {str(e)}")
            return None, f"Database error: {str(e)}"
    
    # Make the API request with the valid token
    headers = {'Authorization': f'Bearer {user.access_token}'}
    try:
        response = requests.get(
            f'https://api.spotify.com/v1/{endpoint}',
            headers=headers,
            params=params
        )
        
        if response.status_code == 200:
            return response.json(), None
        else:
            error_msg = f"Spotify API error: {response.status_code}"
            try:
                error_data = response.json()
                if 'error' in error_data:
                    error_msg += f" - {error_data['error'].get('message', '')}"
            except:
                pass
            return None, error_msg
    except Exception as e:
        return None, f"Request error: {str(e)}"

# Genre endpoint
@app.route('/api/user/genres')
@jwt_required(optional=True)
def get_user_genres():
    """
    The function `get_user_genres` retrieves the user's top genres based on their top artists from the
    Spotify API. It handles authentication, token refresh, and CORS headers for frontend access.
    :return: The `get_user_genres` function returns a JSON response containing the user's top genres
    and their corresponding weights. If the user is not authenticated or if there are any errors in
    fetching the data, it returns an error message with appropriate status codes. The response also
    includes CORS headers to allow cross-origin requests from the frontend application.
    """
    # Get user ID (use the same fallback logic as /api/me)
    current_user_id = get_jwt_identity()
    
    # If standard JWT identity extraction fails, try fallback methods
    if not current_user_id:
        print("No JWT identity found in genres endpoint, checking fallbacks")
        
        # Try to extract JWT from cookie directly
        jwt_token = request.cookies.get('access_token')
        
        if jwt_token:
            try:
                print(f"Found JWT token in cookies, attempting to decode")
                from flask_jwt_extended import decode_token
                decoded_token = decode_token(jwt_token)
                if 'sub' in decoded_token:
                    current_user_id = decoded_token['sub']
            except Exception as e:
                print(f"Error decoding JWT token: {str(e)}")
    # If still no user ID, return error
    if not current_user_id:
        print("No user ID found after all fallbacks")
        print(f"Cookies: {list(request.cookies.keys())}")
        return jsonify({
            "error": "Authentication required",
            "debug": {
                "cookies": list(request.cookies.keys()),
                "headers": {k: v for k, v in request.headers.items() if k.lower() in ['authorization', 'content-type', 'host']}
            }
        }), 401
    
    # Get all time ranges to calculate a comprehensive genre profile
    time_ranges = ['short_term', 'medium_term', 'long_term']
    all_genres = []
    
    for time_range in time_ranges:
        # Get top artists for this time range
        data, error = spotify_api_request(
            current_user_id,
            'me/top/artists',
            {
                'limit': 50,  # Maximum allowed
                'time_range': time_range
            }
        )
        
        if error:
            print(f"Error fetching top artists for {time_range}: {error}")
            continue
        
        if data and 'items' in data:
            # Extract genres from artists and add them to our list
            # Weight genres by artist position (higher ranked artists' genres count more)
            for i, artist in enumerate(data['items']):
                weight = 1.0 - (i / len(data['items']))  # Weight from 1.0 to ~0.0
                for genre in artist.get('genres', []):
                    # Each genre gets points based on artist rank and time range
                    # Short term (recent) counts more than long term
                    time_range_multiplier = 1.5 if time_range == 'short_term' else (1.0 if time_range == 'medium_term' else 0.5)
                    all_genres.append((genre, weight * time_range_multiplier))
    
    # Count genres with their weights
    genre_counts = {}
    for genre, weight in all_genres:
        if genre in genre_counts:
            genre_counts[genre] += weight
        else:
            genre_counts[genre] = weight
    
    # Sort and normalize for better visualization
    sorted_genres = dict(sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:15])
    
    # If we have no genres, return empty result
    if not sorted_genres:
        return jsonify({})
    
    # Add CORS headers for direct frontend access
    response = jsonify(sorted_genres)
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
@app.route('/api/user/tracks', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_user_tracks():
    """
    The function `get_user_tracks` retrieves the top tracks for a user with optional JWT authentication
    and handles CORS preflight requests.
    :return: The code snippet defines a Flask route `/api/user/tracks` that handles GET and OPTIONS
    requests. It first checks if the request method is OPTIONS to handle CORS preflight requests. If the
    method is OPTIONS, it returns a response with CORS headers.
    """
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Get user ID using the same fallback logic
    current_user_id = get_jwt_identity()
    
    # If standard JWT identity extraction fails, try fallbacks
    if not current_user_id:
        jwt_token = request.cookies.get('access_token')
        if jwt_token:
            try:
                from flask_jwt_extended import decode_token
                decoded_token = decode_token(jwt_token)
                if 'sub' in decoded_token:
                    current_user_id = decoded_token['sub']
            except Exception as e:
                print(f"Error decoding JWT token: {str(e)}")
                
        # Check Authorization header
        if not current_user_id:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                jwt_token = auth_header[7:]
                try:
                    from flask_jwt_extended import decode_token
                    decoded_token = decode_token(jwt_token)
                    if 'sub' in decoded_token:
                        current_user_id = decoded_token['sub']
                except Exception as e:
                    print(f"Error decoding JWT token from header: {str(e)}")
    
    # If still no user ID, return error
    if not current_user_id:
        print("Authentication failed, no user ID found.")
        response = jsonify({
            "error": "Authentication required",
            "debug": {
                "cookies": list(request.cookies.keys()),
                "headers": {k: v for k, v in request.headers.items() if k.lower() in ['authorization', 'content-type', 'host']}
            }
        })
        response.status_code = 401
        # Add CORS headers to the error response too
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    # Get time range from query params, default to medium_term
    time_range = request.args.get('time_range', 'medium_term')
    # Validate time range
    if time_range not in ['short_term', 'medium_term', 'long_term']:
        time_range = 'medium_term'
    
    print(f"Fetching top tracks for user {current_user_id} with time_range={time_range}")
        
    # Use the helper function to make the request
    data, error = spotify_api_request(
        current_user_id,
        'me/top/tracks',
        {
            'limit': 10,
            'time_range': time_range
        }
    )
    
    if error:
        print(f"Error fetching top tracks: {error}")
        response = jsonify({"error": error})
        response.status_code = 400
        # Add CORS headers to the error response too
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    # Add CORS headers
    response = jsonify(data)
    print(f"Successfully fetched {len(data.get('items', []))} tracks")
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response

@app.route('/api/user/artists', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_user_artists():
    """
    This Flask route function retrieves a user's top artists from Spotify API with authentication and
    CORS handling.
    :return: The Flask route `/api/user/artists` is returning a response based on the logic within the
    function `get_user_artists()`. The response includes data about the user's top artists fetched from
    the Spotify API. The response is a JSON object containing information about the top artists, and it
    includes CORS headers to allow requests from a specific origin (`http://localhost:3000`).
    """
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Get user ID using the same fallback logic
    current_user_id = get_jwt_identity()
    
    # If standard JWT identity extraction fails, try fallbacks
    if not current_user_id:
        jwt_token = request.cookies.get('access_token')
        if jwt_token:
            try:
                from flask_jwt_extended import decode_token
                decoded_token = decode_token(jwt_token)
                if 'sub' in decoded_token:
                    current_user_id = decoded_token['sub']
            except Exception as e:
                print(f"Error decoding JWT token: {str(e)}")
                
        # Check Authorization header
        if not current_user_id:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                jwt_token = auth_header[7:]
                try:
                    from flask_jwt_extended import decode_token
                    decoded_token = decode_token(jwt_token)
                    if 'sub' in decoded_token:
                        current_user_id = decoded_token['sub']
                except Exception as e:
                    print(f"Error decoding JWT token from header: {str(e)}")
    
    # If still no user ID, return error
    if not current_user_id:
        print("Authentication failed, no user ID found.")
        response = jsonify({
            "error": "Authentication required",
            "debug": {
                "cookies": list(request.cookies.keys()),
                "headers": {k: v for k, v in request.headers.items() if k.lower() in ['authorization', 'content-type', 'host']}
            }
        })
        response.status_code = 401
        # Add CORS headers to the error response too
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    # Get time range from query params, default to medium_term
    time_range = request.args.get('time_range', 'medium_term')
    # Validate time range
    if time_range not in ['short_term', 'medium_term', 'long_term']:
        time_range = 'medium_term'
    
    print(f"Fetching top artists for user {current_user_id} with time_range={time_range}")
        
    # Use the helper function to make the request
    data, error = spotify_api_request(
        current_user_id,
        'me/top/artists',
        {
            'limit': 9,  # 3x3 grid in the frontend
            'time_range': time_range
        }
    )
    
    if error:
        print(f"Error fetching top artists: {error}")
        response = jsonify({"error": error})
        response.status_code = 400
        # Add CORS headers to the error response too
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    # Add CORS headers
    response = jsonify(data)
    print(f"Successfully fetched {len(data.get('items', []))} artists")
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
@app.route('/api/stats/audio-features', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_audio_features_avg():
    """
    This function retrieves the average audio features for a user's top tracks from the Spotify API.
    :return: The endpoint `/api/stats/audio-features` is returning the average audio features for the
    user's top tracks. The response includes the average values for energy, danceability, valence,
    acousticness, instrumentalness, liveness, speechiness, tempo, and the total track count. The
    response is in JSON format and includes CORS headers to allow requests from `http://localhost:3000`.
    """
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Get user ID using the fallback logic
    current_user_id = get_jwt_identity()
    if not current_user_id:
        jwt_token = request.cookies.get('access_token')
        if jwt_token:
            try:
                from flask_jwt_extended import decode_token
                decoded_token = decode_token(jwt_token)
                if 'sub' in decoded_token:
                    current_user_id = decoded_token['sub']
            except Exception as e:
                print(f"Error decoding JWT token: {str(e)}")
                
        # Check Authorization header
        if not current_user_id:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                jwt_token = auth_header[7:]
                try:
                    from flask_jwt_extended import decode_token
                    decoded_token = decode_token(jwt_token)
                    if 'sub' in decoded_token:
                        current_user_id = decoded_token['sub']
                except Exception as e:
                    print(f"Error decoding JWT token from header: {str(e)}")
    
    # If still no user ID, return error
    if not current_user_id:
        response = jsonify({"error": "Authentication required"})
        response.status_code = 401
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Get time range from query params
    time_range = request.args.get('time_range', 'medium_term')
    if time_range not in ['short_term', 'medium_term', 'long_term']:
        time_range = 'medium_term'
    
    # First get top tracks
    tracks_data, error = spotify_api_request(
        current_user_id,
        'me/top/tracks',
        {
            'limit': 20,  # Increased to get more accurate averages
            'time_range': time_range
        }
    )
    
    if error:
        response = jsonify({"error": error})
        response.status_code = 400
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Extract track IDs
    track_ids = [track['id'] for track in tracks_data.get('items', [])]
    
    if not track_ids:
        response = jsonify({
            "energy": 0,
            "danceability": 0,
            "valence": 0,
            "acousticness": 0,
            "instrumentalness": 0,
            "liveness": 0,
            "speechiness": 0,
            "tempo": 0,
            "track_count": 0
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Get audio features for these tracks
    audio_features_data, error = spotify_api_request(
        current_user_id,
        'audio-features',
        {
            'ids': ','.join(track_ids[:20])  # Limited to 20 tracks
        }
    )
    
    if error:
        response = jsonify({"error": error})
        response.status_code = 400
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Calculate averages
    features = audio_features_data.get('audio_features', [])
    features = [f for f in features if f]  # Filter out None values
    
    if not features:
        response = jsonify({
            "energy": 0,
            "danceability": 0,
            "valence": 0,
            "acousticness": 0,
            "instrumentalness": 0,
            "liveness": 0,
            "speechiness": 0,
            "tempo": 0,
            "track_count": 0
        })
    else:
        avg_features = {
            "energy": sum(f.get('energy', 0) for f in features) / len(features),
            "danceability": sum(f.get('danceability', 0) for f in features) / len(features),
            "valence": sum(f.get('valence', 0) for f in features) / len(features),
            "acousticness": sum(f.get('acousticness', 0) for f in features) / len(features),
            "instrumentalness": sum(f.get('instrumentalness', 0) for f in features) / len(features),
            "liveness": sum(f.get('liveness', 0) for f in features) / len(features),
            "speechiness": sum(f.get('speechiness', 0) for f in features) / len(features),
            "tempo": sum(f.get('tempo', 0) for f in features) / len(features),
            "track_count": len(features)
        }
        response = jsonify(avg_features)
    
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
@app.route('/api/stats/genres', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_top_genres():
    """
    The function `get_top_genres` retrieves a user's top genres based on their top artists using Spotify
    API and handles CORS preflight requests.
    :return: The endpoint `/api/stats/genres` returns a JSON response containing the top 10 genres based
    on the user's top artists, along with the top genre among those. The response includes the genres
    sorted by occurrence count and additional CORS headers for allowing requests from a specific origin
    (`http://localhost:3000`).
    """
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    
    # Get user ID using the same fallback logic
    current_user_id = get_jwt_identity()
    
    # If standard JWT identity extraction fails, try fallbacks
    if not current_user_id:
        jwt_token = request.cookies.get('access_token')
        if jwt_token:
            try:
                from flask_jwt_extended import decode_token
                decoded_token = decode_token(jwt_token)
                if 'sub' in decoded_token:
                    current_user_id = decoded_token['sub']
            except Exception as e:
                print(f"Error decoding JWT token: {str(e)}")
                
        # Check Authorization header
        if not current_user_id:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                jwt_token = auth_header[7:]
                try:
                    from flask_jwt_extended import decode_token
                    decoded_token = decode_token(jwt_token)
                    if 'sub' in decoded_token:
                        current_user_id = decoded_token['sub']
                except Exception as e:
                    print(f"Error decoding JWT token from header: {str(e)}")
    
    # Get time range from query params
    time_range = request.args.get('time_range', 'medium_term')
    if time_range not in ['short_term', 'medium_term', 'long_term']:
        time_range = 'medium_term'
    
    # Get top artists
    artists_data, error = spotify_api_request(
        current_user_id,
        'me/top/artists',
        {
            'limit': 30,  # Increased to get more genre diversity
            'time_range': time_range
        }
    )
    
    if error:
        response = jsonify({"error": error})
        response.status_code = 400
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Extract genres and count occurrences
    genre_count = {}
    
    for artist in artists_data.get('items', []):
        for genre in artist.get('genres', []):
            genre_count[genre] = genre_count.get(genre, 0) + 1
    
    # Sort genres by occurrence count
    sorted_genres = [{"name": k, "count": v} for k, v in 
                     sorted(genre_count.items(), key=lambda x: x[1], reverse=True)]
    
    response = jsonify({
        "genres": sorted_genres[:10],  # Top 10 genres
        "top_genre": sorted_genres[0]["name"] if sorted_genres else "Unknown"
    })
    
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
@app.route('/api/stats/library', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_saved_tracks_count():
    """
    This Flask route function retrieves the count of a user's saved tracks and recently played tracks
    from the Spotify API while handling CORS preflight requests and JWT token extraction.
    :return: The endpoint `/api/stats/library` is returning the count of a user's saved tracks and the
    count of recently played tracks. The response includes JSON data with keys "saved_tracks" for the
    total saved tracks count and "recently_played" for the count of recently played tracks. CORS headers
    are also included in the response to allow requests from a specific origin
    (`http://localhost:3000`).
    """
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    current_user_id = get_jwt_identity()
    
    # If standard JWT identity extraction fails, try fallbacks
    if not current_user_id:
        jwt_token = request.cookies.get('access_token')
        if jwt_token:
            try:
                from flask_jwt_extended import decode_token
                decoded_token = decode_token(jwt_token)
                if 'sub' in decoded_token:
                    current_user_id = decoded_token['sub']
            except Exception as e:
                print(f"Error decoding JWT token: {str(e)}")
                
        # Check Authorization header
        if not current_user_id:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                jwt_token = auth_header[7:]
                try:
                    from flask_jwt_extended import decode_token
                    decoded_token = decode_token(jwt_token)
                    if 'sub' in decoded_token:
                        current_user_id = decoded_token['sub']
                except Exception as e:
                    print(f"Error decoding JWT token from header: {str(e)}")
    
    # Get saved tracks with limit=1 to minimize data transfer (we just need the total)
    saved_tracks_data, error = spotify_api_request(
        current_user_id,
        'me/tracks',
        {
            'limit': 1
        }
    )
    
    if error:
        response = jsonify({"error": error})
        response.status_code = 400
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Extract total count
    total_saved = saved_tracks_data.get('total', 0)
    
    # Get recently played tracks count too
    recent_tracks_data, error = spotify_api_request(
        current_user_id,
        'me/player/recently-played',
        {
            'limit': 50  # Maximum allowed
        }
    )
    
    recent_count = len(recent_tracks_data.get('items', [])) if not error else 0
    
    response = jsonify({
        "saved_tracks": total_saved,
        "recently_played": recent_count
    })
    
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
@app.route('/api/docs')
def api_documentation():
    """
    Generates API documentation based on route docstrings.
    Returns a JSON object with endpoint information and descriptions.
    """
    docs = []
    
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':  # Skip static files
            endpoint = rule.endpoint
            route = str(rule)
            methods = list(rule.methods - {'OPTIONS', 'HEAD'})
            
            # Get the function from the endpoint
            view_func = app.view_functions.get(endpoint)
            description = view_func.__doc__ if view_func and view_func.__doc__ else "No description available"
            
            # Clean up the description
            if description:
                description = description.strip()
            
            # Add to documentation list
            docs.append({
                'endpoint': endpoint,
                'route': route,
                'methods': methods,
                'description': description
            })
    
    # Sort by route for easier reading
    docs = sorted(docs, key=lambda x: x['route'])
    
    # Add CORS headers
    response = jsonify({
        "api_name": "MusicTracker API",
        "version": "1.0",
        "documentation": docs
    })
    
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    
    return response
@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()  # Properly close sessions

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)  # Changed host to 0.0.0.0 for network access