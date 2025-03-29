/**
 * The `refreshToken` function sends a POST request to the `/refresh` endpoint to refresh the user's
 * authentication token. It includes credentials in the request to maintain the session.
 * @returns {Promise<boolean>} - The function returns a Promise that resolves to a boolean indicating
 * whether the token refresh was successful or not. If the response is OK, it returns true; otherwise,
 * it returns false.
 * @example
 * const isTokenRefreshed = await refreshToken();
 * console.log(isTokenRefreshed); // Outputs true if the token was refreshed successfully, false otherwise
 * @throws {Error} - If there is an error during the fetch operation, the Promise will be rejected with
 * an error message.
 */
export async function refreshToken() {
	const response = await fetch('http://127.0.0.1:5000/refresh', {
	  method: 'POST',
	  credentials: 'include'
	});
	return response.ok;
}
/**
    * The `apiCall` function sends a GET request to a specified endpoint using the `/api/proxy` route.
    * It handles token refresh if the response status is 401 (Unauthorized) and retries the request.
    * @param {string} endpoint - The `endpoint` parameter is a string representing the API endpoint to
    * be called.
    * @returns {Promise<any>} - The function returns a Promise that resolves to the JSON response from
    * the API call.
    * @example
    * const data = await apiCall('/api/user/genres');
    * console.log(data); // Outputs the JSON response from the API
    * @throws {Error} - If the response status is not OK or if the token refresh fails, the Promise will be
    * rejected with an error message.
 * */
export async function apiCall(endpoint: string) {
// send get request to next proxy, linking to endpoint
    const response = await fetch(`/api/proxy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            endpoint: endpoint,
            method: 'GET',
            }),
    });
    if (response.status === 401) {
        const tokenRefreshed = await refreshToken();
        if (tokenRefreshed) {
            const retryResponse = await fetch(`/api/proxy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: endpoint,
                    method: 'GET',
                    }),
            });
            return retryResponse.json();
        } else {
            throw new Error('Failed to refresh token');
        }
    }
    if (!response.ok) {
        throw new Error('Failed to fetch data from API');
    }
    return response.json();
  }