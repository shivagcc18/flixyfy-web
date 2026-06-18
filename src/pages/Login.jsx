import { useState } from "react";
import { setToken, setUser } from "../utils/auth";

export default function Login({ onLogin }) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const login = async () => {

        const res = await fetch("http://localhost:8000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.token) {
            setToken(data.token);
            setUser(data.user);
            onLogin();
        }
    };

    return (
        <div style={{ background: "#141414", height: "100vh", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>

            <div>
                <h2>OTT LOGIN</h2>

                <input placeholder="username" onChange={e => setUsername(e.target.value)} />
                <br /><br />

                <input type="password" placeholder="password" onChange={e => setPassword(e.target.value)} />
                <br /><br />

                <button onClick={login}>Login</button>

            </div>

        </div>
    );
}