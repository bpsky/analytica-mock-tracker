/* =============================================
   Premium Data Management System v1.7
   Merged Backup + Export + Reset
   ============================================= */

const BACKUP = {
  repo: "bpsky/analytica-mock-tracker",
  filename: "analytica-backup.json",
  version: "1.7"
};

// Load jsPDF
function loadJsPDF() {
  return new Promise((resolve) => {
    if (window.jsPDF) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// Enhanced PDF Export
window.exportToPDF = async () => {
  await loadJsPDF();
  const { jsPDF } = window.jspdf;
  UI.toast('Generating detailed report...', 'info');

  try {
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;

    doc.setFontSize(20);
    doc.text("Analytica Mock Tracker", margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.text(`Report Date: ${new Date().toLocaleString()}`, margin, y);
    y += 20;

    const state = Store.state || {};
    const stats = Analytics.stats ? Analytics.stats('all') : {};

    doc.setFontSize(16);
    doc.text("Performance Summary", margin, y);
    y += 10;

    doc.setFontSize(11);
    const lines = [
      `Total Tests: ${state.tests?.length || 0}`,
      `Average Score: ${stats.avgMarks ? stats.avgMarks.toFixed(1) : 0}/100`,
      `Average Accuracy: ${stats.avgAccuracy ? stats.avgAccuracy.toFixed(1) : 0}%`,
      `Best Score: ${stats.bestScore || 0}`,
    ];

    lines.forEach(line => {
      doc.text(line, margin + 5, y);
      y += 8;
    });

    doc.save(`analytica-report-${new Date().toISOString().slice(0,10)}.pdf`);
    UI.toast('✅ PDF Report Downloaded', 'success');
  } catch (e) {
    UI.toast('PDF generation failed', 'error');
  }
};

// ====================== MAIN SETUP ======================
function setupDataManagement() {
  const oldSettings = Pages.settings;

  Pages.settings = function() {
    oldSettings.call(this);

    setTimeout(() => {
      // Find existing data card or last card
      let container = document.querySelector('.card:has(.i-database)') || document.querySelectorAll('.card').at(-1);
      if (!container) return;

      const dmCard = document.createElement('div');
      dmCard.className = 'card mt-8';
      dmCard.innerHTML = `
        <div class="card-header">
          <div class="flex items-center gap-3">
            <i class="i-database text-3xl text-indigo-600"></i>
            <div>
              <div class="card-title text-2xl">Data Management</div>
              <p class="text-sm text-muted">Backup • Export • Restore • Reset</p>
            </div>
          </div>
        </div>

        <div class="p-8 space-y-10">

          <!-- Local Actions -->
          <div>
            <h3 class="uppercase text-xs font-semibold tracking-widest text-muted mb-4">Local Storage</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button id="exportJSONBtn" class="btn btn-primary h-14 flex items-center justify-center gap-3 text-base">
                <i class="i-download"></i> Export JSON Backup
              </button>
              <button id="exportPDFBtn" class="btn btn-success h-14 flex items-center justify-center gap-3 text-base">
                <i class="i-file-text"></i> Export Full PDF Report
              </button>
              <button id="importJSONBtn" class="btn btn-secondary h-14 flex items-center justify-center gap-3 text-base">
                <i class="i-upload"></i> Import JSON Backup
              </button>
            </div>
          </div>

          <!-- Cloud Sync -->
          <div class="pt-6 border-t">
            <h3 class="uppercase text-xs font-semibold tracking-widest text-muted mb-4">GitHub Cloud Sync</h3>
            <div class="flex gap-4">
              <button id="pushGitHubBtn" class="btn btn-blue flex-1 h-14 flex items-center justify-center gap-3">
                <i class="i-upload-cloud"></i> Push to GitHub
              </button>
              <button id="pullGitHubBtn" class="btn btn-blue flex-1 h-14 flex items-center justify-center gap-3">
                <i class="i-download-cloud"></i> Pull from GitHub
              </button>
            </div>

            <div class="mt-6">
              <label class="block text-sm font-medium mb-2">GitHub Personal Access Token</label>
              <input type="password" id="ghToken" class="input" 
                     placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx" 
                     value="${localStorage.getItem('ghToken') || ''}">
              <button id="saveTokenBtn" class="btn btn-sm mt-3">Save Token</button>
              <p class="text-xs text-muted mt-3">Token is stored only in your browser • Requires <b>repo</b> scope</p>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="pt-8 border-t border-red-200">
            <h3 class="uppercase text-xs font-semibold tracking-widest text-red-600 mb-4">Danger Zone</h3>
            <button id="resetAllBtn" class="btn btn-danger w-full h-12 flex items-center justify-center gap-3">
              <i class="i-trash"></i> Reset All Data (Factory Reset)
            </button>
            <p class="text-xs text-red-500 mt-3">This will permanently delete all tests, settings, and progress.</p>
          </div>
        </div>
      `;

      container.parentNode.appendChild(dmCard);

      // Attach Events
      document.getElementById('exportJSONBtn').onclick = window.exportToFile;
      document.getElementById('exportPDFBtn').onclick = window.exportToPDF;
      document.getElementById('importJSONBtn').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => e.target.files[0] && window.importFromFile(e.target.files[0]);
        input.click();
      };

      document.getElementById('pushGitHubBtn').onclick = window.pushToGitHub;
      document.getElementById('pullGitHubBtn').onclick = window.pullFromGitHub;

      document.getElementById('saveTokenBtn').onclick = () => {
        const token = document.getElementById('ghToken').value.trim();
        if (token) {
          localStorage.setItem('ghToken', token);
          UI.toast('✅ GitHub token saved', 'success');
        } else {
          UI.toast('Please enter a valid token', 'error');
        }
      };

      document.getElementById('resetAllBtn').onclick = () => {
        if (confirm("⚠️ WARNING: This will delete ALL your data permanently.\n\nAre you absolutely sure?")) {
          if (confirm("Final confirmation: Delete everything?")) {
            localStorage.clear();
            UI.toast('All data has been reset', 'success');
            setTimeout(() => location.reload(), 1500);
          }
        }
      };

    }, 400);
  };
}

// Existing Functions
window.exportToFile = () => {
  try {
    const data = Store.exportJSON ? Store.exportJSON() : JSON.stringify(Store.state || {}, null, 2);
    const backup = {
      metadata: { app: "analytica-mock-tracker", version: BACKUP.version, timestamp: new Date().toISOString() },
      data: JSON.parse(data)
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytica-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('✅ JSON Backup Downloaded', 'success');
  } catch (e) {
    UI.toast('Export failed', 'error');
  }
};

window.importFromFile = (file) => {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result);
      if (confirm("Import backup? This will merge with your current data.")) {
        Store.importData(backup.data || backup, 'merge');
        UI.toast('✅ Data Imported Successfully', 'success');
        setTimeout(() => location.reload(), 1500);
      }
    } catch (err) {
      UI.toast('❌ Invalid or corrupted file', 'error');
    }
  };
  reader.readAsText(file);
};

// GitHub Functions (add your previous push/pull logic here if needed)
window.pushToGitHub = async () => { /* Your previous push code */ };
window.pullFromGitHub = async () => { /* Your previous pull code */ };

setupDataManagement();
console.log('✅ Premium Data Management v1.7 Loaded');