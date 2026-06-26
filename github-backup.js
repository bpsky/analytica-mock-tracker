/* =============================================
   Analytica Backup System v1.2
   Local File + GitHub + Simple & Safe
   ============================================= */

const BACKUP = {
  repo: "bpsky/analytica-mock-tracker",
  filename: "analytica-backup.json",
  version: "1.2"
};

function setupBackupSystem() {

  // Export to File
  window.exportToFile = () => {
    const data = Store.exportJSON ? Store.exportJSON() : JSON.stringify(Store.state, null, 2);
    const backup = {
      metadata: {
        app: "analytica-mock-tracker",
        version: BACKUP.version,
        timestamp: new Date().toISOString()
      },
      data: typeof data === 'string' ? JSON.parse(data) : data
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = BACKUP.filename;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('✅ Backup downloaded successfully!', 'success');
  };

  // Import from File
  window.importFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        const dataToImport = backup.data || backup;

        if (confirm("Import this backup? Current data will be merged.")) {
          Store.importData(dataToImport, 'merge');
          UI.toast('✅ Import successful! Refreshing...', 'success');
          setTimeout(() => location.reload(), 800);
        }
      } catch (err) {
        UI.toast('❌ Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Push to GitHub
  window.pushToGitHub = async () => {
    const token = localStorage.getItem('ghToken');
    if (!token) {
      UI.toast('Please save GitHub token in Settings', 'error');
      Pages.nav('settings');
      return;
    }

    UI.toast('Pushing backup...', 'info');
    try {
      const dataStr = Store.exportJSON ? Store.exportJSON() : JSON.stringify(Store.state, null, 2);
      const backup = {
        metadata: { app: "analytica-mock-tracker", version: BACKUP.version, timestamp: new Date().toISOString() },
        data: JSON.parse(dataStr)
      };
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(backup, null, 2))));

      let sha = null;
      try {
        const res = await fetch(`https://api.github.com/repos/\( {BACKUP.repo}/contents/ \){BACKUP.filename}`, {
          headers: { Authorization: `token ${token}` }
        });
        if (res.ok) sha = (await res.json()).sha;
      } catch (_) {}

      const res = await fetch(`https://api.github.com/repos/\( {BACKUP.repo}/contents/ \){BACKUP.filename}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Analytica Backup ${new Date().toISOString()}`,
          content: content,
          sha: sha
        })
      });

      if (res.ok) UI.toast('✅ Backup pushed to GitHub!', 'success');
      else throw new Error('GitHub error');
    } catch (e) {
      UI.toast('❌ Push failed: ' + e.message, 'error');
    }
  };

  // Pull from GitHub
  window.pullFromGitHub = async () => {
    const token = localStorage.getItem('ghToken');
    if (!token) return UI.toast('No GitHub token', 'error');

    UI.toast('Fetching from GitHub...', 'info');
    try {
      const res = await fetch(`https://api.github.com/repos/\( {BACKUP.repo}/contents/ \){BACKUP.filename}`, {
        headers: { Authorization: `token ${token}` }
      });

      if (!res.ok) throw new Error("No backup found");

      const file = await res.json();
      const backup = JSON.parse(atob(file.content));
      const data = backup.data || backup;

      if (confirm("Import backup from GitHub?")) {
        Store.importData(data, 'merge');
        UI.toast('✅ Imported from GitHub!', 'success');
        setTimeout(() => location.reload(), 800);
      }
    } catch (e) {
      UI.toast('❌ ' + e.message, 'error');
    }
  };

  // Override Settings page to show new backup UI
  const oldSettings = Pages.settings;
  Pages.settings = function() {
    oldSettings.call(this);

    setTimeout(() => {
      const dataCard = document.querySelector('.card:has(.i-database)') || document.querySelectorAll('.card').at(-1);
      if (!dataCard) return;

      const backupSection = document.createElement('div');
      backupSection.className = 'card mt-6';
      backupSection.innerHTML = `
        <div class="card-header">
          <div class="card-title"><i class="i-cloud-upload"></i> Backup &amp; Restore (v${BACKUP.version})</div>
        </div>
        <div class="flex flex-wrap gap-3 mb-6">
          <button class="btn" id="exportFileBtn"><i class="i-download"></i> Export to File</button>
          <button class="btn" id="importFileBtn"><i class="i-upload"></i> Import from File</button>
          <button class="btn" id="pushGitHubBtn"><i class="i-github"></i> Push to GitHub</button>
          <button class="btn" id="pullGitHubBtn"><i class="i-download-cloud"></i> Pull from GitHub</button>
        </div>

        <div class="field">
          <label>GitHub Token <span class="text-red text-xs">(needed for cloud backup)</span></label>
          <input type="password" id="ghToken" class="input" placeholder="ghp_xxxxxxxxxxxxxxxx" value="${localStorage.getItem('ghToken')||''}">
          <p class="text-xs text-muted mt-1">⚠️ Token stays in your browser only. Use <b>repo</b> scope.</p>
        </div>
        <button class="btn btn-sm" id="saveToken">Save Token</button>
      `;

      dataCard.parentNode.appendChild(backupSection);

      // Button connections
      document.getElementById('exportFileBtn').onclick = window.exportToFile;
      document.getElementById('importFileBtn').onclick = () => {
        let inp = document.getElementById('hiddenImport');
        if (!inp) {
          inp = document.createElement('input');
          inp.type = 'file'; inp.id = 'hiddenImport'; inp.accept = '.json'; inp.style.display = 'none';
          document.body.appendChild(inp);
          inp.onchange = e => e.target.files[0] && window.importFromFile(e.target.files[0]);
        }
        inp.click();
      };
      document.getElementById('pushGitHubBtn').onclick = window.pushToGitHub;
      document.getElementById('pullGitHubBtn').onclick = window.pullFromGitHub;
      document.getElementById('saveToken').onclick = () => {
        const token = document.getElementById('ghToken').value.trim();
        if (token) {
          localStorage.setItem('ghToken', token);
          UI.toast('Token saved!', 'success');
        }
      };
    }, 300);
  };
}

setupBackupSystem();
console.log('✅ Backup System v1.2 loaded');