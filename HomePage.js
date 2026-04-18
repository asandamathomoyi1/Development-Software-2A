document.addEventListener('DOMContentLoaded', function() {
    
    const loggedInUser = localStorage.getItem('loggedInUser');
    const usernameDisplay = document.getElementById('usernameDisplay');
    if(usernameDisplay && loggedInUser) {
        usernameDisplay.innerText = loggedInUser;
    } else if(usernameDisplay) {
        usernameDisplay.innerText = 'User';
    }
    
    
    function loadMoodHistory() {
        const moods = JSON.parse(localStorage.getItem('moodHistory') || '[]');
        const moodHistory = document.getElementById('moodHistory');
        
        if(moodHistory) {
            
            const totalMoods = moods.length;
            const positiveMoods = moods.filter(mood => mood.mood === 'Good' || mood.mood === 'Excellent').length;
            const percentage = totalMoods > 0 ? Math.round((positiveMoods / totalMoods) * 100) : 0;
            
            
            const progressFill = document.querySelector('.progress-fill');
            const progressText = document.querySelector('.progress-text');
            if(progressFill) progressFill.style.width = percentage + '%';
            if(progressText) progressText.innerText = percentage + '% of entries';
            
            
            const totalEntriesEl = document.getElementById('totalEntries');
            const positiveEntriesEl = document.getElementById('positiveEntries');
            const avgMoodEl = document.getElementById('avgMood');
            const streakEl = document.getElementById('streak');
            if(totalEntriesEl) totalEntriesEl.innerText = totalMoods;
            if(positiveEntriesEl) positiveEntriesEl.innerText = positiveMoods;
            
            
            const moodScores = { 'Very Low': 1, 'Low': 2, 'Neutral': 3, 'Good': 4, 'Excellent': 5 };
            const scores = moods.map(m => moodScores[m.mood] || 3);
            const avgScore = scores.length > 0 ? (scores.reduce((a,b)=>a+b,0) / scores.length).toFixed(1) : 'N/A';
            if(avgMoodEl) avgMoodEl.innerText = avgScore;
            
            
            let streak = 0;
            const sortedMoods = moods.slice().sort((a,b) => new Date(b.date) - new Date(a.date)); 
            for (let mood of sortedMoods) {
                if (mood.mood === 'Good' || mood.mood === 'Excellent') {
                    streak++;
                } else {
                    break;
                }
            }
            if(streakEl) streakEl.innerText = streak;
            
            if(moods.length === 0) {
                moodHistory.innerHTML = 'No moods tracked yet.';
            } else {
                moodHistory.innerHTML = '';
                moods.slice().reverse().forEach(mood => { 
                    const entry = document.createElement('div');
                    entry.className = 'mood-entry';
                    entry.innerHTML = `
                        <strong>${mood.mood}</strong><br>
                        <small>${mood.notes || 'No notes'}</small><br>
                        <small>${new Date(mood.date).toLocaleString()}</small>
                    `;
                    moodHistory.appendChild(entry);
                });
            }
        }
    }
    
    
    const saveBtn = document.getElementById('saveMoodBtn');
    const moodButtons = document.querySelectorAll('.mood-options button');
    const textarea = document.getElementById('moodNotes');
    
    let selectedMood = null;
    
    
    moodButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            moodButtons.forEach(b => b.style.background = 'rgba(255,255,255,0.2)');
            this.style.background = 'rgba(255,255,255,0.6)';
            selectedMood = this.getAttribute('data-mood');
        });
    });
    
    
    if(saveBtn) {
        saveBtn.addEventListener('click', function() {
            if(!selectedMood) {
                alert('❌ Please select a mood');
                return;
            }
            
            const notes = textarea ? textarea.value : '';
            
            
            if(notes.trim() === '') {
                alert('Please describe your feelings.');
                return;
            }
            
            
            const moods = JSON.parse(localStorage.getItem('moodHistory') || '[]');
            moods.push({
                mood: selectedMood,
                notes: notes,
                date: new Date().toISOString()
            });
            localStorage.setItem('moodHistory', JSON.stringify(moods));
            
            alert('✓ Mood saved successfully!');
            
            
            if(textarea) textarea.value = '';
            moodButtons.forEach(b => b.style.background = 'rgba(255,255,255,0.2)');
            selectedMood = null;
            
            
            loadMoodHistory();
        });
    }
    
    const viewReportBtn = document.getElementById('viewReportBtn');
    if(viewReportBtn) {
        viewReportBtn.addEventListener('click', function() {
            const moodHistory = document.getElementById('moodHistory');
            if(!moodHistory || moodHistory.innerText.trim() === 'No moods tracked yet.') {
                alert('No mood entries yet. Track your mood on the home page first.');
                return;
            }
            moodHistory.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
    
    
    loadMoodHistory();
    
    
    window.generateNewTip = function() {
        const tips = [
            "Take a deep breath and appreciate the small things in life.",
            "Practice mindfulness for 5 minutes today.",
            "Reach out to a friend or loved one.",
            "Go for a walk in nature.",
            "Write down three things you're grateful for.",
            "Stay hydrated and eat nourishing foods.",
            "Get enough sleep to recharge your mind.",
            "Try a new hobby or activity.",
            "Be kind to yourself today.",
            "Reflect on your achievements."
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        const dailyTipElement = document.getElementById('dailyTip');
        if(dailyTipElement) {
            dailyTipElement.innerText = randomTip;
        }
    };
});
