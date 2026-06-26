/* 
   Analytica GitHub Backup - Simple Jugad
   Save this as github-backup.js and include it in index.html
*/

function setupGitHubBackup() {
  const repo = "bpsky/analytica-mock-tracker";

  // Push data to GitHub
  window.pushToGitHub = async function() {
    const token = localStorage.getItem('ghToken');
    if (!token) {
      alert("❌ Please save your GitHub token in Settings first!");
      Pages.nav('settings');
      return;
    }
    UI.toast('Pushing backup to GitHub...', 'info');
    try {
      const dataStr = Store.exportJSON();
      const content = btoa(unescape(encodeURIComponent(dataStr)));
      
      let sha = null;
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}/contents/analytica-data.json`, {
          headers: { 'Authorization': `token ${token}` }
        });
        if (res.ok) sha = (await res.json()).sha;
      } catch(e) {}

      const response = await fetch(`https://api.github.com/repos/${repo}/contents/analytica-data.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Analytica Backup ${new Date().toISOString()}`,
          content: content,
          sha: sha
        })
      });

      if (response.ok) {
        UI.toast('✅ Backup saved to GitHub successfully!', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch(e) {
      console.error(e);
      UI.toast('❌ Failed to push: ' + e.message, 'error');
    }
  };

  // Pull data from GitHub
  window.pullFromGitHub = async function() {
    const token = localStorage.getItem('ghToken');
    if (!token) {
      alert("❌ No token saved. Please save it first.");
      return;
    }
    UI.toast('Pulling backup from GitHub...', 'info');
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/analytica-data.json`, {
        headers: { 'Authorization': `token ${token}` }
      });
      if (!res.ok) throw new Error("No backup file found on GitHub");
      
      const file = await res.json();
      const data = JSON.parse(atob(file.content));
      
      Store.importData(data, 'merge');
      UI.toast('✅ Data restored from GitHub!', 'success');
      setTimeout(() => location.reload(), 1200);
    } catch(e) {
      console.error(e);
      UI.toast('❌ No backup found or error: ' + e.message, 'error');
    }
  };

  // Modify Settings page to add the backup UI
  const originalSettings = Pages.settings || function(){};
  Pages.settings = function() {
    originalSettings.call(this);
    
    setTimeout(() => {
      // Find a place to insert the new card (after Data Management)
      let target = document.querySelector('.card:has(.i-database)') || 
                   document.querySelectorAll('.card')[document.querySelectorAll('.card').length - 1];
      
      if (target && target.parentNode) {
        const ghCard = document.createElement('div');
        ghCard.className = 'card mb-4';
        ghCard.innerHTML = `
          <div class="card-header">
            <div class="card-title"><i class="i-github"></i> GitHub Cloud Backup</div>
          </div>
          <div class="field">
            <label>Personal Access Token</label>
            <input type="password" class="input" id="ghTokenInput" 
                   placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                   value="${localStorage.getItem('ghToken') || ''}">
            <div class="text-xs text-muted mt-1">Saved only in your browser • Requires 'repo' scope</div>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button class="btn" id="saveGhTokenBtn">💾 Save Token</button>
            <button class="btn" id="pushGhBtn">☁️ Push Backup to GitHub</button>
            <button class="btn" id="pullGhBtn">📥 Pull Backup from GitHub</button>
          </div>
        `;
        target.parentNode.insertBefore(ghCard, target.nextSibling);

        // Button handlers
        document.getElementById('saveGhTokenBtn').onclick = () => {
          const token = document.getElementById('ghTokenInput').value.trim();
          if (token) {
            localStorage.setItem('ghToken', token);
            UI.toast('Token saved securely in browser!', 'success');
          } else {
            UI.toast('Please enter a token', 'error');
          }
        };

        document.getElementById('pushGhBtn').onclick = window.pushToGitHub;
        document.getElementById('pullGhBtn').onclick = window.pullFromGitHub;
      }
    }, 600);
  };
}

// Auto initialize
setupGitHubBackup();
console.log('✅ GitHub Backup module loaded');
