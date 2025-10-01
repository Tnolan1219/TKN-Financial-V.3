const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const chatPanel = document.getElementById("chat-panel");

// ✅ Toggle Panel Open/Close
function toggleChatPanel() {
  chatPanel.classList.toggle("open");
}

// ✅ OpenAI API Key
const OPENAI_API_KEY = "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";

// ✅ Session memory
let messages = [
  { role: "system", content: "You are a military personal finance advisor. Be direct, modular, and mission-ready." }
];

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("You", message, "user-message");
  userInput.value = "";
  messages.push({ role: "user", content: message });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages
    })
  });

  const data = await response.json();
  const reply = data.choices[0].message.content;
  messages.push({ role: "assistant", content: reply });

  appendMessage("Major Money", reply, "bot-message");
}

function appendMessage(sender, text, className) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", className);
  messageDiv.innerHTML = `<strong>${sender}:</strong><br>${formatText(text)}`;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function formatText(text) {
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join("");
}
