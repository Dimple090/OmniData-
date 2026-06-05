// modules/scenario.js - Scenario Simulator Module

import { formatCurrency, formatPercent, formatNumber } from '../utils.js';

export function render(container, state, onStateChange) {
  // 1. Load baseline parameters (Unmodified states)
  // Check if scenario states are initialized, otherwise set defaults
  const mktPercent = state.scenMktModifier !== undefined ? state.scenMktModifier : 20; // default +20%
  const delayPercent = state.scenDelayModifier !== undefined ? state.scenDelayModifier : 10; // default +10%
  const churnPercent = state.scenChurnModifier !== undefined ? state.scenChurnModifier : -5; // default -5%

  // BASELINE Calculations (using 100% baseline parameters)
  let baseRevenue = 0;
  let baseProductCost = 0;
  state.retailData.monthlyTrends.forEach(t => {
    // Standard baseline pricing markup 1.30, discount 0
    const mult = (state.priceMarkup / 1.3) * (1 - state.discountRate / 100);
    baseRevenue += t.revenue * mult;
    baseProductCost += t.cost;
  });

  const baseFixedCosts = state.financeData.fixedMonthlyCosts * 12;
  const baseMarketingSpend = state.marketingData.campaigns.reduce((acc, curr) => acc + curr.spend, 0) * state.marketingSpendScale;
  const baseTotalCosts = baseProductCost + baseFixedCosts + baseMarketingSpend;
  const baseProfit = baseRevenue - baseTotalCosts;
  
  const baseAvgChurn = state.customerData.reduce((acc, curr) => acc + curr.churnRisk, 0) / state.customerData.length;
  const baseAvgRetention = (1 - baseAvgChurn) * 100;

  // SIMULATED Calculations (modified by percentages)
  // A. Marketing impact on revenue: Every +10% spend increases revenue by +1.5% (diminishing return factor)
  const mktRevenueScale = 1.0 + (mktPercent / 100) * 0.15;
  
  // B. Delivery delay impact on revenue: Every +10% delay reduces sales volume by -0.8%
  const delayRevenueScale = 1.0 - (delayPercent / 100) * 0.08;
  
  // C. Churn impact on revenue: Every -10% churn (improving retention) increases customer spending base by +2.5%
  // Churn modifier is inverted (e.g. -5% churn means +1.25% revenue)
  const churnRevenueScale = 1.0 - (churnPercent / 100) * 0.25;

  const simRevenue = baseRevenue * mktRevenueScale * delayRevenueScale * churnRevenueScale;

  // Costs mapping
  const simMarketingSpend = baseMarketingSpend * (1.0 + (mktPercent / 100));
  // Operational delays increase fulfillment freight costs: Every +10% delay adds +1.2% to operating overhead
  const simFulfillmentCosts = baseFixedCosts * (1.0 + (delayPercent / 100) * 0.12);
  
  const simProfit = simRevenue - (baseProductCost + simMarketingSpend + simFulfillmentCosts);

  // Customer Churn impact
  // Delivery delays increase churn: Every +10% delay adds +2% to average database churn risk
  const delayChurnImpact = (delayPercent / 100) * 0.2;
  // Direct retention efforts reduce churn
  const directChurnImpact = churnPercent / 100;
  
  const simAvgChurn = Math.max(0.01, Math.min(0.99, baseAvgChurn + directChurnImpact + delayChurnImpact));
  const simAvgRetention = (1 - simAvgChurn) * 100;

  // Differences
  const revDiff = simRevenue - baseRevenue;
  const revDiffPct = (revDiff / baseRevenue) * 100;

  const profitDiff = simProfit - baseProfit;
  const profitDiffPct = baseProfit > 0 ? (profitDiff / baseProfit) * 100 : 0;

  const retDiff = simAvgRetention - baseAvgRetention;

  // 2. Generate HTML Layout
  container.innerHTML = `
    <!-- Scenario Controller panel -->
    <div class="simulator-panel animate-fade-in">
      <div class="simulator-title">
        <i data-lucide="sliders"></i> Active Parameter Modifier (Simulate corporate interventions)
      </div>
      <div class="simulator-controls">
        <div class="slider-group">
          <div class="slider-label-row">
            <span>Marketing Budget Intervene</span>
            <span class="val" style="color:var(--primary); font-weight:700;">${mktPercent > 0 ? '+' : ''}${mktPercent}%</span>
          </div>
          <input type="range" class="slider-input" id="scen-mkt" min="-50" max="100" step="5" value="${mktPercent}">
        </div>

        <div class="slider-group">
          <div class="slider-label-row">
            <span>Delivery Delay Modifier</span>
            <span class="val" style="color:var(--warning); font-weight:700;">${delayPercent > 0 ? '+' : ''}${delayPercent}%</span>
          </div>
          <input type="range" class="slider-input" id="scen-delay" min="-50" max="100" step="5" value="${delayPercent}">
        </div>

        <div class="slider-group">
          <div class="slider-label-row">
            <span>Database Churn Intervention</span>
            <span class="val" style="color:var(--success); font-weight:700;">${churnPercent > 0 ? '+' : ''}${churnPercent}%</span>
          </div>
          <input type="range" class="slider-input" id="scen-churn" min="-30" max="30" step="1" value="${churnPercent}">
        </div>
      </div>
      
      <!-- Save Scenario Controls -->
      <div style="margin-top:16px; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:flex-end; gap:12px; flex-wrap:wrap;">
        <span style="font-size:11px; color:var(--text-dark);"><i data-lucide="info" style="width:11px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Save settings to compare configurations</span>
        <input type="text" class="ai-input" id="scen-name-input" placeholder="e.g. Q4 Target Budget..." style="width:180px; margin-top:0; padding:6px 12px; font-size:11px;">
        <button class="btn" id="scen-save-btn" style="padding:6px 14px; font-size:11px; background:var(--purple); box-shadow:0 4px 12px var(--purple-glow);">
          <i data-lucide="save" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Save Scenario
        </button>
      </div>
    </div>

    <!-- Variance Cards Grid -->
    <div class="dashboard-grid animate-fade-in">
      <!-- Revenue Card -->
      <div class="card" style="grid-column: span 4;">
        <div class="card-header-row">
          <span class="card-title">Revenue Strategic Impact</span>
          <i data-lucide="dollar-sign" style="color: var(--primary);"></i>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Baseline</div>
            <div style="font-size:18px; font-weight:600; color:var(--text-muted);">${formatCurrency(baseRevenue)}</div>
            
            <div style="font-size:11px; color:var(--text-muted); margin-top:8px; margin-bottom:2px;">Simulated</div>
            <div class="kpi-value" style="font-size:26px; margin-bottom:0;">${formatCurrency(simRevenue)}</div>
          </div>
          <div style="text-align:right;">
            <span class="kpi-trend ${revDiff >= 0 ? 'trend-up' : 'trend-down'}" style="font-size:16px;">
              <i data-lucide="${revDiff >= 0 ? 'trending-up' : 'trending-down'}" style="width:18px; height:18px;"></i>
              ${revDiff >= 0 ? '+' : ''}${formatCurrency(revDiff)}
            </span>
            <div style="font-size:11px; font-weight:600; color:${revDiff >= 0 ? 'var(--success)' : 'var(--danger)'}; margin-top:4px;">
              (${revDiff >= 0 ? '+' : ''}${revDiffPct.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      <!-- Profit Card -->
      <div class="card" style="grid-column: span 4;">
        <div class="card-header-row">
          <span class="card-title">Net Profit Strategic Impact</span>
          <i data-lucide="briefcase" style="color: var(--success);"></i>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Baseline</div>
            <div style="font-size:18px; font-weight:600; color:var(--text-muted);">${formatCurrency(baseProfit)}</div>
            
            <div style="font-size:11px; color:var(--text-muted); margin-top:8px; margin-bottom:2px;">Simulated</div>
            <div class="kpi-value" style="font-size:26px; margin-bottom:0; color:${simProfit > baseProfit ? 'var(--success)' : 'white'}">${formatCurrency(simProfit)}</div>
          </div>
          <div style="text-align:right;">
            <span class="kpi-trend ${profitDiff >= 0 ? 'trend-up' : 'trend-down'}" style="font-size:16px;">
              <i data-lucide="${profitDiff >= 0 ? 'trending-up' : 'trending-down'}" style="width:18px; height:18px;"></i>
              ${profitDiff >= 0 ? '+' : ''}${formatCurrency(profitDiff)}
            </span>
            <div style="font-size:11px; font-weight:600; color:${profitDiff >= 0 ? 'var(--success)' : 'var(--danger)'}; margin-top:4px;">
              (${profitDiff >= 0 ? '+' : ''}${profitDiffPct.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Churn/Retention Card -->
      <div class="card" style="grid-column: span 4;">
        <div class="card-header-row">
          <span class="card-title">Customer Retention Impact</span>
          <i data-lucide="users" style="color: var(--info);"></i>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Baseline Retention</div>
            <div style="font-size:18px; font-weight:600; color:var(--text-muted);">${baseAvgRetention.toFixed(1)}%</div>
            
            <div style="font-size:11px; color:var(--text-muted); margin-top:8px; margin-bottom:2px;">Simulated Retention</div>
            <div class="kpi-value" style="font-size:26px; margin-bottom:0; color:${retDiff >= 0 ? 'var(--success)' : 'var(--danger)'}">${simAvgRetention.toFixed(1)}%</div>
          </div>
          <div style="text-align:right;">
            <span class="kpi-trend ${retDiff >= 0 ? 'trend-up' : 'trend-down'}" style="font-size:16px;">
              <i data-lucide="${retDiff >= 0 ? 'trending-up' : 'trending-down'}" style="width:18px; height:18px;"></i>
              ${retDiff >= 0 ? '+' : ''}${retDiff.toFixed(1)}%
            </span>
            <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
              New Churn: ${formatPercent(simAvgChurn*100)}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparative Visual and Economic Table -->
    <div class="dashboard-grid animate-fade-in" style="margin-top: 10px;">
      <!-- Chart Column -->
      <div class="card" style="grid-column: span 6;">
        <div class="card-header-row">
          <span class="card-title">Strategic Financial Delta Chart</span>
        </div>
        <div style="position: relative; height: 300px; width: 100%;">
          <canvas id="scenario-delta-chart"></canvas>
        </div>
      </div>

      <!-- Economic impact table -->
      <div class="card" style="grid-column: span 6;">
        <div class="card-header-row">
          <span class="card-title">Impact Variance Sheet</span>
        </div>
        <div class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Strategic Stream</th>
                <th>Baseline</th>
                <th>Simulated</th>
                <th>Variance Delta</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight:600;">Marketing Expense</td>
                <td>${formatCurrency(baseMarketingSpend)}</td>
                <td>${formatCurrency(simMarketingSpend)}</td>
                <td style="color:${mktPercent > 0 ? 'var(--danger)' : 'var(--success)'};">
                  ${mktPercent > 0 ? '+' : ''}${formatCurrency(simMarketingSpend - baseMarketingSpend)}
                </td>
              </tr>
              <tr>
                <td style="font-weight:600;">Operating Overhead</td>
                <td>${formatCurrency(baseFixedCosts)}</td>
                <td>${formatCurrency(simFulfillmentCosts)}</td>
                <td style="color:${delayPercent > 0 ? 'var(--danger)' : 'var(--success)'};">
                  ${delayPercent > 0 ? '+' : ''}${formatCurrency(simFulfillmentCosts - baseFixedCosts)}
                </td>
              </tr>
              <tr>
                <td style="font-weight:600;">Gross Revenues</td>
                <td style="font-weight:600;">${formatCurrency(baseRevenue)}</td>
                <td style="font-weight:600; color:var(--info);">${formatCurrency(simRevenue)}</td>
                <td style="font-weight:600; color:${revDiff >= 0 ? 'var(--success)' : 'var(--danger)'}">
                  ${revDiff >= 0 ? '+' : ''}${formatCurrency(revDiff)}
                </td>
              </tr>
              <tr style="background:rgba(255,255,255,0.02);">
                <td style="font-weight:700; color:white;">Net Profit Margin</td>
                <td style="font-weight:700;">${formatCurrency(baseProfit)}</td>
                <td style="font-weight:700; color:var(--success);">${formatCurrency(simProfit)}</td>
                <td style="font-weight:700; color:${profitDiff >= 0 ? 'var(--success)' : 'var(--danger)'}">
                  ${profitDiff >= 0 ? '+' : ''}${formatCurrency(profitDiff)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Saved Scenarios Ledger Card -->
    <div class="card animate-fade-in" style="margin-top: 10px; grid-column: span 12;">
      <div class="card-header-row">
        <span class="card-title" style="display:flex; align-items:center; gap:8px; font-family:'Outfit';">
          <i data-lucide="bookmark" style="color:var(--purple); width:18px; height:18px;"></i> Saved Scenarios Comparison Ledger
        </span>
        <span class="badge" style="background:rgba(168, 85, 247, 0.15); color:#d8b4fe;">${(state.savedScenarios || []).length} Saved Profiles</span>
      </div>
      
      ${(state.savedScenarios || []).length > 0 ? `
        <div class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Scenario Name</th>
                <th>Marketing Mod</th>
                <th>Fulfillment Delay</th>
                <th>Database Churn</th>
                <th>Projected Revenue</th>
                <th>Projected Net Profit</th>
                <th>Retention Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.savedScenarios.map(sc => {
                const profitDiff = sc.profit - baseProfit;
                const profitClass = profitDiff >= 0 ? 'color:var(--success);' : 'color:var(--danger);';
                const trendIcon = profitDiff >= 0 ? 'arrow-up-right' : 'arrow-down-right';
                return `
                  <tr>
                    <td style="font-weight:700; color:var(--purple);">${sc.name}</td>
                    <td>${sc.mkt > 0 ? '+' : ''}${sc.mkt}%</td>
                    <td>${sc.delay > 0 ? '+' : ''}${sc.delay}%</td>
                    <td>${sc.churn > 0 ? '+' : ''}${sc.churn}%</td>
                    <td>${formatCurrency(sc.revenue)}</td>
                    <td>
                      <div style="font-weight:700; color:white;">${formatCurrency(sc.profit)}</div>
                      <span style="font-size:11px; font-weight:600; ${profitClass} display:inline-flex; align-items:center; gap:2px;">
                        <i data-lucide="${trendIcon}" style="width:11px; height:11px;"></i>
                        ${profitDiff >= 0 ? '+' : ''}${formatCurrency(profitDiff)}
                      </span>
                    </td>
                    <td style="font-weight:600; color:${sc.retention > 75 ? 'var(--success)' : 'var(--warning)'};">${sc.retention.toFixed(1)}%</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-secondary restore-scen-btn" style="padding: 4px 8px; font-size:11px;" data-id="${sc.id}">
                          Restore
                        </button>
                        <button class="btn btn-secondary delete-scen-btn" style="padding: 4px 8px; font-size:11px; border-color:var(--danger); color:var(--danger);" data-id="${sc.id}">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div style="padding: 32px; text-align:center; font-size:13px; color:var(--text-dark);">
          <i data-lucide="info" style="width:28px; height:28px; color:var(--text-dark); margin: 0 auto 12px; display:block;"></i>
          No scenarios saved yet. Adjust the strategy sliders above, type a name, and click "Save Scenario" to register comparison profiles.
        </div>
      `}
    </div>
  `;

  // Initialize Icons
  lucide.createIcons();

  // 3. Connect Slider listeners (Double Event model)
  const mktSlider = container.querySelector('#scen-mkt');
  const delaySlider = container.querySelector('#scen-delay');
  const churnSlider = container.querySelector('#scen-churn');

  mktSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    e.target.previousElementSibling.querySelector('.val').textContent = (val > 0 ? '+' : '') + val + '%';
  });
  mktSlider.addEventListener('change', (e) => {
    onStateChange({ scenMktModifier: parseInt(e.target.value) });
  });

  delaySlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    e.target.previousElementSibling.querySelector('.val').textContent = (val > 0 ? '+' : '') + val + '%';
  });
  delaySlider.addEventListener('change', (e) => {
    onStateChange({ scenDelayModifier: parseInt(e.target.value) });
  });

  churnSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    e.target.previousElementSibling.querySelector('.val').textContent = (val > 0 ? '+' : '') + val + '%';
  });
  churnSlider.addEventListener('change', (e) => {
    onStateChange({ scenChurnModifier: parseInt(e.target.value) });
  });

  // 4. Render Chart.js delta bars
  if (state.activeCharts) {
    state.activeCharts.forEach(c => c.destroy());
  }
  state.activeCharts = [];

  const chartCtx = container.querySelector('#scenario-delta-chart').getContext('2d');
  const scenarioChart = new Chart(chartCtx, {
    type: 'bar',
    data: {
      labels: ['Revenue', 'Net Profit'],
      datasets: [
        {
          label: 'Baseline Status',
          data: [baseRevenue, baseProfit],
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Simulated Intervention',
          data: [simRevenue, simProfit],
          backgroundColor: [
            'rgba(99, 102, 241, 0.65)', // Indigo for simulated rev
            'rgba(16, 185, 129, 0.65)'  // Green for simulated profit
          ],
          borderColor: [
            '#6366f1',
            '#10b981'
          ],
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
  state.activeCharts.push(scenarioChart);

  // 5. Connect Save, Restore, and Delete Scenario Event Handlers
  const saveBtn = container.querySelector('#scen-save-btn');
  const nameInput = container.querySelector('#scen-name-input');

  if (saveBtn && nameInput) {
    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      state.savedScenarios = state.savedScenarios || [];

      const newScen = {
        id: Date.now(),
        name: name || `Scenario Run #${state.savedScenarios.length + 1}`,
        mkt: mktPercent,
        delay: delayPercent,
        churn: churnPercent,
        revenue: simRevenue,
        profit: simProfit,
        retention: simAvgRetention
      };

      state.savedScenarios.push(newScen);
      onStateChange({}); // Re-render state to update grid and tables
    });
  }

  const restoreBtns = container.querySelectorAll('.restore-scen-btn');
  restoreBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.closest('.restore-scen-btn').getAttribute('data-id'));
      const sc = state.savedScenarios.find(item => item.id === id);
      if (sc) {
        onStateChange({
          scenMktModifier: sc.mkt,
          scenDelayModifier: sc.delay,
          scenChurnModifier: sc.churn
        });
      }
    });
  });

  const deleteBtns = container.querySelectorAll('.delete-scen-btn');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.closest('.delete-scen-btn').getAttribute('data-id'));
      state.savedScenarios = state.savedScenarios.filter(item => item.id !== id);
      onStateChange({}); // Re-render
    });
  });
}
