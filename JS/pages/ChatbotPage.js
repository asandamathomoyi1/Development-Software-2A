import { Nav } from './Nav.js';

export function ChatbotPage(currentUser) {
  return `${Nav('chatbot', currentUser)}
    <div style="padding-top:64px;height:100vh;display:flex;flex-direction:column;">
        <!-- Chat header -->
        <div style="background:rgba(3,13,23,0.8);backdrop-filter:blur(30px);border-bottom:1px solid rgba(56,189,248,0.12);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:14px;">
            <div style="display:flex;align-items:center;gap:14px;">
                <button onclick="goto('dashboard')" class="btn-secondary" style="padding:10px 14px;border-radius:12px;font-size:13px;cursor:pointer;">← Back</button>
                <div style="display:flex;align-items:center;gap:14px;">
                    <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <div>
                        <div style="font-family:'Sora',sans-serif;font-weight:600;font-size:15px;color:var(--text-primary);">Digital Mental Health Platform Companion</div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <div style="width:7px;height:7px;border-radius:50%;background:#34d399;"></div>
                            <span style="color:var(--text-muted);font-size:12px;">Always here for you</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Messages -->
        <div id="chatList" style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px;"></div>

        <!-- Input -->
        <div style="background:rgba(3,13,23,0.88);backdrop-filter:blur(30px);border-top:1px solid rgba(56,189,248,0.16);padding:16px 24px;">
            <div style="max-width:800px;margin:0 auto;display:flex;gap:10px;align-items:flex-end;">
                <textarea id="chatInput" class="input-glass" style="flex:1;min-height:72px;max-height:220px;border-radius:14px;padding:16px 18px;font-size:15px;line-height:1.6;color:var(--text-primary);background:rgba(255,255,255,0.06);border:1px solid rgba(147,197,253,0.22);resize:none;"
                    rows="1" placeholder="Type your message here..."
                    oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,220)+'px'"
                    onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submitChat();}"></textarea>
                <button onclick="submitChat()" class="btn-primary" style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;background:linear-gradient(135deg,#3b82f6,#2563eb);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </div>
        </div>
    </div>`;
}
