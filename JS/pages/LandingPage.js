import { Nav } from './Nav.js';

export function LandingPage() {
    return `${Nav('landing')}
    <div style="padding-top:80px;">

        <!-- Hero -->
        <section style="min-height:92vh;display:flex;align-items:center;justify-content:center;padding:80px 24px 60px;text-align:center;position:relative;">
            <div class="anim-fadeUp" style="max-width:760px;margin:0 auto;">
                <div class="badge anim-fadeUp" style="display:inline-block;margin-bottom:28px;transition:transform 0.5s ease, background 0.5s ease;">Your ocean of calm</div>

                <div style="display:flex;gap:40px;align-items:center;margin-bottom:24px;transition:all 0.8s ease;">
                    <!-- Title on left -->
                    <div style="flex:1;text-align:left;animation:slide-in-left 1s ease-out;">
                        <h1 class="anim-fadeUp delay-1" style="font-family:'Sora',sans-serif;font-size:clamp(40px,6vw,72px);font-weight:700;line-height:1.1;letter-spacing:-0.02em;transition:transform 0.5s ease, color 0.5s ease;animation: color-shift 3s ease-in-out infinite;">
                            Digital Mental Health Wellness
                        </h1>
                    </div>
                    <!-- Stats on right -->
                    <div style="flex:1;animation:slide-in-right 1s ease-out;">
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:420px;">
                            ${[['10k+','Active users'],['98%','Feel supported'],['24 / 7','AI companion']].map(([n,l]) => `
                                <div class="stat-card anim-glow" style="padding:16px 10px;border-radius:14px;text-align:center;transition:transform 0.3s ease, box-shadow 0.3s ease;">
                                    <div class="text-aurora" style="font-family:'Sora',sans-serif;font-size:22px;font-weight:700;">${n}</div>
                                    <div style="color:var(--text-muted);font-size:12px;margin-top:2px;">${l}</div>
                                </div>`
                            ).join('')}
                        </div>
                    </div>
                </div>

                <p class="anim-fadeUp delay-2" style="font-size:18px;color:var(--text-secondary);line-height:1.7;max-width:500px;margin:0 auto 40px;transition:opacity 0.5s ease, transform 0.5s ease;">
                    Track your moods, talk to an AI companion, and discover the patterns that shape your emotional world — in a safe, private space.
                </p>
            </div>
        </section>

        <!-- Features -->
        <section id="features" style="padding:100px 24px;">
            <div style="max-width:1100px;margin:0 auto;">
                <div style="text-align:center;margin-bottom:60px;">
                    <div class="badge" style="display:inline-block;margin-bottom:16px;">Features</div>
                    <h2 style="font-family:'Sora',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:700;margin-bottom:14px;">Everything you need to feel better</h2>
                    <p style="color:var(--text-secondary);font-size:17px;max-width:480px;margin:0 auto;">Built for real people navigating the full spectrum of human emotion.</p>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
                    ${[
                        {icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`, bg:'icon-bg-teal', t:'Mood Tracking', d:'Daily mood logs with beautiful visual trends over time.'},
                        {icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`, bg:'icon-bg-green', t:'AI Companion', d:'Compassionate 24/7 conversations — never judgmental, always present.'},
                        {icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`, bg:'icon-bg-cyan', t:'Wellness Insights', d:'Pattern recognition and trend charts to understand yourself better.'},
                        {icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`, bg:'icon-bg-violet', t:'Private & Secure', d:'Your data is encrypted and only ever yours.'},
                    ].map(f => `
                        <div class="feature-card" style="border-radius:20px;padding:28px 22px;backdrop-filter:blur(20px);">
                            <div class="${f.bg}" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;">${f.icon}</div>
                            <h3 style="font-family:'Sora',sans-serif;font-size:16px;font-weight:600;margin-bottom:8px;color:var(--text-primary);">${f.t}</h3>
                            <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;">${f.d}</p>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </section>

        <!-- How it works -->
        <section id="howItWorks" style="padding:100px 24px;">
            <div style="max-width:900px;margin:0 auto;text-align:center;">
                <div class="badge" style="display:inline-block;margin-bottom:16px;">How it works</div>
                <h2 style="font-family:'Sora',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:700;margin-bottom:14px;">Start feeling better in minutes</h2>
                <p style="color:var(--text-secondary);font-size:17px;margin-bottom:60px;">No waitlists. No forms. Just sign up and begin.</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:28px;">
                    ${[
                        {n:'1',t:'Create your account',d:'Sign up free in under a minute — no credit card needed.'},
                        {n:'2',t:'Track your first mood',d:"Log how you're feeling and what's on your mind."},
                        {n:'3',t:'Chat with companion',d:'Talk to our AI any time — private, compassionate, always available.'},
                        {n:'4',t:'See your progress',d:'Watch your emotional patterns emerge and improve over time.'},
                    ].map(s => `
                        <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
                            <div class="step-num" style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:700;">${s.n}</div>
                            <h3 style="font-family:'Sora',sans-serif;font-size:15px;font-weight:600;color:var(--text-primary);">${s.t}</h3>
                            <p style="color:var(--text-secondary);font-size:13px;line-height:1.6;">${s.d}</p>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </section>

        <!-- Testimonials -->
        <section style="padding:100px 24px;">
            <div style="max-width:1000px;margin:0 auto;">
                <div style="text-align:center;margin-bottom:56px;">
                    <div class="badge" style="display:inline-block;margin-bottom:16px;">Stories</div>
                    <h2 style="font-family:'Sora',sans-serif;font-size:clamp(28px,4vw,40px);font-weight:700;">People who found their balance</h2>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;">
                    ${[
                        {q:"Tracking daily showed me how much sleep was affecting my anxiety. A genuine game changer.", name:"Sifundo Dube", role:"User since April 2026", init:"SD"},
                        {q:"The AI companion is non-judgmental. I talk to it on the nights I can't face anyone else.", name:"Cebolakhe Mlambo", role:"User since April 2026", init:"CM"},
                        {q:"Seeing my mood charts improve feels like real proof that healing is actually happening.", name:"Nkosinathi T", role:"User since April 2026", init:"NT"},
                    ].map(t => `
                        <div class="t-card" style="border-radius:20px;padding:24px;backdrop-filter:blur(20px);">
                            <div style="display:flex;gap:3px;margin-bottom:16px;">${'★★★★★'.split('').map(()=>`<span style="color:#f59e0b;font-size:13px;">★</span>`).join('')}</div>
                            <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;font-style:italic;margin-bottom:20px;">"${t.q}"</p>
                            <div style="display:flex;align-items:center;gap:10px;">
                                <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:600;font-family:'Sora',sans-serif;">${t.init}</div>
                                <div>
                                    <div style="color:var(--text-primary);font-size:13px;font-weight:500;font-family:'Sora',sans-serif;">${t.name}</div>
                                    <div style="color:var(--text-muted);font-size:11px;">${t.role}</div>
                                </div>
                            </div>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </section>

        <!-- Resources/Blog -->
        <section id="resources" style="padding:100px 24px;">
            <div style="max-width:1100px;margin:0 auto;">
                <div style="text-align:center;margin-bottom:60px;">
                    <div class="badge" style="display:inline-block;margin-bottom:16px;">Resources</div>
                    <h2 style="font-family:'Sora',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:700;margin-bottom:14px;">Learn from expert resources</h2>
                    <p style="color:var(--text-secondary);font-size:17px;max-width:480px;margin:0 auto;">Explore articles, guides, and tips to support your mental wellness journey.</p>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;">
                    ${[
                        {title:'Understanding Anxiety', category:'Mental Health', icon:'', desc:'Learn practical techniques to manage anxiety and find calm in challenging moments.'},
                        {title:'Sleep and Mental Health', category:'Wellness', icon:'', desc:'Discover how quality sleep impacts your emotional wellbeing and mood patterns.'},
                        {title:'Building Resilience Daily', category:'Self-Care', icon:'', desc:'Small daily practices that compound into stronger emotional resilience over time.'},
                        {title:'Mood Tracking Benefits', category:'Tips', icon:'', desc:'Why tracking your moods reveals patterns and empowers better emotional decisions.'},
                    ].map(r => `
                        <div class="feature-card" style="border-radius:20px;padding:28px 22px;backdrop-filter:blur(20px);cursor:pointer;transition:all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(14,165,233,0.12)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow=''">
                            <div style="font-size:32px;margin-bottom:12px;">${r.icon}</div>
                            <div class="badge" style="display:inline-block;margin-bottom:12px;font-size:11px;">${r.category}</div>
                            <h3 style="font-family:'Sora',sans-serif;font-size:17px;font-weight:600;margin-bottom:8px;color:var(--text-primary);">${r.title}</h3>
                            <p style="color:var(--text-secondary);font-size:13px;line-height:1.6;">${r.desc}</p>
                            <p style="color:#60a5fa;font-size:12px;margin-top:14px;font-weight:500;">Read more →</p>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" style="padding:100px 24px;">
            <div style="max-width:800px;margin:0 auto;">
                <div style="text-align:center;margin-bottom:60px;">
                    <div class="badge" style="display:inline-block;margin-bottom:16px;">FAQ</div>
                    <h2 style="font-family:'Sora',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:700;margin-bottom:14px;">Frequently asked questions</h2>
                    <p style="color:var(--text-secondary);font-size:17px;max-width:500px;margin:0 auto;">Find answers to common questions about our platform and mental health support.</p>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px;">
                    ${[
                        {q:'Is my data really private?', a:'Yes. Your data is encrypted end-to-end using industry standard SSL encryption. We never sell or share your personal information. You own your data completely.'},
                        {q:'Do I need a credit card to start?', a:'No credit card required. You can sign up and start using Digital Mental Health Platform completely free. We offer premium features in the future, but the core app is always free.'},
                        {q:'Can I export my mood history?', a:'Yes. You can download all your mood data and chat history as a JSON file anytime from your Profile settings. Full data portability is a core value for us.'},
                        {q:'Is the AI companion a replacement for therapy?', a:'No. Our AI companion is a supportive tool for daily emotional awareness and conversation — not a replacement for professional mental health care. If you\'re in crisis, please reach out to a professional.'},
                        {q:'How accurate are the mood patterns?', a:'The patterns are as accurate as your tracking. The more consistently you log your moods, the better the insights. Even irregular tracking reveals valuable trends about your emotional cycles.'},
                        {q:'Can I use this on mobile?', a:'Yes. Our app works great on mobile browsers. We\'re also building dedicated iOS and Android apps for launch later this year.'},
                    ].map((item, idx) => `
                        <div class="glass" style="border-radius:16px;padding:20px;cursor:pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('svg').style.transform = this.nextElementSibling.style.display === 'none' ? 'rotate(0deg)' : 'rotate(180deg)'">
                            <div style="display:flex;align-items:center;justify-content:space-between;">
                                <h3 style="font-family:'Sora',sans-serif;font-size:15px;font-weight:600;color:var(--text-primary);">${item.q}</h3>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--aurora-1);transition:transform 0.3s ease;flex-shrink:0;"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                        </div>
                        <div style="display:none;padding:0 20px 16px;color:var(--text-secondary);font-size:14px;line-height:1.7;">${item.a}</div>`
                    ).join('')}
                </div>
            </div>
        </section>

        <!-- Newsletter -->
        <section style="padding:100px 24px;">
            <div style="max-width:600px;margin:0 auto;">
                <div class="glass-2" style="border-radius:28px;padding:60px 40px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:20px;"></div>
                    <h2 style="font-family:'Sora',sans-serif;font-size:clamp(26px,4vw,36px);font-weight:700;margin-bottom:12px;">Stay updated</h2>
                    <p style="color:var(--text-secondary);font-size:15px;margin-bottom:32px;line-height:1.7;">Get weekly mental wellness tips, research insights, and platform updates delivered to your inbox.</p>
                    <div style="display:flex;gap:10px;margin-bottom:16px;">
                        <input type="email" id="newsletterEmail" class="input-glass" style="flex:1;border-radius:12px;padding:13px 16px;font-size:14px;" placeholder="you@example.com">
                        <button id="newsletterBtn" class="btn-primary" style="padding:13px 24px;border-radius:12px;font-size:14px;cursor:pointer;white-space:nowrap;font-family:'Sora',sans-serif;font-weight:500;" onclick="subscribeNewsletter()">Subscribe</button>
                    </div>
                    <p style="color:var(--text-muted);font-size:12px;">We respect your privacy. Unsubscribe anytime.</p>
                    <div id="newsletterMessage" style="margin-top:16px;display:none;padding:10px 14px;border-radius:10px;font-size:13px;"></div>
                </div>
            </div>
        </section>

        <!-- CTA -->
        <section style="padding:80px 24px 120px;">
            <div style="max-width:640px;margin:0 auto;text-align:center;">
                <div class="glass" style="border-radius:28px;padding:60px 40px;">
                        <h2 style="font-family:'Sora',sans-serif;font-size:clamp(26px,4vw,38px);font-weight:700;margin-bottom:12px;">Ready to begin your<br><span class="text-aurora">wellness journey?</span></h2>
                    <p style="color:var(--text-secondary);font-size:16px;margin-bottom:32px;">Join thousands building healthier emotional habits every day.</p>
                    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
                        <button onclick="goto('signup')" class="btn-primary" style="padding:14px 32px;border-radius:12px;font-size:15px;cursor:pointer;">Sign up — it's free</button>
                        <button onclick="goto('login')" class="btn-ghost" style="padding:14px 24px;border-radius:12px;font-size:15px;cursor:pointer;">Log in</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer style="border-top:1px solid rgba(56,189,248,0.1);padding:28px 24px;">
            <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <span style="color:var(--text-muted);font-size:13px;">© 2026 Digital Mental Health Platform. All rights reserved.</span>
                </div>
                <div style="display:flex;gap:20px;">
                    ${['About','Privacy','Terms','Support'].map(l => `<button onclick="goto('${l.toLowerCase()}')" style="color:var(--text-muted);font-size:13px;background:none;border:none;cursor:pointer;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'>${l}</button>`).join('')}
                </div>
            </div>
        </footer>
    </div>`;
}
