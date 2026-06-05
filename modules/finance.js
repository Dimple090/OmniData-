// modules/finance.js - Finance Analytics & Forecasting Module

import { formatCurrency, formatPercent, forecastFutureRevenue } from '../utils.js';

export function render(container, state, onStateChange) {
  // 1. Inputs & Dynamic Variables
  const markup = state.priceMarkup;
  const discount = state.discountRate;
  const growthFactor = state.financeGrowthFactor || 1.0;
  const seasonalScale = state.financeSeasonalScale || 1.0;
  const marketingScale = state.marketingSpendScale;

  const priceMultiplier = (markup / 1.3) * (1 - discount / 100);

  // Re-calculate actual trends
  let actualRevenue = 0;
  let actualCost = 0;
  const adjustedTrends = state.retailData.monthlyTrends.map(t => {
    const rev = t.revenue * priceMultiplier;
    const cost = t.cost;
    actualRevenue += rev;
    actualCost += cost;
    return { ...t, revenue: rev, cost };
  });

  const avgMargin = actualRevenue > 0 ? ((actualRevenue - actualCost) / actualRevenue) * 100 : 0;

  // Forecast next 6 months
  const forecastTrends = forecastFutureRevenue(adjustedTrends, growthFactor, seasonalScale);
  const forecastedRevenue = forecastTrends.reduce((acc, curr) => acc + curr.revenue, 0);

  // Operational Expenses
  const fixedCosts = state.financeData.fixedMonthlyCosts; // rent, salaries, etc.
  const marketingSpend = state.marketingData.campaigns.reduce((acc, curr) => acc + curr.spend, 0) * marketingScale;
  
  // Breakeven = (Fixed Costs + Marketing Spend) / Margin%
  const monthlyFixedTotal = fixedCosts + (marketingSpend / 12);
  const breakevenPoint = avgMargin > 5 
    ? monthlyFixedTotal / (avgMargin / 100) 
    : 0;

  // EBITDA Calculation
  // EBITDA = Revenue - Product Cost - Marketing Spend - Fixed Operating Costs
  const totalOperatingCosts = actualCost + marketingSpend + (fixedCosts * 12);
  const ebitda = actualRevenue - totalOperatingCosts;
  const ebitdaMargin = actualRevenue > 0 ? (ebitda / actualRevenue) * 100 : 0;

  // Tax Reserves
  const taxRate = state.financeData.taxRate;
  const taxReserve = ebitda > 0 ? (ebitda * taxRate) / 100 : 0;

  // 2. Generate HTML Structure
  container.innerHTML = `
    <!-- Forecast adjusters -->
    <div class="simulator-panel animate-fade-in">
      <div class="simulator-title">
        <i data-lucide="line-chart"></i> Predictive Analytics & Forecasting Simulator
      </div>
      <div class="simulator-controls">
        <div class="slider-group">
          <div class="slider-label-row">
            <span>Optimistic Growth Modifier</span>
            <span class="val">${Math.round(growthFactor * 100)}%</span>
          </div>
          <input type="range" class="slider-input" id="fin-growth" min="0.7" max="1.5" step="0.05" value="${growthFactor}">
        </div>
        
        <div class="slider-group">
          <div class="slider-label-row">
            <span>Seasonality Sensitivity</span>
            <span class="val">${Math.round(seasonalScale * 100)}%</span>
          </div>
          <input type="range" class="slider-input" id="fin-season" min="0.3" max="1.8" step="0.1" value="${seasonalScale}">
        </div>

        <div style="flex-grow:1; display:flex; align-items:center; font-size:12px; color:var(--text-muted);">
          <p>
            <i data-lucide="sparkles" style="color:var(--purple); display:inline-block; vertical-align:middle; width:14px; margin-right:4px;"></i>
            <strong>Math Model:</strong> Uses a 12-month Linear Regression slope modified by seasonal coefficients (Q4 spike) and user growth scaling constants.
          </p>
        </div>
      </div>
    </div>

    <!-- KPIs Row -->
    <div class="dashboard-grid animate-fade-in">
      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Forecasted 6M Sales</span>
          <i data-lucide="trending-up" style="color: var(--purple);"></i>
        </div>
        <div class="kpi-value">${formatCurrency(forecastedRevenue)}</div>
        <div class="kpi-trend trend-up">
          H2 Projected GMV
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Monthly Breakeven</span>
          <i data-lucide="shield" style="color: var(--success);"></i>
        </div>
        <div class="kpi-value">${breakevenPoint > 0 ? formatCurrency(breakevenPoint) : 'Margin Deficit'}</div>
        <div class="kpi-trend trend-up">
          Rent + Marketing Covered
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">EBITDA Margin</span>
          <i data-lucide="dollar-sign" style="color: var(--info);"></i>
        </div>
        <div class="kpi-value">${formatPercent(ebitdaMargin)}</div>
        <div class="kpi-trend ${ebitda > 0 ? 'trend-up' : 'trend-down'}">
          EBITDA: ${formatCurrency(ebitda)}
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Corp Tax Reserve</span>
          <i data-lucide="landmark" style="color: var(--warning);"></i>
        </div>
        <div class="kpi-value">${formatCurrency(taxReserve)}</div>
        <div class="kpi-trend trend-down" style="color:var(--text-muted);">
          Effective Tax rate: ${taxRate}%
        </div>
      </div>
    </div>

    <!-- Chart Row -->
    <div class="card animate-fade-in" style="margin-top:10px; width: 100%;">
      <div class="card-header-row">
        <span class="card-title">Enterprise Sales Forecast (12 Months History + 6 Months Forecast Projections)</span>
        <span class="badge" style="background:rgba(168, 85, 247, 0.15); color:#d8b4fe;">Linear Regression + Seasonality</span>
      </div>
      <div style="position: relative; height: 320px; width: 100%;">
        <canvas id="finance-forecast-chart"></canvas>
      </div>
    </div>

    <!-- Table breakdown -->
    <div class="card animate-fade-in" style="margin-top: 10px;">
      <div class="card-header-row">
        <span class="card-title">Corporate Cost & Profitability Sheet</span>
      </div>
      <div class="custom-table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Revenue / Projected</th>
              <th>Research Spend</th>
              <th>Net Operating Profit</th>
              <th>EBITDA Margin</th>
            </tr>
          </thead>
          <tbody>
            ${state.financeData.historicalYears.map(h => {
              const margin = (h.profit / h.revenue) * 100;
              return `
                <tr>
                  <td>${h.year} (Historical)</td>
                  <td>${formatCurrency(h.revenue)}</td>
                  <td>${formatCurrency(h.rndSpend)}</td>
                  <td style="color:var(--success); font-weight:600;">${formatCurrency(h.profit)}</td>
                  <td>${formatPercent(margin)}</td>
                </tr>
              `;
            }).join('')}
            <tr style="border-top:2px dashed rgba(255,255,255,0.1); background: rgba(99,102,241,0.05);">
              <td style="font-weight:600; color:var(--purple);">2026 (Forecasted H2)</td>
              <td style="font-weight:600; color:var(--purple);">${formatCurrency(forecastedRevenue)}</td>
              <td>${formatCurrency(120000)} <span style="font-size:11px; color:var(--text-muted);">(Est)</span></td>
              <td style="color:var(--success); font-weight:600;">${formatCurrency(forecastedRevenue * (avgMargin/100))}</td>
              <td style="font-weight:600;">${formatPercent(avgMargin)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Initialize Icons
  lucide.createIcons();

  // 3. Connect Slider listeners
  const growthSlider = container.querySelector('#fin-growth');
  const seasonSlider = container.querySelector('#fin-season');

  growthSlider.addEventListener('input', (e) => {
    e.target.previousElementSibling.querySelector('.val').textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
  });
  growthSlider.addEventListener('change', (e) => {
    onStateChange({ financeGrowthFactor: parseFloat(e.target.value) });
  });

  seasonSlider.addEventListener('input', (e) => {
    e.target.previousElementSibling.querySelector('.val').textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
  });
  seasonSlider.addEventListener('change', (e) => {
    onStateChange({ financeSeasonalScale: parseFloat(e.target.value) });
  });

  // 4. Render Chart.js - Historical & Forecast trends (Dashed / Solid combos)
  if (state.activeCharts) {
    state.activeCharts.forEach(c => c.destroy());
  }
  state.activeCharts = [];

  const forecastCtx = container.querySelector('#finance-forecast-chart').getContext('2d');
  
  // Combine historical months + forecast months
  const allMonths = [...adjustedTrends.map(t => t.month), ...forecastTrends.map(t => t.month)];
  const histRevs = adjustedTrends.map(t => t.revenue);
  const foreRevs = forecastTrends.map(t => t.revenue);
  
  // Padding arrays so charts line up
  const displayHistDataset = [...histRevs, ...Array(foreRevs.length).fill(null)];
  // We want the forecast to connect to the last historical point
  const displayForeDataset = [...Array(histRevs.length - 1).fill(null), histRevs[histRevs.length - 1], ...foreRevs];

  const forecastChart = new Chart(forecastCtx, {
    type: 'line',
    data: {
      labels: allMonths,
      datasets: [
        {
          label: 'Historical Sales',
          data: displayHistDataset,
          borderColor: '#6366f1',
          borderWidth: 3,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Forecast Sales',
          data: displayForeDataset,
          borderColor: '#a855f7',
          borderWidth: 3,
          borderDash: [6, 6],
          backgroundColor: 'rgba(168, 85, 247, 0.05)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#a855f7'
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
  state.activeCharts.push(forecastChart);
}
