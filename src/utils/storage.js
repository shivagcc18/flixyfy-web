const WATCH_KEY = "ott_watch_history";

// ⭐ SAVE WATCH EVENT
export const saveWatch = (movie) => {

    let history = JSON.parse(localStorage.getItem(WATCH_KEY)) || [];

    // remove duplicates
    history = history.filter(m => m.id !== movie.id);

    // add latest to top
    history.unshift(movie);

    // keep last 20 only
    history = history.slice(0, 20);

    localStorage.setItem(WATCH_KEY, JSON.stringify(history));
};

// ⭐ GET HISTORY
export const getWatchHistory = () => {
    return JSON.parse(localStorage.getItem(WATCH_KEY)) || [];
};

// ⭐ CLEAR HISTORY
export const clearWatchHistory = () => {
    localStorage.removeItem(WATCH_KEY);
};