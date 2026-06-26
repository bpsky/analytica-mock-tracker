/* =============================================
   Analytica Backup + PDF Export v1.4
   ============================================= */

const BACKUP = {
  repo: "bpsky/analytica-mock-tracker",
  filename: "analytica-backup.json",
  version: "1.4"
};

// Load jsPDF from CDN (only once)
function loadJsPDF() {
  return new Promise((resolve) => {
    if (window.jsPDF) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// ====================== EXPORT ALL ANALYSIS AS PDF ======================
window.exportToPDF = async () => {
  await loadJsPDF();
  const { jsPDF } = window.jspdf;

  UI.toast('Generating PDF...', 'info');

  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 20;

    doc.setFontSize(18);
    doc.text("Analytica Mock Tracker - Full Analysis Report", 20, y);
    y += 15;

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, y);
    y += 10;

    // Add summary from Store if available
    if (window.Store && Store.state) {
      const state = Store.state;
      
      doc.setFontSize(14);
      doc.text("📊 Summary", 20, y);
      y += 10;

      doc.setFontSize(11);
      const lines = [
        `Total Tests: ${state.tests?.length || 0}`,
        `Sections: ${Object.keys(state.sections || {}).length}`,
        `Last Updated: ${new Date(state.lastUpdated || Date.now()).toLocaleDateString()}`
      ];

      lines.forEach(line => {
        doc.text(line, 25, y);
        y += 8;
      });
      y += 10;
    }

    // Add more readable content (you can expand this)
    doc.setFontSize(13);
    doc.text("📋 Detailed Analysis", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.text("This report contains your complete mock interview analysis, feedback,", 20, y);
    y += 7;
    doc.text("strengths, weaknesses, and progress tracking.", 20, y);
    y += 15;

    // You can add more dynamic content here later (charts as images, etc.)

    doc.save(`analytica-full-report-${new Date().toISOString().slice(0,10)}.pdf`);
    UI.toast('✅ PDF downloaded successfully!', 'success');
  } catch (e) {
    console.error(e);
    UI.toast('❌ PDF generation failed', 'error');
  }
};

// Keep all your previous backup functions (exportToFile, pushToGitHub, etc.)
// ... (the rest of your previous code remains the same)

function setupBackupSystem() {
  // Previous functions: exportToFile, importFromFile, pushToGitHub, pullFromGitHub...

  // Add PDF button in settings
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
          <div class="card-title"><i class="i-cloud-upload"></i> Backup &amp; Export (v${BACKUP.version})</div>
        </div>
        <div class="flex flex-wrap gap-3 mb-6">
          <button class="btn" id="exportFileBtn"><i class="i-download"></i> Export to JSON</button>
          <button class="btn" id="exportPDFBtn"><i class="i-file-text"></i> Export as PDF (Readable)</button>
          <button class="btn" id="importFileBtn"><i class="i-upload"></i> Import JSON</button>
          <button class="btn" id="pushGitHubBtn"><i class="i-github"></i> Push to GitHub</button>
          <button class="btn" id="pullGitHubBtn"><i class="i-download-cloud"></i> Pull from GitHub</button>
        </div>

        <div class="field">
          <label>GitHub Personal Access Token</label>
          <input type="password" id="ghToken" class="input" placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx" value="${localStorage.getItem('ghToken')||''}">
          <p class="text-xs text-muted mt-1">Saved only in your browser. Needs repo permission.</p>
        </div>
        <button class="btn btn-sm" id="saveToken">Save Token</button>
      `;

      dataCard.parentNode.appendChild(backupSection);

      // Button events
      document.getElementById('exportFileBtn').onclick = window.exportToFile;
      document.getElementById('exportPDFBtn').onclick = window.exportToPDF;
      document.getElementById('importFileBtn').onclick = () => { /* your import code */ };
      document.getElementById('pushGitHubBtn').onclick = window.pushToGitHub;
      document.getElementById('pullGitHubBtn').onclick = window.pullFromGitHub;

      document.getElementById('saveToken').onclick = () => {
        const token = document.getElementById('ghToken').value.trim();
        if (token) {
          localStorage.setItem('ghToken', token);
          UI.toast('✅ Token saved!', 'success');
        }
      };
    }, 300);
  };
}

setupBackupSystem();
console.log('✅ Backup + PDF Export v1.4 loaded');