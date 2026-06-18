import { createContext, useState, useEffect } from "react";
import { getWatchHistory } from "../utils/storage";

export const UserContext = createContext();

export default function UserProvider({ children }) {

    const [history, setHistory] = useState([]);

    useEffect(() => {
        setHistory(getWatchHistory());
    }, []);

    const refreshHistory = () => {
        setHistory(getWatchHistory());
    };

    return (
        <UserContext.Provider value={{
            history,
            refreshHistory
        }}>
            {children}
        </UserContext.Provider>
    );
}