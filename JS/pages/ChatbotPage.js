import { Nav } from './Nav.js';

export function ChatbotPage(currentUser) {
    return `${Nav('chatbot', currentUser)}
    <div style="padding-top:80px;height:100vh;display:flex;flex-direction:column;max-width:760px;margin:0 auto;padding-left:16px;padding-right:16px;">

        <!-- Header -->
        <div class="glass" style="border-radius:18px;padding:16px 20px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-shrink:0;">
            <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div style="flex:1;min-width:0;">
                <h2 style="font-family:'Sora',sans-serif;font-size:16px;font-weight:600;margin-bottom:2px;">AI Wellness Companion</h2>
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;animation:pulse-glow 2s infinite;"></div>
                    <span style="color:var(--text-muted);font-size:12px;">Online — here for you</span>
                </div>
            </div>
            <button onclick="goto('dashboard')" style="background:none;border:1px solid rgba(96,165,250,0.2);color:var(--text-muted);font-size:12px;padding:7px 14px;border-radius:8px;cursor:pointer;white-space:nowrap;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='var(--text-muted)'">← Dashboard</button>
        </div>

        <!-- Messages -->
        <div id="chatList" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding:4px 2px 8px;scroll-behavior:smooth;">
            <!-- Messages rendered by renderChatMessages() -->
        </div>

        <!-- Quick prompts -->
        <div id="quickPrompts" style="display:flex;gap:8px;overflow-x:auto;padding:10px 0 4px;flex-shrink:0;scrollbar-width:none;">
            ${[
              { label: "😟 Feeling anxious",    text: "I am feeling anxious today and could use some support. Can you help me calm down?" },
              { label: "🧘 Help me calm down",  text: "I need help calming down right now. Can you guide me through something?" },
              { label: "💪 Need motivation",    text: "I am struggling to find motivation today. Can you help lift my spirits?" },
              { label: "😴 Can't sleep",         text: "I have been having trouble sleeping. My mind won't stop racing at night." },
              { label: "😔 Feeling lonely",      text: "I have been feeling really lonely lately and just need someone to talk to." },
              { label: "😤 Feeling stressed",    text: "I am under a lot of stress right now and don't know where to start." },
              { label: "😢 Feeling sad",         text: "I have been feeling sad and low for a while. I want to talk about it." },
              { label: "🌟 I feel good!",        text: "I am actually feeling pretty good today! I want to share what has been helping me." },
            ].map(p => `
                <button onclick="fillPrompt(${JSON.stringify(p.text)}, this)"
                    style="white-space:nowrap;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.25);color:#93c5fd;font-size:12px;padding:7px 14px;border-radius:20px;cursor:pointer;transition:all 0.2s;flex-shrink:0;"
                    onmouseover="this.style.background='rgba(59,130,246,0.22)';this.style.borderColor='rgba(96,165,250,0.5)'"
                    onmouseout="if(!this.classList.contains('active-chip')){this.style.background='rgba(59,130,246,0.12)';this.style.borderColor='rgba(59,130,246,0.25)';this.style.color='#93c5fd'}"
                    title="Click to fill — edit if needed, then press Send"
                >${p.label}</button>
            `).join('')}
        </div>

        <!-- Input bar -->
        <div class="glass" style="border-radius:16px;padding:12px 14px;margin-bottom:16px;display:flex;align-items:flex-end;gap:10px;flex-shrink:0;">
            <textarea
                id="chatInput"
                class="input-glass"
                rows="1"
                placeholder="Share what's on your mind…"
                style="flex:1;border-radius:10px;padding:10px 14px;font-size:14px;resize:none;min-height:42px;max-height:120px;line-height:1.5;overflow-y:auto;"
                onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submitChat();}"
                oninput="autoResizeTextarea(this)"
            ></textarea>
            <button
                onclick="submitChat()"
                style="
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border: none;
                    border-radius: 10px;
                    padding: 0 20px;
                    height: 42px;
                    min-width: 72px;
                    color: #fff;
                    font-family: 'Sora', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 14px rgba(59,130,246,0.4);
                "
                onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(59,130,246,0.55)';"
                onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 14px rgba(59,130,246,0.4)';"
                onmousedown="this.style.transform='translateY(0)';"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Send
            </button>
        </div>
    </div>

    <style>
        #chatList::-webkit-scrollbar { width: 4px; }
        #chatList::-webkit-scrollbar-thumb { background: rgba(96,165,250,0.2); border-radius: 4px; }
        #quickPrompts::-webkit-scrollbar { display: none; }
        .typing-dots span {
            display: inline-block;
            width: 7px; height: 7px;
            border-radius: 50%;
            background: #60a5fa;
            margin: 0 2px;
            animation: typing 1.2s ease-in-out infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    </style>

    <script>
        function autoResizeTextarea(el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
        }

        // Fill the input and focus it — user edits if needed, then clicks Send
        function fillPrompt(text, btn) {
            const inp = document.getElementById('chatInput');
            if (!inp) return;

            // Put the text in the textarea
            inp.value = text;
            autoResizeTextarea(inp);
            inp.focus();
            inp.setSelectionRange(inp.value.length, inp.value.length);

            // Reset all chips to default style
            document.querySelectorAll('#quickPrompts button').forEach(function(b) {
                b.classList.remove('active-chip');
                b.style.background = 'rgba(59,130,246,0.12)';
                b.style.borderColor = 'rgba(59,130,246,0.25)';
                b.style.color = '#93c5fd';
                b.style.fontWeight = '400';
            });

            // Highlight the selected chip
            if (btn) {
                btn.classList.add('active-chip');
                btn.style.background = 'rgba(59,130,246,0.4)';
                btn.style.borderColor = 'rgba(147,197,253,0.9)';
                btn.style.color = '#ffffff';
                btn.style.fontWeight = '600';
            }
        }
    </script>`;
}
