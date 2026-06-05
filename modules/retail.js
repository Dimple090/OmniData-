// modules/retail.js - Retail Analytics Module

import { formatCurrency, formatPercent, formatNumber } from '../utils.js';

export function render(container, state, onStateChange) {
  // 1. Calculations & State
  const markup = state.priceMarkup;
  const discount = state.discountRate;
  
  // Re-calculate retail variables
  const priceMultiplier = (markup / 1.3) * (1 - discount / 100);
  
  let totalRevenue = 0;
  let totalCost = 0;
  let totalSalesCount = 0;

  const adjustedTrends = state.retailData.monthlyTrends.map(t => {
    const rev = t.revenue * priceMultiplier;
    const cost = t.cost;
    const profit = rev - cost;
    totalRevenue += rev;
    totalCost += cost;
    totalSalesCount += t.salesCount;
    return {
      ...t,
      revenue: rev,
      profit: profit,
      margin: rev > 0 ? (profit / rev) * 100 : 0
    };
  });

  const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  const avgOrderValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

  // Category breakdown recalculations
  const adjustedCategories = state.retailData.categoryBreakdown.map(c => {
    const rev = c.revenue * priceMultiplier;
    const cost = c.cost;
    const profit = rev - cost;
    const margin = rev > 0 ? (profit / rev) * 100 : 0;
    return { ...c, revenue: rev, profit, margin };
  });

  // 2. Generate HTML Layout
  container.innerHTML = `
    <!-- Strategy Panel -->
    <div class="simulator-panel animate-fade-in">
      <div class="simulator-title">
        <i data-lucide="tag"></i> Retail Margin & Pricing Control
      </div>
      <div class="simulator-controls">
        <div class="slider-group" style="max-width: 45%;">
          <div class="slider-label-row">
            <span>Price Markup Ratio (Markup factor relative to cost)</span>
            <span class="val">${markup.toFixed(2)}x</span>
          </div>
          <input type="range" class="slider-input" id="retail-markup" min="1.1" max="2.0" step="0.05" value="${markup}">
        </div>
        
        <div class="slider-group" style="max-width: 45%;">
          <div class="slider-label-row">
            <span>Storewide Seasonal Discount</span>
            <span class="val">${discount}%</span>
          </div>
          <input type="range" class="slider-input" id="retail-discount" min="0" max="30" step="1" value="${discount}">
        </div>
      </div>
    </div>

    <!-- KPIs Row -->
    <div class="dashboard-grid animate-fade-in">
      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Retail Revenue</span>
          <i data-lucide="credit-card" style="color: var(--primary);"></i>
        </div>
        <div class="kpi-value">${formatCurrency(totalRevenue)}</div>
        <div class="kpi-trend trend-up">
          <i data-lucide="trending-up" style="width:14px; height:14px;"></i> Invoiced GMV
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Product Profit margin</span>
          <i data-lucide="percent" style="color: var(--success);"></i>
        </div>
        <div class="kpi-value">${formatPercent(avgMargin)}</div>
        <div class="kpi-trend ${avgMargin > 30 ? 'trend-up' : 'trend-down'}">
          Gross Profit: ${formatCurrency(totalRevenue - totalCost)}
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Transactions Logged</span>
          <i data-lucide="activity" style="color: var(--info);"></i>
        </div>
        <div class="kpi-value">${formatNumber(totalSalesCount)}</div>
        <div class="kpi-trend trend-up">
          Orders fulfilled
        </div>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Average Basket Value</span>
          <i data-lucide="shopping-cart" style="color: var(--warning);"></i>
        </div>
        <div class="kpi-value">${formatCurrency(avgOrderValue)}</div>
        <div class="kpi-trend trend-up">
          AOV per checkout
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="dashboard-grid animate-fade-in" style="margin-top: 10px;">
      <!-- Chart 1: Revenue vs Profit Trends -->
      <div class="card" style="grid-column: span 8;">
        <div class="card-header-row">
          <span class="card-title">Monthly Revenue & Net Profit Trend</span>
        </div>
        <div style="position: relative; height: 300px; width: 100%;">
          <canvas id="retail-trends-chart"></canvas>
        </div>
      </div>

      <!-- Chart 2: Category Breakdown Chart -->
      <div class="card" style="grid-column: span 4;">
        <div class="card-header-row">
          <span class="card-title">Revenue Share by Category</span>
        </div>
        <div style="position: relative; height: 300px; width: 100%; display: flex; justify-content: center; align-items: center;">
          <canvas id="retail-category-chart"></canvas>
        </div>
      </div>
    </div>

    <!-- Product Category Matrix -->
    <div class="card animate-fade-in" style="margin-top: 10px;">
      <div class="card-header-row">
        <span class="card-title">Product Category Margin Profiles</span>
        <span class="badge badge-success">5 Departments</span>
      </div>
      <div class="custom-table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Items Sold</th>
              <th>Simulated Revenue</th>
              <th>Direct Product Cost</th>
              <th>Department Margin</th>
              <th>Markup Status</th>
            </tr>
          </thead>
          <tbody>
            ${adjustedCategories.map(c => `
              <tr>
                <td style="font-weight:600;">${c.category}</td>
                <td>${formatNumber(c.itemsSold)}</td>
                <td>${formatCurrency(c.revenue)}</td>
                <td>${formatCurrency(c.cost)}</td>
                <td style="font-weight:600; color:${c.margin > 40 ? 'var(--success)' : 'var(--warning)'};">
                  ${formatPercent(c.margin)}
                </td>
                <td>
                  <span class="badge ${c.margin > 45 ? 'badge-success' : c.margin > 30 ? 'badge-info' : 'badge-warning'}">
                    ${c.margin > 45 ? 'Premium Margin' : c.margin > 30 ? 'Standard Margin' : 'Low Margin - Optimize'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Initialize Icons
  lucide.createIcons();

  // 3. Destroy previous charts to avoid canvas context conflicts
  if (state.activeCharts) {
    state.activeCharts.forEach(c => c.destroy());
  }
  state.activeCharts = [];

  // 4. Render Chart.js - Trends Chart (Combo Line/Bar)
  const trendsCtx = container.querySelector('#retail-trends-chart').getContext('2d');
  const labels = adjustedTrends.map(t => t.month);
  const revenues = adjustedTrends.map(t => t.revenue);
  const profits = adjustedTrends.map(t => t.profit);

  const trendsChart = new Chart(trendsCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Net Profit',
          type: 'line',
          data: profits,
          borderColor: '#10b981',
          borderWidth: 3,
          pointBackgroundColor: '#10b981',
          fill: false,
          tension: 0.35,
          order: 1
        },
        {
          label: 'Revenue',
          data: revenues,
          backgroundColor: 'rgba(99, 102, 241, 0.4)',
          borderColor: '#6366f1',
          borderWidth: 1,
          borderRadius: 4,
          order: 2
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
  state.activeCharts.push(trendsChart);

  // 5. Render Chart.js - Category Pie Chart
  const catCtx = container.querySelector('#retail-category-chart').getContext('2d');
  const catLabels = adjustedCategories.map(c => c.category);
  const catRevenues = adjustedCategories.map(c => c.revenue);

  const categoryChart = new Chart(catCtx, {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{
        data: catRevenues,
        backgroundColor: [
          'rgba(99, 102, 241, 0.75)',  // Indigo
          'rgba(6, 182, 212, 0.75)',   // Cyan
          'rgba(168, 85, 247, 0.75)',  // Purple
          'rgba(16, 185, 129, 0.75)',  // Emerald
          'rgba(245, 158, 11, 0.75)'   // Amber
        ],
        borderColor: '#0f172a',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#9ca3af', font: { family: 'Inter', size: 10 } }
        }
      }
    }
  });
  state.activeCharts.push(categoryChart);

  // 6. Connect Simulator Listeners
  const markupSlider = container.querySelector('#retail-markup');
  const discountSlider = container.querySelector('#retail-discount');

  markupSlider.addEventListener('input', (e) => {
    e.target.previousElementSibling.querySelector('.val').textContent = parseFloat(e.target.value).toFixed(2) + 'x';
  });
  markupSlider.addEventListener('change', (e) => {
    onStateChange({ priceMarkup: parseFloat(e.target.value) });
  });

  discountSlider.addEventListener('input', (e) => {
    e.target.previousElementSibling.querySelector('.val').textContent = e.target.value + '%';
  });
  discountSlider.addEventListener('change', (e) => {
    onStateChange({ discountRate: parseInt(e.target.value) });
  });
}
