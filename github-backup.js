/* =============================================
   Analytica - Improved Backup System (Beginner Friendly)
   Local File + GitHub Backup + Selective Import
   ============================================= */

const BACKUP = {
  repo: "bpsky/analytica-mock-tracker",
  filename: "analytica-backup.json"
};

function setupBackupSystem() {

  // === EXPORT TO LOCAL FILE ===
  window.exportToFile = () => {
    const data = Store.exportJSON ? Store.exportJSON() : JSON.stringify(Store.state, null, 2);
    const backup = {
      metadata: {
        app: "analytica-mock-tracker",
        version: "1.1",
        timestamp: new Date().toISOString()
      },
      data: JSON.parse(data)
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = BACKUP.filename;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('✅ Backup saved to your computer!', 'success');
  };

  // === IMPORT FROM LOCAL FILE ===
  window.importFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        const data = backup.data || backup;

        if (confirm("Import this backup? Existing data will be merged.")) {
          Store.importData(data, 'merge');
          UI.toast('✅ Data imported successfully!', 'success');
          setTimeout(() => location.reload(), 800);
        }
      } catch (err) {
        UI.toast('❌ Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // === PUSH TO GITHUB ===
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
        metadata: { app: "analytica-mock-tracker", timestamp: new Date().toISOString() },
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
          message: `Backup ${new Date().toISOString()}`,
          content: content,
          sha: sha
        })
      });

      if (res.ok) {
        UI.toast('✅ Backup pushed to GitHub!', 'success');
      } else {
        throw new Error('Failed to push');
      }
    } catch (e) {
      UI.toast('❌ GitHub push failed: ' + e.message, 'error');
    }
  };

  // === PULL FROM GITHUB ===
  window.pullFromGitHub = async () => {
    const token = localStorage.getItem('ghToken');
    if (!token) return UI.toast('No GitHub token saved', 'error');

    UI.toast('Fetching from GitHub...', 'info');
    try {
      const res = await fetch(`https://api.github.com/repos/\( {BACKUP.repo}/contents/ \){BACKUP.filename}`, {
        headers: { Authorization: `token ${token}` }
      });

      if (!res.ok) throw new Error("No backup found on GitHub");

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

  // Add improved buttons to Settings page
  const originalSettings = Pages.settings;
  Pages.settings = function() {
    originalSettings.call(this);
    
    setTimeout(() => {
      const dataCard = document.querySelector('.card:has(.i-database)') || document.querySelectorAll('.card').at(-1);
      if (!dataCard) return;

      const backupHTML = `
        <div class="card mt-6">
          <div class="card-header">
            <div class="card-title"><i class="i-cloud-upload"></i> Backup & Restore</div>
          </div>
          <div class="flex flex-wrap gap-3 mb-6">
            <button class="btn" id="btnExportFile"><i class="i-download"></i> Export to File</button>
            <button class="btn" id="btnImportFile"><i class="i-upload"></i> Import from File</button>
            <button class="btn" id="btnPushGH"><i class="i-github"></i> Push to GitHub</button>
            <button class="btn" id="btnPullGH"><i class="i-download-cloud"></i> Pull from GitHub</button>
          </div>
          
          <div class="field">
            <label>GitHub Personal Access Token <span class="text-red text-xs">(for cloud backup)</span></label>
            <input type="password" id="ghTokenInput" class="input" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value="${localStorage.getItem('ghToken') || ''}">
            <p class="text-xs text-muted mt-1">⚠️ Only stored in your browser. Create token with <b>repo</b> permission.</p>
          </div>
          <button class="btn btn-sm" id="saveTokenBtn">Save Token</button>
        </div>
      `;

      const div = document.createElement('div');
      div.innerHTML = backupHTML;
      dataCard.parentNode.appendChild(div);

      // Wire buttons
      document.getElementById('btnExportFile').onclick = window.exportToFile;
      document.getElementById('btnImportFile').onclick = () => {
        let input = document.getElementById('importFileHidden');
        if (!input) {
          input = document.createElement('input');
          input.type = 'file';
          input.id = 'importFileHidden';
          input.accept = '.json';
          input.style.display = 'none';
          document.body.appendChild(input);
          input.onchange = e => e.target.files[0] && window.importFromFile(e.target.files[0]);
        }
        input.click();
      };
      document.getElementById('btnPushGH').onclick = window.pushToGitHub;
      document.getElementById('btnPullGH').onclick = window.pullFromGitHub;
      document.getElementById('saveTokenBtn').onclick = () => {
        const token = document.getElementById('ghTokenInput').value.trim();
        if (token) {
          localStorage.setItem('ghToken', token);
          UI.toast('Token saved!', 'success');
        }
      };
    }, 300);
  };
}

setupBackupSystem();
console.log('✅ Improved Backup System Ready');