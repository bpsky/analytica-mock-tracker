/* Analytica - Simple GitHub Backup Jugad */
function setupGitHubBackup() {
  const repo = "bpsky/analytica-mock-tracker";

  window.pushToGitHub = async () => {
    const token = localStorage.getItem('ghToken');
    if (!token) {
      alert("Please go to Settings and save your GitHub token first!");
      Pages.nav('settings');
      return;
    }
    UI.toast('Pushing to GitHub...', 'info');
    try {
      const dataStr = Store.exportJSON();
      const content = btoa(unescape(encodeURIComponent(dataStr)));
      let sha = null;
      try {
        const r = await fetch(`https://api.github.com/repos/${repo}/contents/analytica-data.json`, {
          headers: {'Authorization': `token ${token}`}
        });
        if (r.ok) sha = (await r.json()).sha;
      } catch(e) {}
      await fetch(`https://api.github.com/repos/${repo}/contents/analytica-data.json`, {
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
      UI.toast('✅ Backup saved to GitHub!', 'success');
    } catch(e) {
      UI.toast('❌ Error: ' + e.message, 'error');
    }
  };

  window.pullFromGitHub = async () => {
    const token = localStorage.getItem('ghToken');
    if (!token) return alert("No token saved");
    UI.toast('Pulling from GitHub...', 'info');
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/contents/analytica-data.json`, {
        headers: {'Authorization': `token ${token}`}
      });
      if (!r.ok) throw new Error("No backup found");
      const file = await r.json();
      Store.importData(JSON.parse(atob(file.content)), 'merge');
      UI.toast('✅ Restored from GitHub!', 'success');
      setTimeout(() => location.reload(), 1000);
    } catch(e) {
      UI.toast('❌ No backup found', 'error');
    }
  };

  const originalSettings = Pages.settings;
  Pages.settings = function() {
    originalSettings();
    setTimeout(() => {
      const dataCard = document.querySelector('.card:has(.i-database)');
      if (dataCard) {
        const ghCard = document.createElement('div');
        ghCard.className = 'card mb-4';
        ghCard.innerHTML = `
          <div class="card-header"><div class="card-title"><i class="i-github"></i> GitHub Backup (Cloud)</div></div>
          <div class="field">
            <label>GitHub Token</label>
            <input class="input" type="password" id="ghTokenInput" placeholder="ghp_..." value="${localStorage.getItem('ghToken')||''}">
          </div>
          <div class="flex gap-2">
            <button class="btn" id="saveGhToken">Save Token</button>
            <button class="btn" id="pushGh">💾 Push Backup</button>
            <button class="btn" id="pullGh">📥 Pull Backup</button>
          </div>
        `;
        dataCard.parentNode.insertBefore(ghCard, dataCard.nextSibling);

        document.getElementById('saveGhToken').onclick = () => {
          const t = document.getElementById('ghTokenInput').value.trim();
          if (t) {
            localStorage.setItem('ghToken', t);
            UI.toast('Token saved!', 'success');
          }
        };
        document.getElementById('pushGh').onclick = window.pushToGitHub;
        document.getElementById('pullGh').onclick = window.pullFromGitHub;
      }
    }, 400);
  };
}
setupGitHubBackup();
