// modules/marketing.js - Marketing Analytics Module

import { formatCurrency, formatPercent, formatNumber } from '../utils.js';

export function render(container, state, onStateChange) {
  // 1. Spend Simulator Math
  const marketingScale = state.marketingSpendScale;

  let totalSpend = 0;
  let totalRevenue = 0;
  let totalConversions = 0;
  let totalClicks = 0;
  let totalImpressions = 0;

  const adjustedCampaigns = state.marketingData.campaigns.map(c => {
    const spend = c.spend * marketingScale;
    
    // Diminishing returns calculation: as spend increases, conversion efficiency decays slightly
    const efficiency = marketingScale > 1 ? Math.pow(marketingScale, -0.18) : 1.0;
    const clicks = Math.round(c.clicks * marketingScale * efficiency);
    const conversions = Math.round(c.conversions * marketingScale * efficiency);
    const revenue = c.revenue * marketingScale * efficiency;
    const impressions = Math.round(c.impressions * marketingScale);

    totalSpend += spend;
    totalRevenue += revenue;
    totalConversions += conversions;
    totalClicks += clicks;
    totalImpressions += impressions;

    return {
      ...c,
      spend,
      clicks,
      conversions,
      revenue,
      impressions
    };
  });

  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const averageCac = totalConversions > 0 ? totalSpend / totalConversions : 0;

  // Funnel calculations
  const baseFunnel = state.marketingData.funnelBase;
  const funnelImpressions = Math.round(baseFunnel.impressions * marketingScale);
  const funnelClicks = Math.round(baseFunnel.clicks * marketingScale * (marketingScale > 1 ? Math.pow(marketingScale, -0.1) : 1.0));
  const funnelCartAdds = Math.round(baseFunnel.cartAdds * marketingScale * (marketingScale > 1 ? Math.pow(marketingScale, -0.15) : 1.0));
  const funnelPurchases = Math.round(baseFunnel.purchases * marketingScale * (marketingScale > 1 ? Math.pow(marketingScale, -0.2) : 1.0));

  // Drop-off conversions
  const ctr = funnelImpressions > 0 ? (funnelClicks / funnelImpressions) * 100 : 0;
  const clickToCart = funnelClicks > 0 ? (funnelCartAdds / funnelClicks) * 100 : 0;
  const cartToPurchase = funnelCartAdds > 0 ? (funnelPurchases / funnelCartAdds) * 100 : 0;
  const overallConv = funnelImpressions > 0 ? (funnelPurchases / funnelImpressions) * 100 : 0;

  // 2. Generate HTML Structure
  container.innerHTML = `
    <!-- Marketing Budget control -->
    <div class="simulator-panel animate-fade-in">
      <div class="simulator-title">
        <i data-lucide="piggy-bank"></i> Budget Scaling Simulator
      </div>
      <div class="simulator-controls">
        <div class="slider-group" style="max-width: 50%;">
          <div class="slider-label-row">
            <span>Unified Ad Spend Modifier (Models diminishing returns at scale)</span>
            <span class="val">${Math.round(marketingScale * 100)}%</span>
          </div>
          <input type="range" class="slider-input" id="mkt-spend" min="0.5" max="2.0" step="0.1" value="${marketingScale}">
        </div>
        <div style="flex-grow:1; display:flex; align-items:center; font-size:12px; color:var(--text-muted);">
          <p>
            <i data-lucide="alert-circle" style="color:var(--info); display:inline-block; vertical-align:middle; width:14px; margin-right:4px;"></i>
            <strong>Decision Model:</strong> Lowering budget increases ROAS but reduces aggregate sales volumes. Scaling budget increases total sales but drives CAC higher as audience fatigue sets in.
          </p>
        </div>
      </div>
    </div>

    <!-- KPIs Row -->
    <div class="dashboard-grid animate-fade-in">
      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Total Marketing Spend</span>
          <i data-lucide="dollar-sign" style="color: var(--primary);"></i>
        </div>
        <div class="kpi-value">${formatCurrency(totalSpend)}</div>
        <div class="kpi-trend trend-down" style="color:var(--text-muted)">
          Aggregated Campaign budgets
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Attributable Revenue</span>
          <i data-lucide="trending-up" style="color: var(--success);"></i>
        </div>
        <div class="kpi-value">${formatCurrency(totalRevenue)}</div>
        <div class="kpi-trend trend-up">
          Marketing sourcing index
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">ROAS Performance Ratio</span>
          <i data-lucide="percent" style="color: var(--info);"></i>
        </div>
        <div class="kpi-value">${roas.toFixed(2)}x</div>
        <div class="kpi-trend ${roas > 2.5 ? 'trend-up' : 'trend-down'}">
          Target: &gt; 3.0x ROAS
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Blended CAC</span>
          <i data-lucide="user-plus" style="color: var(--warning);"></i>
        </div>
        <div class="kpi-value">${formatCurrency(averageCac)}</div>
        <div class="kpi-trend ${averageCac < 25 ? 'trend-up' : 'trend-down'}">
          Avg acquisition unit cost
        </div>
      </div>
    </div>

    <!-- Funnel and Chart Section -->
    <div class="dashboard-grid animate-fade-in" style="margin-top: 10px;">
      <!-- Campaign ROI Chart -->
      <div class="card" style="grid-column: span 7;">
        <div class="card-header-row">
          <span class="card-title">Channel Cost vs Return Profile</span>
        </div>
        <div style="position: relative; height: 320px; width: 100%;">
          <canvas id="marketing-channels-chart"></canvas>
        </div>
      </div>

      <!-- Conversion Funnel visual -->
      <div class="card" style="grid-column: span 5;">
        <div class="card-header-row">
          <span class="card-title">Sales Conversion Funnel</span>
          <span class="badge badge-info">Overall: ${overallConv.toFixed(2)}%</span>
        </div>
        
        <div class="funnel-container">
          <!-- Stage 1 -->
          <div class="funnel-stage">
            <span class="funnel-stage-label">Impressions</span>
            <div class="funnel-stage-visual" style="width: 100%; background: linear-gradient(90deg, #6366f1, #4f46e5)">
              ${formatNumber(funnelImpressions)}
            </div>
            <span class="funnel-stage-conversion">Base</span>
          </div>

          <!-- Stage 2 -->
          <div class="funnel-stage">
            <span class="funnel-stage-label">Clicks</span>
            <div class="funnel-stage-visual" style="width: 80%; background: linear-gradient(90deg, #4f46e5, #06b6d4)">
              ${formatNumber(funnelClicks)}
            </div>
            <span class="funnel-stage-conversion">CTR: ${ctr.toFixed(1)}%</span>
          </div>

          <!-- Stage 3 -->
          <div class="funnel-stage">
            <span class="funnel-stage-label">Cart Additions</span>
            <div class="funnel-stage-visual" style="width: 55%; background: linear-gradient(90deg, #06b6d4, #0891b2)">
              ${formatNumber(funnelCartAdds)}
            </div>
            <span class="funnel-stage-conversion">Add: ${clickToCart.toFixed(1)}%</span>
          </div>

          <!-- Stage 4 -->
          <div class="funnel-stage">
            <span class="funnel-stage-label">Checkout Success</span>
            <div class="funnel-stage-visual" style="width: 35%; background: linear-gradient(90deg, #0891b2, #10b981)">
              ${formatNumber(funnelPurchases)}
            </div>
            <span class="funnel-stage-conversion">Buy: ${cartToPurchase.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Campaigns Details Table -->
    <div class="card animate-fade-in" style="margin-top: 10px;">
      <div class="card-header-row">
        <span class="card-title">Channel Campaign Audit</span>
        <span class="badge badge-success">6 Active Streams</span>
      </div>
      
      <div class="custom-table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Channel Type</th>
              <th>Simulated Spend</th>
              <th>Clicks (CTR)</th>
              <th>Conversions</th>
              <th>Acquisition CAC</th>
              <th>Revenue / ROI</th>
            </tr>
          </thead>
          <tbody>
            ${adjustedCampaigns.map(c => {
              const campCtr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
              const campCac = c.conversions > 0 ? c.spend / c.conversions : 0;
              const campRoi = c.spend > 0 ? ((c.revenue - c.spend) / c.spend) * 100 : 0;
              return `
                <tr>
                  <td style="font-weight:600;">${c.name}</td>
                  <td>${c.channel}</td>
                  <td>${formatCurrency(c.spend)}</td>
                  <td>${formatNumber(c.clicks)} <span style="font-size:11px; color:var(--text-muted);">(${campCtr.toFixed(1)}%)</span></td>
                  <td>${formatNumber(c.conversions)}</td>
                  <td>${formatCurrency(campCac)}</td>
                  <td>
                    <div style="font-weight:600; color:var(--success);">${formatCurrency(c.revenue)}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${formatPercent(campRoi)} ROI</div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Initialize Icons
  lucide.createIcons();

  // 3. Connect Slider
  const spendSlider = container.querySelector('#mkt-spend');
  spendSlider.addEventListener('input', (e) => {
    e.target.previousElementSibling.querySelector('.val').textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
  });
  spendSlider.addEventListener('change', (e) => {
    onStateChange({ marketingSpendScale: parseFloat(e.target.value) });
  });

  // 4. Render Chart.js - Spend vs Revenue Bar Chart
  if (state.activeCharts) {
    state.activeCharts.forEach(c => c.destroy());
  }
  state.activeCharts = [];

  const mktCtx = container.querySelector('#marketing-channels-chart').getContext('2d');
  
  const labels = adjustedCampaigns.map(c => c.name.split(' ').slice(0, 2).join(' ')); // Shorten names
  const spends = adjustedCampaigns.map(c => c.spend);
  const revenues = adjustedCampaigns.map(c => c.revenue);

  const mktChart = new Chart(mktCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Campaign Cost',
          data: spends,
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Attributed Return',
          data: revenues,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 4
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
          ticks: { color: '#9ca3af', font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { 
            color: '#9ca3af',
            callback: function(value) { return '$' + value / 1000 + 'k'; }
          }
        }
      }
    }
  });
  state.activeCharts.push(mktChart);
}
