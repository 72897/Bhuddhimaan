import { useState } from "react";
import axios from "axios";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);

    const res = await axios.post("http://localhost:5000/chat", {
      message: input,
    });

    setMessages([
      ...newMessages,
      { role: "bot", text: res.data.reply },
    ]);

    setInput("");
  };

  return (
    <div>
      {/* Floating Button */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "#007bff",
          cursor: "pointer",
        }}
      />

      {/* Chat Window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            left: "20px",
            width: "300px",
            height: "400px",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "10px",
          }}
        >
          <div style={{ height: "300px", overflowY: "auto" }}>
            {messages.map((msg, i) => (
              <div key={i}>
                <b>{msg.role}:</b> {msg.text}
              </div>
            ))}
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}