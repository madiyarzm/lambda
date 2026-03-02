const statusEl = document.getElementById("health-status");
const button = document.getElementById("check-health");

/**
 * Update status text and color class.
 *
 * @param {string} text - Human-readable status description.
 * @param {"muted" | "ok" | "error"} tone - Visual tone for the status.
 */
function setStatus(text, tone) {
  statusEl.textContent = text;
  statusEl.className = `status status--${tone}`;
}

/**
 * Call the backend /health endpoint and reflect the result in the UI.
 *
 * For local development we call the FastAPI server directly on port 8000.
 */
async function checkHealth() {
  button.disabled = true;
  button.textContent = "Checking…";
  setStatus("Checking backend…", "muted");

  try {
    const response = await fetch("http://127.0.0.1:8000/health");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const version = data.version ? ` · v${data.version}` : "";
    setStatus(`Backend status: ${data.status || "unknown"}${version}`, "ok");
  } catch (err) {
    setStatus("Backend unreachable. Check server and CORS.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Check backend status";
  }
}

button.addEventListener("click", () => {
  void checkHealth();
});

// Optional: first paint tries once without user click for fast feedback.
void checkHealth();

