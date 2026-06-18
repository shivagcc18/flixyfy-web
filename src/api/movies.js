import axios from "axios";

const API = "http://127.0.0.1:8000";

export const getTrending = async () => {
    const res = await axios.get(`${API}/api/v2/home`);
    return res.data["Trending Indian Movies"] || [];
};

export const getHomeSections = async () => {
    const res = await axios.get(`${API}/api/v2/home`);
    return res.data;
};

export const searchMovies = async (query) => {
    const res = await axios.get(`${API}/api/v2/search`, {
        params: { q: query }
    });
    return res.data.results || [];
};

export const getMovieById = async (id) => {
    const res = await axios.get(`${API}/api/v2/movie/${id}`);
    return res.data;
};

export const getRecommendations = async () => {
    return { results: [] };
};