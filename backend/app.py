import os
import requests #type: ignore
from flask import Flask, request, redirect, session, url_for #type: ignore
from flask_restful import Api, Resource #type: ignore
from dotenv import load_dotenv #type: ignore

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')  # Load secret key from environment variable
api = Api(app)

# Spotify API credentials
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = os.getenv('REDIRECT_URI')

# Step 1: Redirect user to Spotify authorization URL
@app.route('/login')
def login():
    auth_url = (
        'https://accounts.spotify.com/authorize'
        '?response_type=code'
        f'&client_id={CLIENT_ID}'
        f'&redirect_uri={REDIRECT_URI}'
        '&scope=user-library-read'
    )
    return redirect(auth_url)

# Step 2: Handle callback and get access token
@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_url = 'https://accounts.spotify.com/api/token'
    response = requests.post(token_url, data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    })
    response_data = response.json()
    session['access_token'] = response_data['access_token']
    return redirect(url_for('returnspotifydata'))

class ReturnSpotifyData(Resource):
    def get(self):
        access_token = session.get('access_token')
        if not access_token:
            return redirect(url_for('login'))

        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        response = requests.get('https://api.spotify.com/v1/me/tracks', headers=headers)
        data = response.json()
        return data

api.add_resource(ReturnSpotifyData, '/returnspotifydata')

if __name__ == '__main__':
    app.run(debug=True)