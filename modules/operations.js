// modules/operations.js - Operations & Supply Chain Module

import { formatCurrency, formatPercent, formatNumber } from '../utils.js';

export function render(container, state, onStateChange) {
  // 1. Calculations & State
  const supplierScale = state.supplierLeadTimeScale;
  const reorderOffset = state.operationsReorderOffset || 0; // offset in units added to reorder thresholds

  // Calculations on inventory
  let totalTiedCapital = 0;
  let criticalSkuCount = 0;

  const adjustedInventory = state.operationsData.inventory.map(item => {
    const capital = item.stock * item.unitCost;
    totalTiedCapital += capital;
    
    const adjustedReorder = Math.max(0, item.reorderPoint + reorderOffset);
    const isCritical = item.stock < adjustedReorder;
    if (isCritical) criticalSkuCount++;

    return {
      ...item,
      capital,
      adjustedReorder,
      isCritical
    };
  });

  // Delivery performance
  const rawOTD = state.operationsData.deliveryMetrics.reduce((acc, curr) => acc + curr.onTime, 0) / state.operationsData.deliveryMetrics.length;
  // OTD rate scales inversely with supplier delay scale
  const avgOTD = supplierScale > 1.0 
    ? Math.max(70, rawOTD - (supplierScale - 1.0) * 15) 
    : Math.min(99.9, rawOTD + (1.0 - supplierScale) * 5);

  // Delay is directly proportional to lead time scale
  const adjustedDelays = state.operationsData.deliveryMetrics.map(m => {
    return { ...m, delay: m.avgDelayHours * supplierScale };
  });
  const avgDelay = adjustedDelays.reduce((acc, curr) => acc + curr.delay, 0) / adjustedDelays.length;

  // 2. Generate HTML Layout
  container.innerHTML = `
    <!-- Operations controls -->
    <div class="simulator-panel animate-fade-in">
      <div class="simulator-title">
        <i data-lucide="package-open"></i> Logistics & Inventory Buffer Adjusters
      </div>
      <div class="simulator-controls">
        <div class="slider-group">
          <div class="slider-label-row">
            <span>Supplier Lead Time Scale (Vendor delivery delay)</span>
            <span class="val">${Math.round(supplierScale * 100)}%</span>
          </div>
          <input type="range" class="slider-input" id="ops-supplier" min="0.5" max="2.0" step="0.1" value="${supplierScale}">
        </div>
        
        <div class="slider-group">
          <div class="slider-label-row">
            <span>Reorder Threshold Offset</span>
            <span class="val">${reorderOffset > 0 ? '+' : ''}${reorderOffset} units</span>
          </div>
          <input type="range" class="slider-input" id="ops-reorder" min="-50" max="100" step="10" value="${reorderOffset}">
        </div>

        <div style="flex-grow:1; display:flex; align-items:center; font-size:12px; color:var(--text-muted);">
          <p>
            <i data-lucide="info" style="color:var(--info); display:inline-block; vertical-align:middle; width:14px; margin-right:4px;"></i>
            <strong>Portfolio Context:</strong> Boosting Reorder Thresholds increases safety buffers (fewer stockouts) but ties up more corporate liquid capital in warehousing.
          </p>
        </div>
      </div>
    </div>

    <!-- Active Toast Alert -->
    <div id="restock-toast" style="display:none; background:rgba(6, 182, 212, 0.15); border:1px solid var(--info); color:white; padding:10px 16px; border-radius:8px; margin-bottom:20px; font-size:12px;" class="animate-fade-in"></div>

    <!-- KPIs Row -->
    <div class="dashboard-grid animate-fade-in">
      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">On-Time Delivery (OTD)</span>
          <i data-lucide="check-circle" style="color: var(--success);"></i>
        </div>
        <div class="kpi-value">${formatPercent(avgOTD)}</div>
        <div class="kpi-trend trend-up">
          Fulfillment success rate
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Critical stock alert SKUs</span>
          <i data-lucide="alert-triangle" style="color: var(--danger);"></i>
        </div>
        <div class="kpi-value" style="color:${criticalSkuCount > 0 ? 'var(--danger)' : 'white'}">${criticalSkuCount} SKUs</div>
        <div class="kpi-trend ${criticalSkuCount === 0 ? 'trend-up' : 'trend-down'}">
          Stock below safety threshold
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Avg Carrier Delay</span>
          <i data-lucide="clock" style="color: var(--warning);"></i>
        </div>
        <div class="kpi-value">${avgDelay.toFixed(1)} hrs</div>
        <div class="kpi-trend trend-down" style="color:var(--text-muted);">
          Logistical latency
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Warehouse Tied Capital</span>
          <i data-lucide="package" style="color: var(--primary);"></i>
        </div>
        <div class="kpi-value">${formatCurrency(totalTiedCapital)}</div>
        <div class="kpi-trend trend-up">
          Valuation of current stocks
        </div>
      </div>
    </div>

    <!-- Chart & Table Row -->
    <div class="dashboard-grid animate-fade-in" style="margin-top: 10px;">
      <!-- Fulfillment Latency Chart -->
      <div class="card" style="grid-column: span 5;">
        <div class="card-header-row">
          <span class="card-title">OTD & Delay Trends by Day</span>
        </div>
        <div style="position: relative; height: 320px; width: 100%;">
          <canvas id="ops-delivery-chart"></canvas>
        </div>
      </div>

      <!-- Inventory Ledger -->
      <div class="card" style="grid-column: span 7;">
        <div class="card-header-row">
          <span class="card-title">Fulfillment Inventory Sheet</span>
          <span class="badge badge-info">${adjustedInventory.length} Tracking items</span>
        </div>
        
        <div class="custom-table-container" style="max-height: 280px; overflow-y: auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>SKU / Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Min Limit</th>
                <th>Tied Capital</th>
                <th>Fulfillment Action</th>
              </tr>
            </thead>
            <tbody>
              ${adjustedInventory.map(item => `
                <tr style="${item.isCritical ? 'background: rgba(239, 68, 68, 0.03);' : ''}">
                  <td>
                    <div style="font-weight:600;">${item.name}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${item.sku}</div>
                  </td>
                  <td>${item.category}</td>
                  <td style="font-weight:700; color:${item.isCritical ? 'var(--danger)' : 'white'}">${item.stock} units</td>
                  <td>${item.adjustedReorder}</td>
                  <td>${formatCurrency(item.capital)}</td>
                  <td>
                    <button class="btn restock-action-btn" style="padding: 4px 10px; font-size:11px; background:${item.isCritical ? 'var(--danger)' : 'var(--primary)'}" data-sku="${item.sku}" data-name="${item.name}">
                      Restock 100
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Initialize Icons
  lucide.createIcons();

  // 3. Connect restock event triggers
  const restockButtons = container.querySelectorAll('.restock-action-btn');
  const toast = container.querySelector('#restock-toast');

  restockButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sku = e.target.getAttribute('data-sku');
      const name = e.target.getAttribute('data-name');

      const invIndex = state.operationsData.inventory.findIndex(item => item.sku === sku);
      if (invIndex !== -1) {
        // Increment stock by 100
        state.operationsData.inventory[invIndex].stock += 100;
        
        toast.style.display = 'block';
        toast.innerHTML = `<i data-lucide="check" style="width:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Dispatched replenishment order for 100 units of <strong>${name}</strong>. Stock levels refreshed!`;
        lucide.createIcons();

        // Re-render
        render(container, state, onStateChange);
      }
    });
  });

  // 4. Connect Sliders
  const supplierSlider = container.querySelector('#ops-supplier');
  const reorderSlider = container.querySelector('#ops-reorder');

  supplierSlider.addEventListener('input', (e) => {
    e.target.previousElementSibling.querySelector('.val').textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
  });
  supplierSlider.addEventListener('change', (e) => {
    onStateChange({ supplierLeadTimeScale: parseFloat(e.target.value) });
  });

  reorderSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    e.target.previousElementSibling.querySelector('.val').textContent = (val > 0 ? '+' : '') + val + ' units';
  });
  reorderSlider.addEventListener('change', (e) => {
    onStateChange({ operationsReorderOffset: parseInt(e.target.value) });
  });

  // 5. Render Chart.js - Daily Delivery Success / Latency
  if (state.activeCharts) {
    state.activeCharts.forEach(c => c.destroy());
  }
  state.activeCharts = [];

  const delCtx = container.querySelector('#ops-delivery-chart').getContext('2d');
  
  const labels = adjustedDelays.map(m => m.date);
  const otdRates = adjustedDelays.map(m => m.onTime);
  const latencies = adjustedDelays.map(m => m.delay);

  const deliveryChart = new Chart(delCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'On-Time Rate %',
          data: otdRates,
          borderColor: '#10b981',
          borderWidth: 2,
          pointBackgroundColor: '#10b981',
          yAxisID: 'y-otd',
          tension: 0.3,
          fill: false
        },
        {
          label: 'Latency (Hrs)',
          data: latencies,
          borderColor: '#f59e0b',
          borderWidth: 2,
          pointBackgroundColor: '#f59e0b',
          yAxisID: 'y-delay',
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9ca3af', font: { family: 'Inter' } }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        'y-otd': {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { 
            color: '#9ca3af',
            callback: function(value) { return value + '%'; }
          },
          min: 80,
          max: 100
        },
        'y-delay': {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false }, // Avoid cluttering lines
          ticks: { 
            color: '#9ca3af',
            callback: function(value) { return value + 'h'; }
          },
          min: 0,
          max: 10
        }
      }
    }
  });
  state.activeCharts.push(deliveryChart);
}
