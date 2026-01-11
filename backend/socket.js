import User from "./models/user.model.js";

/**
 * Socket.IO Event Handler
 * Manages real-time communication for:
 * - User identity binding (socket <-> userId)
 * - Delivery boy live location tracking
 * - Online/offline status management
 */
export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    // Bind socket to user for targeted notifications
    socket.on("identity", async ({ userId }) => {
      try {
        const user = await User.findByIdAndUpdate(
          userId,
          {
            socketId: socket.id,
            isOnline: true,
          },
          { new: true }
        );
        
        socket.join(userId);  // Join room for direct messaging
      } catch (error) {
        console.error("Identity error:", error);
      }
    });

    // Broadcast delivery boy location to all connected clients
    socket.on("updateLocation", async ({ latitude, longitude, userId }) => {
      try {
        const user = await User.findByIdAndUpdate(userId, {
          location: {
            type: "Point",
            coordinates: [longitude, latitude],  // GeoJSON format: [lng, lat]
          },
          isOnline: true,
          socketId: socket.id,
        });

        if (user) {
          io.emit("updateDeliveryLocation", {
            deliveryBoyId: userId,
            latitude,
            longitude,
          });
        }
      } catch (error) {
        console.error("updateDeliveryLocation error", error);
      }
    });

    // Cleanup on disconnect
    socket.on("disconnect", async () => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          {
            socketId: null,
            isOnline: false,
          }
        );
      } catch (error) {
        console.error(error);
      }
    });
  });
};
