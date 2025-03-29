"use client";
import { useEffect, useState } from 'react';

export default function CallbackPage() {
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    // Call the backend
    fetch(`http://localhost:5000/callback${window.location.search}`, {
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === "success") {
          setStatus('Authentication successful! Redirecting...');
          setTimeout(() => {
            window.location.href = data.redirect_url;
          }, 1000); // Short delay to show success message
        } else {
          setStatus('Authentication failed.');
        }
      })
      .catch(err => {
        console.error(err);
        setStatus('Error during authentication.');
        // check if cookie data is still present. If not, redirect to login page. If so, redirect to dashboard.
        fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        })
          .then(res => {
            if (res.ok) {
              window.location.href = '/dashboard'; // Redirect to dashboard
            } else {
              window.location.href = '/'; // Redirect to login page
            }
          })
          .catch(error => {
            console.error('Session check failed:', error);
            window.location.href = '/'; // Redirect to login page
          });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Spotify Authentication</h1>
        <p>{status}</p>
      </div>
    </div>
  );
}