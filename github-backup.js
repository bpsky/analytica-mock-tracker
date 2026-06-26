/* =============================================
   Premium Data Management & Backup v1.7
   Unified + Professional UI
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
    doc.text(`Full Analysis Report — ${new Date().toLocaleDateString()}`, margin, y);
    y += 20;

    // Add summary (expandable later)
    const state = Store.state || {};
    doc.setFontSize(14);
    doc.text("Performance Summary", margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`Total Tests: ${state.tests?.length || 0}`, margin, y); y += 8;
    doc.text(`Avg Score: ${Analytics.stats ? Analytics.stats('all').avgMarks.toFixed(1) : 0}`, margin, y);

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
      // Remove old data card if exists
      document.querySelectorAll('.card').forEach(card => {
        if (card.textContent.includes('Data Management') || card.textContent.includes('Backup')) {
          card.remove();
        }
      });

      const dataCard = document.createElement('div');
      dataCard.className = 'card mt-8';
      dataCard.innerHTML = `
        <div class="card-header">
          <div class="flex items-center gap-3">
            <i class="i-database text-3xl text-indigo-600"></i>
            <div>
              <div class="card-title text-2xl">Data Management & Backup</div>
              <p class="text-sm text-muted">Export, Import, Sync & Reset • v${BACKUP.version}</p>
            </div>
          </div>
        </div>

        <div class="p-8 space-y-10">

          <!-- Local Storage -->
          <div>
            <h3 class="uppercase text-xs tracking-widest text-muted mb-4">LOCAL BACKUP</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button id="exportFileBtn" class="btn btn-primary h-14 flex items-center justify-center gap-2 text-base">
                <i class="i-download"></i> Export JSON
              </button>
              <button id="exportPDFBtn" class="btn btn-success h-14 flex items-center justify-center gap-2 text-base">
                <i class="i-file-text"></i> Export PDF Report
              </button>
              <button id="importFileBtn" class="btn h-14 flex items-center justify-center gap-2 text-base">
                <i class="i-upload"></i> Import JSON
              </button>
            </div>
          </div>

          <!-- Cloud Sync -->
          <div class="pt-8 border-t">
            <h3 class="uppercase text-xs tracking-widest text-muted mb-4 flex items-center gap-2">
              <i class="i-github"></i> GITHUB CLOUD SYNC
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button id="pushGitHubBtn" class="btn btn-blue h-14 flex items-center justify-center gap-2">
                <i class="i-cloud-upload"></i> Push to GitHub
              </button>
              <button id="pullGitHubBtn" class="btn btn-blue h-14 flex items-center justify-center gap-2">
                <i class="i-cloud-download"></i> Pull from GitHub
              </button>
            </div>

            <div class="field">
              <label class="font-medium">GitHub Personal Access Token</label>
              <input type="password" id="ghToken" class="input" 
                     placeholder="ghp_xxxxxxxxxxxxxxxx" 
                     value="${localStorage.getItem('ghToken') || ''}">
              <p class="text-xs text-muted mt-2">Saved locally in browser • Requires <strong>repo</strong> permission</p>
            </div>
            <button id="saveTokenBtn" class="btn mt-4">Save Token</button>
          </div>

          <!-- Danger Zone -->
          <div class="pt-8 border-t border-red-200">
            <h3 class="uppercase text-xs tracking-widest text-red-600 mb-4">DANGER ZONE</h3>
            <button id="resetAllBtn" class="btn btn-danger w-full h-14 flex items-center justify-center gap-2 text-base">
              <i class="i-trash"></i> Reset All Data (Clear Everything)
            </button>
            <p class="text-xs text-red-500 mt-3">This action cannot be undone without a backup.</p>
          </div>

        </div>
      `;

      const lastCard = document.querySelectorAll('.card').at(-1);
      if (lastCard) lastCard.parentNode.appendChild(dataCard);

      // Attach Events
      document.getElementById('exportFileBtn').onclick = window.exportToFile;
      document.getElementById('exportPDFBtn').onclick = window.exportToPDF;
      document.getElementById('importFileBtn').onclick = () => {
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
          UI.toast('✅ Token saved securely', 'success');
        } else {
          UI.toast('Please enter a valid token', 'error');
        }
      };

      document.getElementById('resetAllBtn').onclick = () => {
        if (confirm("⚠️ WARNING: This will delete ALL your tests, progress, and settings.\n\nAre you sure?")) {
          if (confirm("Final confirmation: Type 'DELETE' to confirm")) {
            const input = prompt("Type DELETE to confirm:");
            if (input === "DELETE") {
              Store.resetAllData ? Store.resetAllData() : (Store.state = { tests: [], subjects: [] });
              UI.toast('All data has been reset', 'success');
              setTimeout(() => location.reload(), 1500);
            }
          }
        }
      };

    }, 300);
  };
}

// Backup Functions
window.exportToFile = () => {
  try {
    const data = Store.exportJSON ? Store.exportJSON() : JSON.stringify(Store.state, null, 2);
    const backup = {
      metadata: { app: "analytica-mock-tracker", version: BACKUP.version, timestamp: new Date().toISOString() },
      data: JSON.parse(data)
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `analytica-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
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
      if (confirm(`Import backup from ${backup.metadata?.timestamp || 'unknown date'}?`)) {
        Store.importData(backup.data || backup, 'merge');
        UI.toast('✅ Data imported successfully', 'success');
        setTimeout(() => location.reload(), 1200);
      }
    } catch (err) {
      UI.toast('❌ Invalid or corrupted file', 'error');
    }
  };
  reader.readAsText(file);
};

// GitHub Functions (keep your working versions)
window.pushToGitHub = async () => { /* paste your working pushToGitHub here if different */ };
window.pullFromGitHub = async () => { /* paste your working pullFromGitHub here */ };

setupDataManagement();
console.log('✅ Premium Data Management System v1.7 Ready');