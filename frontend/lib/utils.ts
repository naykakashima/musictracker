import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SunburstData } from "@/types/genres"
import { getCookie } from './cookie';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Improved proxyFetcher that handles missing tokens and uses proper proxying
 * to avoid CORS issues
 */
export const proxyFetcher = async (url: string) => {
  // Get access token from cookies
  const accessToken = getCookie('access_token');
  
  // Determine if we're using a direct URL or relative path
  const isExternalUrl = url.startsWith('http');
  
  // If it's an external URL (like your backend), use the proxy
  if (isExternalUrl) {
    try {
      // Extract the path from the full URL
      const urlObj = new URL(url);
      const endpoint = urlObj.pathname + urlObj.search;
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        credentials: 'include', // Important for cookies
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          endpoint: endpoint,
          baseUrl: urlObj.origin, // Pass the origin separately
          method: 'GET',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  } else {
    // For relative URLs, use direct fetch
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    return response.json();
  }
};

/**
 * The `convertImageToBase64` function takes a `File` object as input and converts it to a Base64
 * encoded string using the `FileReader` API.
 */
export async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * The `transformGenreData` function takes an API response containing genre data and transforms it into
 * a format suitable for a sunburst chart.
 */
export function transformGenreData(apiData: Record<string, number>): SunburstData {
  return {
    name: 'genres',
    children: Object.entries(apiData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name.split(' ')[0], // Take first word of genre
        value
      }))
  }
};