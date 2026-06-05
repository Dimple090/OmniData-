// modules/customer.js - Customer Analytics & Lifecycle Module

import { formatCurrency, formatPercent, formatNumber, calculateCustomerHealth } from '../utils.js';

export function render(container, state, onStateChange) {
  // 1. Calculations & Operations Tie-in
  const supplierScale = state.supplierLeadTimeScale;
  
  // Adjust customer churn risks based on operational supplier delays
  const adjustedCustomers = state.customerData.map(c => {
    let riskFactor = 1.0;
    if (supplierScale > 1.0) {
      riskFactor = 1.0 + (supplierScale - 1.0) * 0.4;
    } else if (supplierScale < 1.0) {
      riskFactor = 1.0 - (1.0 - supplierScale) * 0.2;
    }
    const churnRisk = Math.min(0.99, c.churnRisk * riskFactor);
    const health = calculateCustomerHealth({ ...c, churnRisk });
    return { ...c, churnRisk, health };
  });

  // Calculate metrics
  const avgHealth = Math.round(adjustedCustomers.reduce((acc, c) => acc + c.health, 0) / adjustedCustomers.length);
  const avgChurn = adjustedCustomers.reduce((acc, c) => acc + c.churnRisk, 0) / adjustedCustomers.length;
  
  // LTV = ARPU / Churn Rate
  const totalMonetary = adjustedCustomers.reduce((acc, c) => acc + c.monetary, 0);
  const arpu = totalMonetary / adjustedCustomers.length;
  const projectedLtv = avgChurn > 0 ? arpu / avgChurn : arpu;

  // Segment RFM groups
  let champions = 0, loyal = 0, developing = 0, atRisk = 0, hibernating = 0;
  adjustedCustomers.forEach(c => {
    if (c.recency <= 15 && c.frequency >= 15) champions++;
    else if (c.recency <= 35 && c.frequency >= 10) loyal++;
    else if (c.recency <= 60) developing++;
    else if (c.frequency >= 8) atRisk++;
    else hibernating++;
  });

  // 2. Generate HTML Layout
  container.innerHTML = `
    <!-- Operations Sensitivity Panel -->
    <div class="simulator-panel animate-fade-in">
      <div class="simulator-title">
        <i data-lucide="shield-alert"></i> Operations & Retention Sensitivity Link
      </div>
      <div class="simulator-controls">
        <div class="slider-group" style="max-width: 50%;">
          <div class="slider-label-row">
            <span>Supplier Lead Time Modifier (Delays increase client churn probability)</span>
            <span class="val">${Math.round(supplierScale * 100)}%</span>
          </div>
          <input type="range" class="slider-input" id="cust-supplier" min="0.5" max="2.0" step="0.1" value="${supplierScale}">
        </div>
        <div style="flex-grow:1; display:flex; align-items:center; font-size:12px; color:var(--text-muted);">
          <p>
            <i data-lucide="lightbulb" style="color:var(--warning); display:inline-block; vertical-align:middle; width:14px; margin-right:4px;"></i>
            <strong>Portfolio Context:</strong> If supplier delivery speeds are throttled, stocks run low, shipments are delayed, and customer churn metrics automatically deteriorate.
          </p>
        </div>
      </div>
    </div>

    <!-- Active Notification Banner -->
    <div id="retention-toast" style="display:none; background:rgba(16, 185, 129, 0.15); border:1px solid var(--success); color:white; padding:10px 16px; border-radius:8px; margin-bottom:20px; font-size:12px;" class="animate-fade-in"></div>

    <!-- KPIs Grid -->
    <div class="dashboard-grid animate-fade-in">
      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Average Database Health</span>
          <i data-lucide="heart" style="color: var(--success);"></i>
        </div>
        <div class="kpi-value">${avgHealth} / 100</div>
        <div class="kpi-trend trend-up">
          RFM & Sentiment Index
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Projected Customer LTV</span>
          <i data-lucide="bar-chart-2" style="color: var(--primary);"></i>
        </div>
        <div class="kpi-value">${formatCurrency(projectedLtv)}</div>
        <div class="kpi-trend trend-up">
          ARPU / Churn Rate Index
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Total Active Database</span>
          <i data-lucide="user-check" style="color: var(--info);"></i>
        </div>
        <div class="kpi-value">${formatNumber(adjustedCustomers.length)}</div>
        <div class="kpi-trend trend-up">
          Monitored profiles
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Expected Database Churn</span>
          <i data-lucide="alert-octagon" style="color: var(--danger);"></i>
        </div>
        <div class="kpi-value">${formatPercent(avgChurn * 100)}</div>
        <div class="kpi-trend trend-down">
          Annualized risk multiplier
        </div>
      </div>
    </div>

    <!-- Segments Breakdown & Details -->
    <div class="dashboard-grid animate-fade-in" style="margin-top: 10px;">
      <!-- RFM Segment Distribution Chart -->
      <div class="card" style="grid-column: span 4;">
        <div class="card-header-row">
          <span class="card-title">RFM Database Segments</span>
        </div>
        <div style="position: relative; height: 320px; width: 100%; display: flex; justify-content: center; align-items: center;">
          <canvas id="rfm-segment-chart"></canvas>
        </div>
      </div>

      <!-- Customer Ledger Table -->
      <div class="card" style="grid-column: span 8;">
        <div class="card-header-row">
          <span class="card-title">Database Lifecycle Ledger</span>
          <input type="text" class="ai-input" id="customer-search" placeholder="Search customer or country..." style="width:220px; padding: 6px 12px; margin-top:0;">
        </div>
        
        <div class="custom-table-container" style="max-height: 280px; overflow-y: auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Recency</th>
                <th>Frequency</th>
                <th>Total Spend</th>
                <th>Churn Risk</th>
                <th>Health</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="customer-table-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // 3. Render Table
  const tableBody = container.querySelector('#customer-table-body');
  const searchInput = container.querySelector('#customer-search');
  const toast = container.querySelector('#retention-toast');

  function renderTableRows(filterText = '') {
    const filter = filterText.toLowerCase();
    const filtered = adjustedCustomers.filter(c => 
      c.name.toLowerCase().includes(filter) || 
      c.country.toLowerCase().includes(filter)
    );

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-dark);">No match found</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(c => {
      const riskClass = c.churnRisk > 0.6 ? 'badge-danger' : c.churnRisk > 0.3 ? 'badge-warning' : 'badge-success';
      const healthClass = c.health > 75 ? 'color:var(--success);' : c.health > 45 ? 'color:var(--warning);' : 'color:var(--danger);';
      return `
        <tr>
          <td>
            <div style="font-weight:600;">${c.name}</div>
            <div style="font-size:11px; color:var(--text-muted);">${c.email}</div>
          </td>
          <td>${c.recency} d ago</td>
          <td>${c.frequency} orders</td>
          <td>${formatCurrency(c.monetary)}</td>
          <td>
            <span class="badge ${riskClass}">${formatPercent(c.churnRisk * 100)}</span>
          </td>
          <td style="font-weight:700; ${healthClass}">${c.health}</td>
          <td>
            <button class="btn btn-secondary trigger-offer-btn" style="padding: 4px 10px; font-size:11px;" data-id="${c.id}" data-name="${c.name}">
              Offer Promo
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach button listeners
    const offerButtons = tableBody.querySelectorAll('.trigger-offer-btn');
    offerButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const name = e.target.getAttribute('data-name');
        
        // Find index in global state and reduce churn risk manually as a simulation
        const cIndex = state.customerData.findIndex(item => item.id === id);
        if (cIndex !== -1) {
          state.customerData[cIndex].churnRisk = Math.max(0.01, state.customerData[cIndex].churnRisk - 0.25);
          state.customerData[cIndex].sentiment = Math.min(5.0, state.customerData[cIndex].sentiment + 0.5);
          
          toast.style.display = 'block';
          toast.innerHTML = `<i data-lucide="check" style="width:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Strategic promo discount dispatched to <strong>${name}</strong>. Customer churn risk has decreased by -25%!`;
          lucide.createIcons();
          
          // Re-render
          render(container, state, onStateChange);
        }
      });
    });
  }

  renderTableRows();

  searchInput.addEventListener('input', (e) => {
    renderTableRows(e.target.value);
  });

  // 4. Chart.js - RFM Segments Breakdown
  if (state.activeCharts) {
    state.activeCharts.forEach(c => c.destroy());
  }
  state.activeCharts = [];

  const rfmCtx = container.querySelector('#rfm-segment-chart').getContext('2d');
  const rfmChart = new Chart(rfmCtx, {
    type: 'polarArea',
    data: {
      labels: ['Champions', 'Loyal Customers', 'Developing', 'At Risk', 'Hibernating'],
      datasets: [{
        data: [champions, loyal, developing, atRisk, hibernating],
        backgroundColor: [
          'rgba(16, 185, 129, 0.65)',  // Champions (Green)
          'rgba(99, 102, 241, 0.65)',  // Loyal (Indigo)
          'rgba(6, 182, 212, 0.65)',   // Developing (Cyan)
          'rgba(245, 158, 11, 0.65)',  // At Risk (Amber)
          'rgba(239, 68, 68, 0.65)'    // Hibernating (Red)
        ],
        borderColor: '#0f172a',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { backdropColor: 'transparent', color: '#9ca3af' }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#9ca3af', font: { family: 'Inter', size: 10 } }
        }
      }
    }
  });
  state.activeCharts.push(rfmChart);

  // 5. Connect Sliders
  const supplierSlider = container.querySelector('#cust-supplier');
  supplierSlider.addEventListener('input', (e) => {
    e.target.previousElementSibling.querySelector('.val').textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
  });
  supplierSlider.addEventListener('change', (e) => {
    onStateChange({ supplierLeadTimeScale: parseFloat(e.target.value) });
  });

  // Initialize Icons
  lucide.createIcons();
}
