async function executeQuery(sql) {
  const res = await fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: 'proj_piinupj40', sql })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChat');

let isTyping = false;

function appendMessage(role, content) {
    const div = document.createElement('div');
    div.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const inner = document.createElement('div');
    inner.className = `max-w-[80%] p-3 rounded-lg ${role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'}`;
    
    if (role === 'assistant') {
        inner.innerHTML = marked.parse(content);
    } else {
        inner.textContent = content;
    }
    
    div.appendChild(inner);
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function loadHistory() {
    try {
        const result = await executeQuery("SELECT * FROM chat_messages ORDER BY created_at ASC");
        chatContainer.innerHTML = '';
        result.forEach(msg => appendMessage(msg.role, msg.content));
    } catch (err) {
        console.error("Failed to load history", err);
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text || isTyping) return;

    userInput.value = '';
    isTyping = true;
    sendBtn.disabled = true;

    // 1. Save User Message to DB
    appendMessage('user', text);
    try {
        await executeQuery(`INSERT INTO chat_messages (role, content) VALUES ('user', '${text.replace(/'/g, "''")}')`);
        
        // 2. Call AI API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });
        
        if (!response.ok) throw new Error("AI API Error");
        const data = await response.json();
        
        // 3. Save AI Response to DB
        await executeQuery(`INSERT INTO chat_messages (role, content) VALUES ('assistant', '${data.text.replace(/'/g, "''")}')`);
        
        appendMessage('assistant', data.text);
    } catch (err) {
        console.error(err);
        appendMessage('assistant', "Sorry, I encountered an error. Please check your deployment.");
    } finally {
        isTyping = false;
        sendBtn.disabled = false;
    }
});

clearChatBtn.addEventListener('click', async () => {
    if (confirm("Clear all chat history?")) {
        await executeQuery("DELETE FROM chat_messages");
        chatContainer.innerHTML = '';
    }
});

loadHistory();