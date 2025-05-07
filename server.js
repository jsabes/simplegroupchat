const express = require("express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

// Setup express and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://jackson:jackson1@cluster0.w2cboqo.mongodb.net/chat?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Define a simple Message schema
const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  timestamp: String,
});

const Message = mongoose.model("Message", messageSchema);

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Handle socket.io connections
io.on("connection", async (socket) => {
  console.log("🔌 A user connected");

  // Send recent message history (last 50 messages)
  const history = await Message.find().sort({ timestamp: 1 }).limit(50);
  socket.emit("load history", history);

  // Handle new message
  socket.on("chat message", async (data) => {
    const msg = new Message(data);
    await msg.save();
    io.emit("chat message", data); // Broadcast to everyone
  });

  // Handle typing notification
  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data); // Send to everyone except sender
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
