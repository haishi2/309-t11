import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const AuthContext = createContext(null);

/*
 * This provider should export a `user` context state that is
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
      } else {
        try {
          const userFetch = await fetch(`$https://{BACKEND_URL}/user/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const user = await userFetch.json();
          setUser(user.user);
        } catch (error) {
          console.error("Error fetching user:", error);
          setUser(null);
        }
      }
    };

    fetchUser();
  }, []);

  /*
   * Logout the currently authenticated user.
   *
   * @remarks This function will always navigate to "/".
   */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  /**
   * Login a user with their credentials.
   *
   * @remarks Upon success, navigates to "/profile".
   * @param {string} username - The username of the user.
   * @param {string} password - The password of the user.
   * @returns {string} - Upon failure, Returns an error message.
   */
  const login = async (username, password) => {
    const response = await fetch(`https://${BACKEND_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      response.json().then((data) => {
        return data.message;
      });
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);

    const userFetch = await fetch(`https://${BACKEND_URL}/user/me`, {
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
    });

    const user = await userFetch.json();

    setUser(user.user);

    navigate("/profile");
  };

  /**
   * Registers a new user.
   *
   * @remarks Upon success, navigates to "/".
   * @param {Object} userData - The data of the user to register.
   * @returns {string} - Upon failure, returns an error message.
   */
  const register = async (userData) => {
    const response = await fetch(`https://${BACKEND_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      response.json().then((data) => {
        return data.message;
      });
    }

    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
