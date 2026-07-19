const API_BASE = "http://localhost:4000";

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const oneDriveLoginBtn = document.getElementById("oneDriveLoginBtn");
  const fileContainer = document.getElementById("fileContainer");
  const cloudSelect = document.getElementById("cloudSelect");

  /* ================= GOOGLE LOGIN ================= */
  loginBtn.onclick = async () => {
    const res = await fetch(`${API_BASE}/api/google/url`);
    const data = await res.json();
    window.location.href = data.url;
  };

  /* ================= ONEDRIVE LOGIN ================= */
  oneDriveLoginBtn.onclick = async () => {
    const res = await fetch(`${API_BASE}/api/onedrive/url`);
    const data = await res.json();
    window.location.href = data.url;
  };

  /* ================= AUTO-SELECT CLOUD AFTER LOGIN ================= */
  const params = new URLSearchParams(window.location.search);

  if (params.has("onedrive")) {
    cloudSelect.value = "onedrive";
  }

  if (params.has("auth") || params.has("onedrive")) {
    // Clean up the query string so a refresh doesn't re-trigger anything.
    window.history.replaceState({}, document.title, window.location.pathname);
    loadFiles();
  }

  /* ================= LOAD FILES ================= */
  async function loadFiles() {
    fileContainer.innerHTML = `<tr><td colspan="5" class="empty-state">Loading files…</td></tr>`;

    try {
      const res = await fetch(`${API_BASE}/api/drive/files`);
      if (!res.ok) throw new Error("Not connected to Google Drive yet.");
      const files = await res.json();

      if (!files.length) {
        fileContainer.innerHTML = `<tr><td colspan="5" class="empty-state">No files found in your Drive.</td></tr>`;
        return;
      }

      fileContainer.innerHTML = "";

      files.forEach((file) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td><input type="checkbox"></td>
          <td>${escapeHtml(file.name)}</td>
          <td>${escapeHtml(file.mimeType)}</td>
          <td><span class="status status-idle">Idle</span></td>
          <td><button class="transfer-btn">Transfer</button></td>
        `;

        const statusEl = tr.querySelector(".status");
        const transferBtn = tr.querySelector(".transfer-btn");

        transferBtn.addEventListener("click", () => {
          transferFile(file.id, file.name, statusEl);
        });

        fileContainer.appendChild(tr);
      });
    } catch (err) {
      fileContainer.innerHTML = `<tr><td colspan="5" class="empty-state">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  /* ================= TRANSFER FILE ================= */
  async function transferFile(fileId, filename, statusEl) {
    const destination = cloudSelect.value;

    statusEl.textContent = "Uploading...";
    statusEl.className = "status status-uploading";

    try {
      const res = await fetch(`${API_BASE}/api/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, filename, destination }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Transfer failed");
      }

      statusEl.textContent = "Success";
      statusEl.className = "status status-success";
    } catch (err) {
      console.error("Transfer error:", err);
      statusEl.textContent = "Failed";
      statusEl.className = "status status-failed";
      statusEl.title = err.message;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  // If we're already authenticated from a previous session, try loading right away.
  loadFiles();
});
