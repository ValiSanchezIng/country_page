"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Plain JS auth context (no Flow/TS types)
const AuthContext = createContext(undefined)

// Mock users for demonstration
const MOCK_USERS = {
    "maria@example.com": {
        password: "password",
        user: { id: "2", name: "María García", level: "avanzado" },
    },
    "carlos@example.com": {
        password: "password",
        user: { id: "1", name: "Carlos Rodríguez", level: "Intermedio" },
    },
    "ana@example.com": {
        password: "password",
        user: { id: "3", name: "Ana Martínez", level: "Avanzado" },
    },
    "admin@example.com": {
        password: "admin",
        user: { id: "admin", name: "Administrador", level: "Avanzado", isAdmin: true },
    },
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check for stored user on mount
        const storedUser = sessionStorage.getItem("equestrian_user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setIsLoading(false)
    }, [])

    const login = async (email, password) => {
        // Mock authentication
        const userRecord = MOCK_USERS[email]
        if (userRecord && userRecord.password === password) {
            setUser(userRecord.user)
            sessionStorage.setItem("equestrian_user", JSON.stringify(userRecord.user))
            return true
        }
        return false
    }

    const logout = () => {
        setUser(null)
        sessionStorage.removeItem("equestrian_user")
    }

    return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
