/* =============================================
   Analytica Backup System v1.3 - Improved
   Local File + GitHub + Beginner Friendly
   ============================================= */

const BACKUP = {
  repo: "bpsky/analytica-mock-tracker",
  filename: "analytica-backup.json",
  version: "1.3"
};

// Main Setup
function setupBackupSystem() {

  // ====================== EXPORT TO FILE ======================
  window.exportToFile = () => {
    try {
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
      a.download = `analytica-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      UI.toast('✅ Backup downloaded successfully!', 'success');
    } catch (e) {
      UI.toast('❌ Export failed', 'error');
    }
  };

  // ====================== IMPORT FROM FILE ======================
  window.importFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        const dataToImport = backup.data || backup;

        if (confirm(`Import this backup?\nDate: ${backup.metadata?.timestamp || 'Unknown'}\nThis will merge with current data.`)) {
          Store.importData(dataToImport, 'merge');
          UI.toast('✅ Import successful! Refreshing...', 'success');
          setTimeout(() => location.reload(), 1000);
        }
      } catch (err) {
        UI.toast('❌ Invalid or corrupted backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // ====================== PUSH TO GITHUB ======================
  window.pushToGitHub = async () => {
    const token = localStorage.getItem('ghToken');
    if (!token) {
      UI.toast('Please save your GitHub token in Settings first', 'error');
      Pages.nav('settings');
      return;
    }

    UI.toast('Pushing to GitHub...', 'info');

    try {
      const dataStr = Store.exportJSON ? Store.exportJSON() : JSON.stringify(Store.state, null, 2);
      const backup = {
        metadata: {
          app: "analytica-mock-tracker",
          version: BACKUP.version,
          timestamp: new Date().toISOString()
        },
        data: JSON.parse(dataStr)
      };

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(backup, null, 2))));

      // Get current SHA if file exists
      let sha = null;
      try {
        const getRes = await fetch(`https://api.github.com/repos/\( {BACKUP.repo}/contents/ \){BACKUP.filename}`, {
          headers: { Authorization: `token ${token}` }
        });
        if (getRes.ok) {
          sha = (await getRes.json()).sha;
        }
      } catch (_) {}

      // Push / Update file
      const res = await fetch(`https://api.github.com/repos/\( {BACKUP.repo}/contents/ \){BACKUP.filename}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Backup ${new Date().toISOString()}`,
          content: content,
          sha: sha
        })
      });

      if (res.ok) {
        UI.toast('✅ Successfully backed up to GitHub!', 'success');
      } else {
        const errorText = await res.text();
        throw new Error(`GitHub error: ${res.status}`);
      }
    } catch (e) {
      console.error(e);
      UI.toast('❌ Push failed: ' + e.message, 'error');
    }
  };

  // ====================== PULL FROM GITHUB ======================
  window.pullFromGitHub = async () => {
    const token = localStorage.getItem('ghToken');
    if (!token) {
      UI.toast('No GitHub token found', 'error');
      return;
    }

    UI.toast('Fetching from GitHub...', 'info');

    try {
      const res = await fetch(`https://api.github.com/repos/\( {BACKUP.repo}/contents/ \){BACKUP.filename}`, {
        headers: { Authorization: `token ${token}` }
      });

      if (!res.ok) throw new Error("No backup found on GitHub");

      const file = await res.json();
      const backup = JSON.parse(atob(file.content));
      const data = backup.data || backup;

      if (confirm(`Import backup from GitHub?\nDate: ${backup.metadata?.timestamp || 'Unknown'}`)) {
        Store.importData(data, 'merge');
        UI.toast('✅ Successfully imported from GitHub!', 'success');
        setTimeout(() => location.reload(), 1000);
      }
    } catch (e) {
      UI.toast('❌ ' + e.message, 'error');
    }
  };

  // ====================== SETTINGS UI ======================
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
          <label>GitHub Personal Access Token <span class="text-red text-xs">(required for cloud)</span></label>
          <input type="password" id="ghToken" class="input" placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx" value="${localStorage.getItem('ghToken')||''}">
          <p class="text-xs text-muted mt-1">Token is saved only in your browser. Needs <b>repo</b> permission.</p>
        </div>
        <button class="btn btn-sm" id="saveToken">Save Token</button>
      `;

      dataCard.parentNode.appendChild(backupSection);

      // Attach button events
      document.getElementById('exportFileBtn').onclick = window.exportToFile;
      document.getElementById('importFileBtn').onclick = () => {
        let inp = document.getElementById('hiddenImport');
        if (!inp) {
          inp = document.createElement('input');
          inp.type = 'file';
          inp.id = 'hiddenImport';
          inp.accept = '.json';
          inp.style.display = 'none';
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
          UI.toast('✅ Token saved successfully!', 'success');
        } else {
          UI.toast('Please enter a token', 'error');
        }
      };
    }, 300);
  };
}

// Initialize
setupBackupSystem();
console.log('✅ Improved Backup System v1.3 loaded successfully');