import { io } from "socket.io-client";

import config from "../config";

export const initSocket = (userId: string) => {
  const newSocket = io(config.backendDomain, {
    withCredentials: true,
  });
  newSocket.on("connect", () => {
    console.log("Connected to backend socket:", newSocket.id);
    newSocket.emit("join-room", { roomId: `user-${userId}` });
  });

  return newSocket;
};
