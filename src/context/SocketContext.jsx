import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        let newSocket;
        try {
            newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
                transports: ['websocket', 'polling'], // Allow polling fallbacks
                reconnectionAttempts: 5,
            });
            console.log("Socket initializing...");

            newSocket.on('connect_error', (err) => {
                console.error("Socket Connection Error:", err);
            });

            setSocket(newSocket);
        } catch (error) {
            console.error("Socket Init Failed:", error);
        }

        return () => {
            if (newSocket) newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
