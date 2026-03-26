document.addEventListener('DOMContentLoaded', () => {
    let currentTabId = null;
    let currentUrl = "";
    let currentCircuit = null;

    // Elements
    const statusPanel = document.getElementById('status-panel');
    const statusText = document.getElementById('connection-status');
    const gatesList = document.getElementById('gates-list');

    // Button logic and form toggles
    function setupToggle(btnId, formId, cancelBtnId) {
        const btn = document.getElementById(btnId);
        const form = document.getElementById(formId);
        const cancel = document.getElementById(cancelBtnId);

        btn.addEventListener('click', () => {
            form.classList.toggle('hidden');
        });

        cancel.addEventListener('click', () => {
            form.classList.add('hidden');
        });
    }

    setupToggle('add-gate-btn', 'add-gate-form', 'cancel-gate-btn');
    setupToggle('paste-circuit-btn', 'paste-circuit-form', 'cancel-circuit-btn');

    // UI Feedback
    function flashButton(btnId, text) {
        const btn = document.getElementById(btnId);
        const originalText = btn.innerText;
        btn.innerText = text;
        btn.style.backgroundColor = 'var(--success)';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = '';
        }, 1500);
    }

    // Tab tracking strictly for the active tab in THIS sidepanel's window
    function checkCurrentWindowTab() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                checkTab(tabs[0]);
            }
        });
    }

    // Initial check
    checkCurrentWindowTab();

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (!tab.active || !changeInfo.url) return;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].id === tabId) {
                checkTab(tabs[0]);
            }
        });
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].id === activeInfo.tabId) {
                checkTab(tabs[0]);
            }
        });
    });

    function checkTab(tab) {
        if (!tab || !tab.url) return;
        currentTabId = tab.id;
        currentUrl = tab.url;

        // Skip internal browser pages
        if (currentUrl.startsWith("chrome://") || currentUrl.startsWith("chrome-extension://") || currentUrl.startsWith("edge://") || currentUrl.startsWith("about:")) {
            showDisconnected("Not on a Quirk page.");
            return;
        }

        // Attempt to fetch circuit directly from the web page context
        chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            func: () => {
                // 1. Try URL Hash first
                const hashMatch = document.location.hash.match(/circuit=([^&]*)/);
                if (hashMatch && hashMatch[1]) {
                    return decodeURIComponent(hashMatch[1]);
                }
                // 2. Try Quirk's DEFAULT_CIRCUIT (for exported HTML files)
                if (typeof document.DEFAULT_CIRCUIT === 'string') {
                    return document.DEFAULT_CIRCUIT;
                }
                return null;
            }
        }, (results) => {
            let jsonStr = null;
            if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
                jsonStr = results[0].result;
            } else {
                // Fallback to basic URL parsing just in case script fails (e.g., no permissions)
                const hashIndex = currentUrl.indexOf('#circuit=');
                if (hashIndex !== -1) {
                    jsonStr = decodeURIComponent(currentUrl.substring(hashIndex + 9));
                }
            }

            if (jsonStr) {
                parseJsonStr(jsonStr);
            } else {
                showDisconnected("No circuit found in URL or Page.");
            }
        });
    }

    // Refresh Button Logic
    document.getElementById('refresh-btn').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                checkTab(tabs[0]);
            } else {
                showDisconnected("No active tab found.");
            }
        });
    });

    function showConnected() {
        statusText.innerText = "Connected to Quirk Circuit";
        statusText.className = "connected";
    }

    function showDisconnected(msg = "Looking for Quirk...") {
        statusText.innerText = msg;
        statusText.className = "disconnected";
        gatesList.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No gates available.</p>';
        currentCircuit = null;
    }

    function parseJsonStr(jsonStr) {
        try {
            currentCircuit = JSON.parse(jsonStr);

            if (!currentCircuit.gates) currentCircuit.gates = [];
            if (!currentCircuit.cols) currentCircuit.cols = [];

            showConnected();
            renderGates();
        } catch (e) {
            console.error("Error parsing circuit:", e);
            showDisconnected("Error parsing circuit data.");
        }
    }

    function updateTabUrl(newCircuit) {
        if (!currentTabId || !currentUrl) return;
        const hashIndex = currentUrl.indexOf('#');
        const baseUrl = hashIndex !== -1 ? currentUrl.substring(0, hashIndex) : currentUrl;

        // Update local state and UI immediately for snappy feeling
        currentCircuit = newCircuit;
        renderGates();

        const newHash = '#circuit=' + JSON.stringify(newCircuit);
        const newUrl = baseUrl + newHash;

        chrome.tabs.update(currentTabId, { url: newUrl });
    }

    function renderGates() {
        gatesList.innerHTML = '';
        if (!currentCircuit || !currentCircuit.gates || currentCircuit.gates.length === 0) {
            gatesList.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No custom gates in this circuit.</p>';
            return;
        }

        currentCircuit.gates.forEach((gate, index) => {
            const item = document.createElement('div');
            item.className = 'gate-item';

            const name = document.createElement('span');
            name.className = 'gate-name';
            name.innerText = gate.name || gate.id || `Gate ${index + 1}`;

            const actionsObj = document.createElement('div');
            actionsObj.className = 'gate-actions';

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerText = 'Copy';
            copyBtn.title = 'Copy as Gate';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(JSON.stringify(gate, null, 2));
                const original = copyBtn.innerText;
                copyBtn.innerText = 'Copied!';
                setTimeout(() => copyBtn.innerText = original, 1500);
            };

            const copyCircBtn = document.createElement('button');
            copyCircBtn.className = 'copy-btn copy-circ-btn';
            copyCircBtn.innerText = 'Copy Circ';
            copyCircBtn.title = 'Copy as Circuit';
            copyCircBtn.onclick = () => {
                if (gate.circuit) {
                    navigator.clipboard.writeText(JSON.stringify(gate.circuit, null, 2));
                    const original = copyCircBtn.innerText;
                    copyCircBtn.innerText = 'Copied!';
                    setTimeout(() => copyCircBtn.innerText = original, 1500);
                } else {
                    alert("This gate has no internal circuit.");
                }
            };

            const delBtn = document.createElement('button');
            delBtn.className = 'copy-btn delete-btn';
            delBtn.innerText = 'Delete';
            delBtn.onclick = () => {
                const newCircuit = JSON.parse(JSON.stringify(currentCircuit));
                newCircuit.gates.splice(index, 1);
                updateTabUrl(newCircuit);
            };

            const renameBtn = document.createElement('button');
            renameBtn.className = 'copy-btn rename-btn';
            renameBtn.innerText = 'Rename';
            renameBtn.title = 'Rename this gate';
            renameBtn.onclick = () => {
                const newName = prompt("Enter new name for this gate:", gate.name || "");
                if (newName !== null && newName.trim() !== "") {
                    const newCircuit = JSON.parse(JSON.stringify(currentCircuit));
                    newCircuit.gates[index].name = newName.trim();
                    updateTabUrl(newCircuit);
                }
            };

            const editBtn = document.createElement('button');
            editBtn.className = 'copy-btn';
            editBtn.innerText = 'Edit';
            editBtn.title = 'Edit JSON / Paste to Update';
            editBtn.onclick = () => {
                window.editGateIndex = index;
                document.getElementById('edit-gate-name').innerText = gate.name || gate.id;
                document.getElementById('edit-gate-json').value = JSON.stringify(gate, null, 2);
                document.getElementById('edit-gate-modal').classList.remove('hidden');
            };

            actionsObj.appendChild(copyBtn);
            if (gate.circuit) {
                actionsObj.appendChild(copyCircBtn);
            }
            actionsObj.appendChild(editBtn);
            actionsObj.appendChild(renameBtn);
            actionsObj.appendChild(delBtn);

            item.appendChild(name);
            item.appendChild(actionsObj);
            gatesList.appendChild(item);
        });
    }

    // Add Gate Logic
    document.getElementById('submit-gate-btn').addEventListener('click', () => {
        if (!currentCircuit) return alert("No active Quirk circuit linked.");
        try {
            const jsonStr = document.getElementById('gate-json-input').value;
            const newGate = JSON.parse(jsonStr);

            if (!newGate.id) throw new Error("Gate missing 'id' property");

            const newCircuit = JSON.parse(JSON.stringify(currentCircuit));

            // Overwrite if ID exists, or append
            const existingIndex = newCircuit.gates.findIndex(g => g.id === newGate.id);
            if (existingIndex !== -1) {
                newCircuit.gates[existingIndex] = newGate;
            } else {
                newCircuit.gates.push(newGate);
            }

            updateTabUrl(newCircuit);
            document.getElementById('gate-json-input').value = '';
            document.getElementById('add-gate-form').classList.add('hidden');
        } catch (e) {
            alert("Invalid Gate JSON: " + e.message);
        }
    });

    // Copy Circuit Logic
    document.getElementById('copy-circuit-btn').addEventListener('click', () => {
        if (currentCircuit) {
            navigator.clipboard.writeText(JSON.stringify(currentCircuit, null, 2));
            flashButton('copy-circuit-btn', 'Circuit Copied!');
        }
    });

    // Copy Circuit as Gate Logic
    document.getElementById('copy-circuit-as-gate-btn').addEventListener('click', () => {
        if (currentCircuit && currentCircuit.cols && currentCircuit.cols.length > 0) {
            const newGate = {
                id: "~" + Math.random().toString(36).substring(2, 6),
                name: "New Gate",
                circuit: {
                    cols: currentCircuit.cols
                }
            };
            navigator.clipboard.writeText(JSON.stringify(newGate, null, 2));
            flashButton('copy-circuit-as-gate-btn', 'Copied as Gate!');
        } else {
            alert("The current circuit is empty or not attached.");
        }
    });

    // Paste Circuit Logic
    document.getElementById('submit-circuit-btn').addEventListener('click', () => {
        if (!currentCircuit) return alert("No active Quirk circuit linked.");
        try {
            const jsonStr = document.getElementById('circuit-json-input').value;
            const pastedCircuit = JSON.parse(jsonStr);
            const offset = parseInt(document.getElementById('qubit-offset').value, 10) || 0;

            const newCircuit = JSON.parse(JSON.stringify(currentCircuit));

            // Optional structural reversals on pasted circuit
            const revTime = document.getElementById('rev-time-cb').checked;
            const revEndian = document.getElementById('rev-endian-cb').checked;

            if (pastedCircuit.cols) {
                if (revEndian) {
                    let maxWires = 0;
                    pastedCircuit.cols.forEach(col => {
                        if (col.length > maxWires) maxWires = col.length;
                    });
                    pastedCircuit.cols = pastedCircuit.cols.map(col => {
                        const padded = [...col];
                        while (padded.length < maxWires) padded.push(1);
                        return padded.reverse();
                    });
                }

                if (revTime) {
                    pastedCircuit.cols.reverse();
                }

                // Append and apply offset
                const paddedCols = pastedCircuit.cols.map(col => {
                    if (offset > 0) {
                        const prefix = Array(offset).fill(1);
                        return prefix.concat(col);
                    }
                    return col;
                });
                newCircuit.cols = newCircuit.cols.concat(paddedCols);
            }

            // Process gates
            if (pastedCircuit.gates) {
                const existingIds = new Set(newCircuit.gates.map(g => g.id));
                for (let g of pastedCircuit.gates) {
                    if (!existingIds.has(g.id)) {
                        newCircuit.gates.push(g);
                        existingIds.add(g.id);
                    }
                }
            }

            updateTabUrl(newCircuit);
            document.getElementById('circuit-json-input').value = '';
            document.getElementById('paste-circuit-form').classList.add('hidden');

        } catch (e) {
            alert("Invalid Circuit JSON: " + e.message);
        }
    });

    // Edit Gate Modal Logic
    document.getElementById('cancel-edit-gate-btn').addEventListener('click', () => {
        document.getElementById('edit-gate-modal').classList.add('hidden');
    });

    document.getElementById('save-edit-gate-btn').addEventListener('click', () => {
        if (window.editGateIndex === undefined || window.editGateIndex === -1 || !currentCircuit) return;
        try {
            const pastedGate = JSON.parse(document.getElementById('edit-gate-json').value);
            const newCircuit = JSON.parse(JSON.stringify(currentCircuit));

            // Preserve ID to prevent breaking the circuit
            const originalGate = newCircuit.gates[window.editGateIndex];
            pastedGate.id = originalGate.id;

            // If it doesn't have a name, keep the original name
            if (!pastedGate.name) {
                pastedGate.name = originalGate.name;
            }

            newCircuit.gates[window.editGateIndex] = pastedGate;

            updateTabUrl(newCircuit);
            document.getElementById('edit-gate-modal').classList.add('hidden');
        } catch (e) {
            alert("Invalid Gate JSON: " + e.message);
        }
    });

});
