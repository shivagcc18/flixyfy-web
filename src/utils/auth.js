export const saveUser = (user) => {
    localStorage.setItem("watchindia_user", JSON.stringify(user));
};

export const getUser = () => {
    return JSON.parse(localStorage.getItem("watchindia_user"));
};

export const logout = () => {
    localStorage.removeItem("watchindia_user");
};