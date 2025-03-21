
export const getTopArtists = async () => {
    const response = await fetch('http://localhost:5000/api/user/top-artists');
    return response.json()
}
export const getTopTracks = async () => {
    const response = await fetch('http://localhost:5000/api/user/top-tracks');
    return response.json()
}
