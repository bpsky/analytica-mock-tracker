/* Analytica - Robust GitHub Backup + Selective Sync (Anki-style) */
function setupGitHubBackup() {
  const repo = "bpsky/analytica-mock-tracker";

  window.pushToGitHub = async () => {
    const token = localStorage.getItem('ghToken');
    if (!token) {
      alert("Please save your GitHub token first in Settings!");
      Pages.nav('settings');
      return;
    }

    UI.toast('Pushing to GitHub...', 'info');
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
        UI.toast('✅ Successfully pushed backup to GitHub!', 'success');
      } else {
        throw new Error('GitHub API error');
      }
    } catch (e) {
      console.error(e);
      UI.toast('❌ Push failed: ' + e.message, 'error');
    }
  };

  window.pullFromGitHub = async () => {
    const token = localStorage.getItem('ghToken');
    if (!token) return alert("No token saved");

    UI.toast('Fetching backup...', 'info');
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/analytica-data.json`, {
        headers: { 'Authorization': `token ${token}` }
      });
      if (!res.ok) throw new Error("No backup found on GitHub");

      const file = await res.json();
      const backupData = JSON.parse(atob(file.content));

      // Anki-style selective import modal
      const options = [
        {key: 'subjects', label: 'Subjects & Topics'},
        {key: 'tests', label: 'All Test Records'},
        {key: 'settings', label: 'Settings & Defaults'},
        {key: 'errorTags', label: 'Error Tags'}
      ];

      let html = `<p>Select what to import from backup:</p><div class="flex flex-col gap-2">`;
      options.forEach(opt => {
        html += `<label class="flex items-center gap-2"><input type="checkbox" checked value="${opt.key}"> ${opt.label}</label>`;
      });
      html += `</div>`;

      const m = UI.modal({
        title: 'Selective Import (Anki-style)',
        body: html,
        footer: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="importSelected">Import Selected</button>`
      });

      m.root.querySelector('#importSelected').onclick = () => {
        const selected = Array.from(m.root.querySelectorAll('input:checked')).map(cb => cb.value);
        const importData = {};
        if (selected.includes('subjects')) importData.subjects = backupData.subjects;
        if (selected.includes('tests')) importData.tests = backupData.tests;
        if (selected.includes('settings')) importData.settings = backupData.settings;
        if (selected.includes('errorTags')) importData.errorTags = backupData.errorTags;

        Store.importData(importData, 'merge');
        m.close();
        UI.toast('✅ Selective import completed!', 'success');
        setTimeout(() => location.reload(), 800);
      };
    } catch(e) {
      UI.toast('❌ ' + e.message, 'error');
    }
  };

  // Add card to Settings (robust)
  const originalSettings = Pages.settings;
  Pages.settings = function() {
    originalSettings.call(this);
    setTimeout(() => {
      const target = document.querySelector('.card:has(.i-database)') || document.querySelectorAll('.card')[document.querySelectorAll('.card').length-2];
      if (!target) return;

      const ghCard = document.createElement('div');
      ghCard.className = 'card mb-4';
      ghCard.innerHTML = `
        <div class="card-header"><div class="card-title"><i class="i-github"></i> GitHub Cloud Sync (Anki-style)</div></div>
        <div class="field">
          <label>Personal Access Token</label>
          <input type="password" class="input" id="ghTokenInput" placeholder="ghp_..." value="${localStorage.getItem('ghToken')||''}">
        </div>
        <div class="flex gap-2 flex-wrap">
          <button class="btn" id="saveGhToken">Save Token</button>
          <button class="btn" id="pushGh">☁️ Push Full Backup</button>
          <button class="btn" id="pullGh">📥 Selective Pull (Anki-style)</button>
        </div>
      `;
      target.parentNode.insertBefore(ghCard, target.nextSibling);

      document.getElementById('saveGhToken').onclick = () => {
        const t = document.getElementById('ghTokenInput').value.trim();
        if (t) {
          localStorage.setItem('ghToken', t);
          UI.toast('Token saved!', 'success');
        }
      };
      document.getElementById('pushGh').onclick = window.pushToGitHub;
      document.getElementById('pullGh').onclick = window.pullFromGitHub;
    }, 500);
  };
}

setupGitHubBackup();
console.log('✅ Robust GitHub + Selective Sync loaded');