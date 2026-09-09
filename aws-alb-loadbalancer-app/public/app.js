document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const healthPill = document.getElementById('healthPill');
  const healthText = document.getElementById('healthText');
  const serverTimeVal = document.getElementById('serverTimeVal');

  // Metrics Elements
  const topInstanceId = document.getElementById('topInstanceId');
  const topInstanceIp = document.getElementById('topInstanceIp');
  const topClientIp = document.getElementById('topClientIp');
  const topAz = document.getElementById('topAz');

  // Node Detail Elements
  const nodeAvatar = document.getElementById('nodeAvatar');
  const nodeInstanceId = document.getElementById('nodeInstanceId');
  const nodeHostname = document.getElementById('nodeHostname');
  const detailPrivateIp = document.getElementById('detailPrivateIp');
  const detailPublicIp = document.getElementById('detailPublicIp');
  const detailRegion = document.getElementById('detailRegion');
  const detailAz = document.getElementById('detailAz');
  const detailRequestsCount = document.getElementById('detailRequestsCount');

  // Client Detail Elements
  const clientIpDisplay = document.querySelector('#clientIpDisplay .ip-text');
  const copyClientIpBtn = document.getElementById('copyClientIpBtn');
  const detailProto = document.getElementById('detailProto');
  const detailPort = document.getElementById('detailPort');
  const detailAlbHost = document.getElementById('detailAlbHost');
  const detailTraceId = document.getElementById('detailTraceId');
  const detailProxyChain = document.getElementById('detailProxyChain');

  // Traffic Inspector Elements
  const btnManualPing = document.getElementById('btnManualPing');
  const btnAutoPollToggle = document.getElementById('btnAutoPollToggle');
  const btnClearLog = document.getElementById('btnClearLog');
  const pollIndicator = document.getElementById('pollIndicator');
  const pollStatusText = document.getElementById('pollStatusText');
  const pollSpeedSelect = document.getElementById('pollSpeedSelect');
  const instancesFlex = document.getElementById('instancesFlex');
  const uniqueInstancesCount = document.getElementById('uniqueInstancesCount');
  const logStream = document.getElementById('logStream');
  const logCountText = document.getElementById('logCountText');
  const btnStress = document.getElementById('btnStress');

  // Code Inspector Elements
  const btnToggleHeaders = document.getElementById('btnToggleHeaders');
  const headersCollapsible = document.getElementById('headersCollapsible');
  const rawHeadersCode = document.getElementById('rawHeadersCode');

  // Application State
  let isPolling = false;
  let pollIntervalId = null;
  let totalLogsCount = 0;
  const instanceStats = {}; // { "instanceId": { count: N, ip: "x.x.x.x", az: "us-east-1a", color: "#hex" } }

  // Vibrant palette for color-coding distinct instances
  const instanceColors = [
    '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#a855f7'
  ];
  let colorIndex = 0;

  function getColorForInstance(instanceId) {
    if (!instanceStats[instanceId]) {
      instanceStats[instanceId] = {
        count: 0,
        ip: '',
        az: '',
        color: instanceColors[colorIndex % instanceColors.length]
      };
      colorIndex++;
    }
    return instanceStats[instanceId].color;
  }

  // Fetch Health Endpoint
  async function checkHealth() {
    try {
      const res = await fetch('/health');
      if (res.ok) {
        const data = await res.json();
        healthPill.className = 'status-pill status-healthy';
        healthText.textContent = `Target Healthy (${data.instanceId})`;
      } else {
        healthPill.className = 'status-pill status-unhealthy';
        healthText.textContent = 'ALB Target Health Warning';
      }
    } catch (err) {
      healthPill.className = 'status-pill status-unhealthy';
      healthText.textContent = 'Disconnected / Offline';
    }
  }

  // Main Info Fetcher
  async function fetchInfo() {
    try {
      const res = await fetch('/api/info');
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();

      updateUi(data);
      recordTrafficLog(data);
    } catch (err) {
      console.error('Error fetching info:', err);
    }
  }

  // Update UI Elements with server response
  function updateUi(data) {
    const { server, client, albHeaders, rawHeaders, timestamp } = data;

    // Server time
    const timeStr = new Date(timestamp).toLocaleTimeString();
    serverTimeVal.textContent = timeStr;

    // Top Cards
    topInstanceId.textContent = server.instanceId || 'unknown';
    topInstanceIp.textContent = server.privateIp || '0.0.0.0';
    topClientIp.textContent = client.ip || '0.0.0.0';
    topAz.textContent = server.availabilityZone || 'N/A';

    // Node Details
    nodeInstanceId.textContent = server.instanceId || 'unknown';
    nodeHostname.textContent = server.hostname || 'ec2.internal';
    detailPrivateIp.textContent = server.privateIp || 'N/A';
    detailPublicIp.textContent = server.publicIp || 'N/A';
    detailRegion.textContent = server.region || 'N/A';
    detailAz.textContent = server.availabilityZone || 'N/A';
    detailRequestsCount.textContent = data.requestsHandled || 0;

    // Node avatar abbreviation (e.g. EC2 or first 3 chars)
    const nodeShort = server.instanceId.startsWith('i-')
      ? server.instanceId.slice(-4).toUpperCase()
      : 'NODE';
    nodeAvatar.querySelector('span').textContent = nodeShort;

    // Color avatar dynamically based on instance
    const instanceColor = getColorForInstance(server.instanceId);
    nodeAvatar.style.background = `linear-gradient(135deg, ${instanceColor} 0%, #1e293b 100%)`;

    // Client Details
    clientIpDisplay.textContent = client.ip || '127.0.0.1';
    detailProto.textContent = (client.protocol || 'HTTP').toUpperCase();
    detailPort.textContent = client.port || '80';
    detailAlbHost.textContent = albHeaders.host || 'Direct / Localhost';
    detailTraceId.textContent = albHeaders.xAmznTraceId || 'None (Direct Request)';
    detailProxyChain.textContent = client.rawForwardedFor || client.ip || 'None';

    // Raw Headers Code Block
    rawHeadersCode.textContent = JSON.stringify(rawHeaders, null, 2);
  }

  // Log traffic request entry to visualize round-robin distribution
  function recordTrafficLog(data) {
    const { server, client, timestamp } = data;
    const instanceId = server.instanceId;
    const color = getColorForInstance(instanceId);

    // Update internal instance statistics
    instanceStats[instanceId].count++;
    instanceStats[instanceId].ip = server.privateIp;
    instanceStats[instanceId].az = server.availabilityZone;

    totalLogsCount++;
    logCountText.textContent = `${totalLogsCount} Requests Logged`;

    // Render instance breakdown chips
    renderInstanceChips();

    // Create log entry element
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.style.borderLeftColor = color;

    const timeFormatted = new Date(timestamp).toLocaleTimeString();

    entry.innerHTML = `
      <span class="log-time">${timeFormatted}</span>
      <span class="log-node" style="color: ${color}">${instanceId}</span>
      <span class="log-az badge-az">${server.availabilityZone}</span>
      <span class="log-ip">Client IP: ${client.ip}</span>
    `;

    // Remove empty text if present
    const emptyText = logStream.querySelector('.empty-text');
    if (emptyText) emptyText.remove();

    // Prepend new entry
    logStream.insertBefore(entry, logStream.firstChild);

    // Keep log stream capped at 50 items
    if (logStream.children.length > 50) {
      logStream.removeChild(logStream.lastChild);
    }
  }

  // Render pills for unique instances seen so far
  function renderInstanceChips() {
    const keys = Object.keys(instanceStats);
    uniqueInstancesCount.textContent = keys.length;

    if (keys.length === 0) {
      instancesFlex.innerHTML = `<p class="empty-text">No traffic logged yet. Click "Ping Now" or "Start Auto-Polling" to observe load balancing across instances.</p>`;
      return;
    }

    instancesFlex.innerHTML = keys
      .map((id) => {
        const item = instanceStats[id];
        return `
        <div class="instance-chip" style="border-color: ${item.color}">
          <span class="status-dot" style="background-color: ${item.color}; box-shadow: 0 0 8px ${item.color}"></span>
          <div>
            <span class="instance-chip-id" style="color: ${item.color}">${id}</span>
            <span style="display: block; font-size: 0.75rem; color: #94a3b8;">${item.ip} (${item.az})</span>
          </div>
          <span class="instance-chip-count" style="background: ${item.color}; color: #000">${item.count} hits</span>
        </div>
      `;
      })
      .join('');
  }

  // Auto-polling controls
  function startPolling() {
    if (isPolling) return;
    isPolling = true;
    pollIndicator.classList.add('active');
    pollStatusText.textContent = 'Auto-polling ALB in progress...';
    btnAutoPollToggle.textContent = '⏸ Pause Auto-Polling';
    btnAutoPollToggle.classList.replace('btn-secondary', 'btn-warning');

    const intervalMs = parseInt(pollSpeedSelect.value) || 2000;
    fetchInfo();
    pollIntervalId = setInterval(fetchInfo, intervalMs);
  }

  function stopPolling() {
    if (!isPolling) return;
    isPolling = false;
    pollIndicator.classList.remove('active');
    pollStatusText.textContent = 'Auto-polling paused';
    btnAutoPollToggle.textContent = '▶ Start Auto-Polling';
    btnAutoPollToggle.classList.replace('btn-warning', 'btn-secondary');

    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
  }

  // Event Listeners
  btnManualPing.addEventListener('click', () => {
    fetchInfo();
  });

  btnAutoPollToggle.addEventListener('click', () => {
    if (isPolling) {
      stopPolling();
    } else {
      startPolling();
    }
  });

  pollSpeedSelect.addEventListener('change', () => {
    if (isPolling) {
      stopPolling();
      startPolling();
    }
  });

  btnClearLog.addEventListener('click', () => {
    totalLogsCount = 0;
    logCountText.textContent = '0 Requests Logged';
    logStream.innerHTML = '';
    for (const key in instanceStats) {
      delete instanceStats[key];
    }
    renderInstanceChips();
  });

  copyClientIpBtn.addEventListener('click', () => {
    const ip = clientIpDisplay.textContent;
    navigator.clipboard.writeText(ip).then(() => {
      copyClientIpBtn.textContent = '✅ Copied!';
      setTimeout(() => {
        copyClientIpBtn.textContent = '📋 Copy';
      }, 2000);
    });
  });

  btnStress.addEventListener('click', async () => {
    btnStress.disabled = true;
    btnStress.textContent = '🔥 Stressing CPU...';
    try {
      const res = await fetch('/api/stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMs: 3000 })
      });
      const data = await res.json();
      alert(`CPU Stress Test Complete on ${data.instanceId}`);
    } catch (err) {
      alert('Failed to execute stress test');
    } finally {
      btnStress.disabled = false;
      btnStress.textContent = 'Simulate 3s CPU Load';
    }
  });

  btnToggleHeaders.addEventListener('click', () => {
    headersCollapsible.classList.toggle('hidden');
    btnToggleHeaders.textContent = headersCollapsible.classList.contains('hidden')
      ? 'Show Headers JSON'
      : 'Hide Headers JSON';
  });

  // Initial Execution
  checkHealth();
  fetchInfo();
  setInterval(checkHealth, 10000);
});
