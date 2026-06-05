// modules/executive.js - Executive Suite Module

import { 
  formatCurrency, formatPercent, formatNumber,
  calculateCustomerHealth, calculateProductOpportunity, 
  calculateRegionPerformance, calculateBusinessGrowthScore 
} from '../utils.js';

export function render(container, state, onStateChange) {
  // 1. Gather & Recalculate Metrics based on current state parameters
  const markup = state.priceMarkup;
  const discount = state.discountRate;
  const marketingScale = state.marketingSpendScale;
  const supplierScale = state.supplierLeadTimeScale;

  // Adjust Retail revenues based on price markup & discount
  // Standard pricing formula impact:
  // Baseline margin was approx 38%.
  // If price markup goes from 1.3 baseline to X, revenue scales by X/1.3, minus discount impact
  const priceMultiplier = (markup / 1.3) * (1 - discount / 100);
  
  let totalRevenue = 0;
  let totalCost = 0;
  const adjustedTrends = state.retailData.monthlyTrends.map(t => {
    const rev = t.revenue * priceMultiplier;
    const cost = t.cost;
    const profit = rev - cost;
    totalRevenue += rev;
    totalCost += cost;
    return {
      ...t,
      revenue: rev,
      profit: profit,
      margin: rev > 0 ? (profit / rev) * 100 : 0
    };
  });

  const totalProfit = totalRevenue - totalCost;
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Adjust customer churn risks based on operational metrics (supplier scale increases delivery delay, increasing churn)
  const adjustedCustomers = state.customerData.map(c => {
    // Lead time multiplier scales churn risk for active clients
    let riskFactor = 1.0;
    if (supplierScale > 1.0) {
      riskFactor = 1.0 + (supplierScale - 1.0) * 0.4;
    } else if (supplierScale < 1.0) {
      riskFactor = 1.0 - (1.0 - supplierScale) * 0.2;
    }
    const churnRisk = Math.min(0.99, c.churnRisk * riskFactor);
    return { ...c, churnRisk };
  });

  const avgChurnRate = adjustedCustomers.reduce((acc, c) => acc + c.churnRisk, 0) / adjustedCustomers.length;

  // Adjust Marketing Campaign ROI based on Marketing Spend slider
  let totalMarketingSpend = 0;
  let totalMarketingRevenue = 0;
  const adjustedCampaigns = state.marketingData.campaigns.map(c => {
    const spend = c.spend * marketingScale;
    // Diminishing returns model for marketing spend scale
    const efficiency = marketingScale > 1 ? Math.pow(marketingScale, -0.18) : 1.0;
    const revenue = c.revenue * marketingScale * efficiency;
    totalMarketingSpend += spend;
    totalMarketingRevenue += revenue;
    return { ...c, spend, revenue };
  });

  const marketingROI = totalMarketingSpend > 0 
    ? ((totalMarketingRevenue - totalMarketingSpend) / totalMarketingSpend) * 100 
    : 0;

  // Re-calculate the 4 Unique Scores
  const customerHealth = Math.round(
    adjustedCustomers.reduce((acc, c) => acc + calculateCustomerHealth(c), 0) / adjustedCustomers.length
  );
  
  const productOpportunity = Math.round(
    state.operationsData.inventory.reduce((acc, p) => acc + calculateProductOpportunity(p, { baseMarkup: markup, currentDiscount: discount }), 0) / state.operationsData.inventory.length
  );

  // Regional indicators adjusted by delivery delays
  const maxDelay = 5.0 * supplierScale;
  const adjustedRegions = state.regionalData.map(r => {
    const sales = r.sales * priceMultiplier;
    const profit = sales - (r.sales - r.profit); // cost remains constant
    const delay = r.deliveryDelayHours * supplierScale;
    return { ...r, sales, profit, deliveryDelayHours: delay };
  });
  
  const maxSalesVal = Math.max(...adjustedRegions.map(r => r.sales));
  const regionPerformance = Math.round(
    adjustedRegions.reduce((acc, r) => acc + calculateRegionPerformance(r, maxSalesVal, maxDelay), 0) / adjustedRegions.length
  );

  const businessGrowth = calculateBusinessGrowthScore(
    adjustedTrends, 
    adjustedCustomers, 
    adjustedCampaigns, 
    state.operationsData.deliveryMetrics
  );

  // Compute Operations stockouts for storytelling
  const criticalSkuCount = state.operationsData.inventory.filter(item => {
    const threshold = item.reorderPoint + (state.operationsReorderOffset || 0);
    return item.stock < threshold;
  }).length;

  // Generate dynamic storytelling narratives
  let revenueNarrative = `Annual Gross GMV is projected at <strong>${formatCurrency(totalRevenue)}</strong> with net corporate profits of <strong>${formatCurrency(totalProfit)}</strong> (${formatPercent(avgMargin)} net margin). `;
  if (discount > 10) {
    revenueNarrative += `However, aggressive storewide seasonal discounts (<strong>${discount}%</strong>) are causing profit margins to compress slightly. `;
  } else if (markup > 1.5) {
    revenueNarrative += `Premium price markups (<strong>${markup.toFixed(2)}x</strong>) are maintaining robust profit margin structures. `;
  } else {
    revenueNarrative += `Revenues and margins are currently running in line with typical baseline channels. `;
  }

  let customerNarrative = `The aggregate Customer Health Score is indexed at <strong>${customerHealth}/100</strong>, with database churn probability holding at <strong>${formatPercent(avgChurnRate * 100)}</strong>. `;
  if (supplierScale > 1.2) {
    customerNarrative += `🚨 <strong>Logistics Alert:</strong> Delayed supplier speeds (Scale at <strong>${Math.round(supplierScale*100)}%</strong>) have inflated shipping delivery times, directly driving customer churn risks higher. `;
  } else {
    customerNarrative += `Supply chain lead times are running efficiently, supporting healthy client retention. `;
  }

  const strategicDirectives = [];
  if (avgChurnRate > 0.30) {
    strategicDirectives.push(`<strong>Win-back promotions</strong>: Churn risk has breached the 30% warning limit. Navigate to the <em>Customer Lifecycle Desk</em> and dispatch vouchers.`);
  }
  if (criticalSkuCount > 2) {
    strategicDirectives.push(`<strong>Stock replenishment</strong>: <strong>${criticalSkuCount} key SKUs</strong> have fallen below safety thresholds. Restock items in the <em>Ops & Supply Chain</em> ledger.`);
  }
  if (discount > 15) {
    strategicDirectives.push(`<strong>Pricing optimization</strong>: Reduce storewide promotional discounts below 10% to prevent profit margin leakages.`);
  }
  if (strategicDirectives.length === 0) {
    strategicDirectives.push(`<strong>Operations nominal</strong>: Enterprise vectors are stable. Maintain marketing modifiers at &gt; 1.1x to capture regional shares.`);
  }

  // 2. Build Dashboard Structure
  container.innerHTML = `
    <!-- Top Row: Interactive Simulators -->
    <div class="simulator-panel animate-fade-in">
      <div class="simulator-title">
        <i data-lucide="sliders"></i> Executive Strategy Simulator (Adjust inputs to simulate changes live)
      </div>
      <div class="simulator-controls">
        <div class="slider-group">
          <div class="slider-label-row">
            <span>Price Markup Ratio</span>
            <span class="val" id="val-markup">${markup.toFixed(2)}x</span>
          </div>
          <input type="range" class="slider-input" id="slide-markup" min="1.1" max="2.0" step="0.05" value="${markup}">
        </div>
        
        <div class="slider-group">
          <div class="slider-label-row">
            <span>Storewide Discount</span>
            <span class="val" id="val-discount">${discount}%</span>
          </div>
          <input type="range" class="slider-input" id="slide-discount" min="0" max="30" step="1" value="${discount}">
        </div>

        <div class="slider-group">
          <div class="slider-label-row">
            <span>Marketing Budget Modifier</span>
            <span class="val" id="val-marketing">${Math.round(marketingScale * 100)}%</span>
          </div>
          <input type="range" class="slider-input" id="slide-marketing" min="0.5" max="2.0" step="0.1" value="${marketingScale}">
        </div>

        <div class="slider-group">
          <div class="slider-label-row">
            <span>Supplier Lead Time Scale</span>
            <span class="val" id="val-supplier">${Math.round(supplierScale * 100)}%</span>
          </div>
          <input type="range" class="slider-input" id="slide-supplier" min="0.5" max="2.0" step="0.1" value="${supplierScale}">
        </div>
      </div>
    </div>

    <!-- Executive Storytelling Panel -->
    <div class="card animate-fade-in" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.03) 100%); border-color: rgba(99, 102, 241, 0.25);">
      <div class="card-header-row" style="margin-bottom: 12px;">
        <span class="card-title" style="display:flex; align-items:center; gap:8px; font-family:'Outfit', sans-serif; font-size:15px; color:#a5b4fc;">
          <i data-lucide="book-open" style="color:var(--primary); width:18px; height:18px;"></i> Executive Strategy Briefing
        </span>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn btn-secondary" id="speak-brief-btn" style="padding: 4px 10px; font-size:11px; margin-top:0; display:inline-flex; align-items:center; gap:4px;" title="Listen to Briefing">
            <i data-lucide="volume-2" id="speak-brief-icon" style="width:13px; height:13px;"></i> Speak
          </button>
          <span class="badge badge-success">Automated Insight Engine</span>
        </div>
      </div>
      <div style="font-size:13px; line-height:1.6; display:flex; flex-direction:column; gap:8px;">
        <p>📊 <strong>Performance Insight:</strong> ${revenueNarrative}</p>
        <p>👥 <strong>Retention Analysis:</strong> ${customerNarrative}</p>
        <div style="margin-top:4px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.06);">
          <strong style="color:var(--warning); display:block; margin-bottom:6px;"><i data-lucide="target" style="width:13px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Strategic Directive:</strong>
          <ul style="margin-left: 18px; padding-left: 0; display:flex; flex-direction:column; gap:4px;">
            ${strategicDirectives.map(d => `<li>${d}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <!-- Second Row: Company-wide KPIs -->
    <div class="dashboard-grid animate-fade-in">
      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Annual Gross GMV</span>
          <i data-lucide="dollar-sign" style="color: var(--primary);"></i>
        </div>
        <div class="kpi-value">${formatCurrency(totalRevenue)}</div>
        <span class="kpi-trend trend-up">
          <i data-lucide="arrow-up-right" style="width:14px; height:14px;"></i> 
          +14.2% vs Last Year
        </span>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Net Profit Margin</span>
          <i data-lucide="percent" style="color: var(--success);"></i>
        </div>
        <div class="kpi-value">${formatPercent(avgMargin)}</div>
        <span class="kpi-trend ${avgMargin > 35 ? 'trend-up' : 'trend-down'}">
          <i data-lucide="${avgMargin > 35 ? 'arrow-up-right' : 'arrow-down-right'}" style="width:14px; height:14px;"></i> 
          Net Margin: ${formatCurrency(totalProfit)}
        </span>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Avg Churn Rate</span>
          <i data-lucide="user-minus" style="color: var(--danger);"></i>
        </div>
        <div class="kpi-value">${formatPercent(avgChurnRate * 100)}</div>
        <span class="kpi-trend ${avgChurnRate < 0.35 ? 'trend-up' : 'trend-down'}">
          <i data-lucide="${avgChurnRate < 0.35 ? 'arrow-up-right' : 'arrow-down-right'}" style="width:14px; height:14px;"></i> 
          Goal: &lt; 20% Churn
        </span>
      </div>

      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <span class="card-title">Marketing ROI</span>
          <i data-lucide="briefcase" style="color: var(--info);"></i>
        </div>
        <div class="kpi-value">${formatPercent(marketingROI)}</div>
        <span class="kpi-trend trend-up">
          <i data-lucide="arrow-up-right" style="width:14px; height:14px;"></i> 
          Total Spend: ${formatCurrency(totalMarketingSpend)}
        </span>
      </div>
    </div>

    <!-- Third Row: The 4 Unique Scores -->
    <div class="dashboard-grid animate-fade-in" style="margin-top: 10px;">
      <!-- Customer Health Score -->
      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <div>
            <span class="card-title">Customer Health Score</span>
            <div class="card-subtitle">Aggregated RFM & Satisfaction</div>
          </div>
        </div>
        <div class="score-widget-container">
          <div class="score-circle-wrapper">
            <svg class="score-circle-svg">
              <circle class="score-circle-bg" cx="45" cy="45" r="38"></circle>
              <circle class="score-circle-value" id="health-circle" cx="45" cy="45" r="38" style="stroke: var(--success); --target-offset: ${238.7 - (238.7 * customerHealth) / 100};"></circle>
            </svg>
            <div class="score-text">${customerHealth}</div>
          </div>
          <div>
            <p style="font-size: 11px; line-height: 1.4; color: var(--text-muted);">
              Reflects general database retention. ${customerHealth > 75 ? 'Healthy client relations.' : 'Requires retention outreach.'}
            </p>
          </div>
        </div>
      </div>

      <!-- Product Opportunity Score -->
      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <div>
            <span class="card-title">Product Opp. Score</span>
            <div class="card-subtitle">Inventory & Margin Potential</div>
          </div>
        </div>
        <div class="score-widget-container">
          <div class="score-circle-wrapper">
            <svg class="score-circle-svg">
              <circle class="score-circle-bg" cx="45" cy="45" r="38"></circle>
              <circle class="score-circle-value" id="opp-circle" cx="45" cy="45" r="38" style="stroke: var(--primary); --target-offset: ${238.7 - (238.7 * productOpportunity) / 100};"></circle>
            </svg>
            <div class="score-text">${productOpportunity}</div>
          </div>
          <div>
            <p style="font-size: 11px; line-height: 1.4; color: var(--text-muted);">
              Measures revenue potential in stocking high-margin items.
            </p>
          </div>
        </div>
      </div>

      <!-- Region Performance Index -->
      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <div>
            <span class="card-title">Region Perf. Index</span>
            <div class="card-subtitle">Logistics & Sales Hub Matrix</div>
          </div>
        </div>
        <div class="score-widget-container">
          <div class="score-circle-wrapper">
            <svg class="score-circle-svg">
              <circle class="score-circle-bg" cx="45" cy="45" r="38"></circle>
              <circle class="score-circle-value" id="region-circle" cx="45" cy="45" r="38" style="stroke: var(--info); --target-offset: ${238.7 - (238.7 * regionPerformance) / 100};"></circle>
            </svg>
            <div class="score-text">${regionPerformance}</div>
          </div>
          <div>
            <p style="font-size: 11px; line-height: 1.4; color: var(--text-muted);">
              Consolidates delivery times and sales distribution scores.
            </p>
          </div>
        </div>
      </div>

      <!-- Business Growth Score -->
      <div class="card" style="grid-column: span 3;">
        <div class="card-header-row">
          <div>
            <span class="card-title">Business Growth Score</span>
            <div class="card-subtitle">Compound Enterprise Velocity</div>
          </div>
        </div>
        <div class="score-widget-container">
          <div class="score-circle-wrapper">
            <svg class="score-circle-svg">
              <circle class="score-circle-bg" cx="45" cy="45" r="38"></circle>
              <circle class="score-circle-value" id="growth-circle" cx="45" cy="45" r="38" style="stroke: var(--purple); --target-offset: ${238.7 - (238.7 * businessGrowth) / 100};"></circle>
            </svg>
            <div class="score-text">${businessGrowth}</div>
          </div>
          <div>
            <p style="font-size: 11px; line-height: 1.4; color: var(--text-muted);">
              Unified health factor of margins, marketing ROI, and fulfillment rates.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Fourth Row: Regional Performance Table & AI recommendations -->
    <div class="dashboard-grid animate-fade-in" style="margin-top: 10px;">
      <!-- Regional Performance Metrics -->
      <div class="card" style="grid-column: span 6;">
        <div class="card-header-row">
          <span class="card-title">Regional Operating Nodes</span>
          <span class="badge badge-info">${adjustedRegions.length} Active Hubs</span>
        </div>
        <div class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Revenues</th>
                <th>Operating Profit</th>
                <th>Delivery Latency</th>
                <th>Perf Index</th>
              </tr>
            </thead>
            <tbody>
              ${adjustedRegions.map(r => {
                const perfIndex = calculateRegionPerformance(r, maxSalesVal, maxDelay);
                return `
                  <tr>
                    <td style="font-weight:600;">${r.region}</td>
                    <td>${formatCurrency(r.sales)}</td>
                    <td style="color:var(--success); font-weight:600;">${formatCurrency(r.profit)}</td>
                    <td>${r.deliveryDelayHours.toFixed(1)} hrs</td>
                    <td>
                      <span class="badge ${perfIndex > 75 ? 'badge-success' : perfIndex > 50 ? 'badge-warning' : 'badge-danger'}">${perfIndex}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- AI recommendations Card -->
      <div class="card ai-recommendation-card" style="grid-column: span 6;">
        <div class="card-header-row">
          <span class="card-title ai-header-sparkle">
            <i data-lucide="sparkles"></i> OmniAI Strategic Consultant
          </span>
          <span class="badge" style="background: rgba(168, 85, 247, 0.15); color: #d8b4fe;">Powered by Decision Engine</span>
        </div>
        
        <p style="font-size:12px; color:var(--text-muted); line-height:1.5;">
          Click a decision profile below or type a query. OmniAI will inspect live system parameters to generate strategic directives.
        </p>

        <div class="ai-presets">
          <span class="ai-preset-tag" data-action="churn">Scan Customer Churn</span>
          <span class="ai-preset-tag" data-action="opp">Check Product Opportunities</span>
          <span class="ai-preset-tag" data-action="forecast">Financial Projections Summary</span>
          <span class="ai-preset-tag" data-action="ops">Supply Chain Bottlenecks</span>
        </div>

        <div class="ai-prompt-box">
          <input type="text" class="ai-input" id="ai-custom-prompt" placeholder="Ask OmniAI about regional performance, margin optimization...">
          <button class="btn" id="ai-submit-btn" style="background:var(--purple); box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);">Analyze</button>
        </div>

        <div class="ai-response-box" id="ai-response">
          <em>Consultant is idle. Choose an analysis category above to initiate data audits...</em>
        </div>
      </div>
    </div>
  `;

  // Initialize Lucide Icons
  lucide.createIcons();

  // 3. Register Event Listeners for Sliders & Input
  const markupSlider = container.querySelector('#slide-markup');
  const discountSlider = container.querySelector('#slide-discount');
  const marketingSlider = container.querySelector('#slide-marketing');
  const supplierSlider = container.querySelector('#slide-supplier');

  markupSlider.addEventListener('input', (e) => {
    container.querySelector('#val-markup').textContent = parseFloat(e.target.value).toFixed(2) + 'x';
  });
  markupSlider.addEventListener('change', (e) => {
    onStateChange({ priceMarkup: parseFloat(e.target.value) });
  });

  discountSlider.addEventListener('input', (e) => {
    container.querySelector('#val-discount').textContent = e.target.value + '%';
  });
  discountSlider.addEventListener('change', (e) => {
    onStateChange({ discountRate: parseInt(e.target.value) });
  });

  marketingSlider.addEventListener('input', (e) => {
    container.querySelector('#val-marketing').textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
  });
  marketingSlider.addEventListener('change', (e) => {
    onStateChange({ marketingSpendScale: parseFloat(e.target.value) });
  });

  supplierSlider.addEventListener('input', (e) => {
    container.querySelector('#val-supplier').textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
  });
  supplierSlider.addEventListener('change', (e) => {
    onStateChange({ supplierLeadTimeScale: parseFloat(e.target.value) });
  });

  // AI Recommendation presets and submits
  const responseBox = container.querySelector('#ai-response');
  const presetTags = container.querySelectorAll('.ai-preset-tag');
  const promptInput = container.querySelector('#ai-custom-prompt');
  const submitBtn = container.querySelector('#ai-submit-btn');

  function simulateAiTyping(htmlText) {
    responseBox.innerHTML = '<div style="display:flex; align-items:center; gap:8px; color:var(--purple);"><i class="spinner-icon" data-lucide="loader" style="animation: spin 1s linear infinite;"></i> Analyzing live datasets...</div>';
    lucide.createIcons();
    setTimeout(() => {
      responseBox.innerHTML = htmlText;
    }, 850);
  }

  presetTags.forEach(tag => {
    tag.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      let responseHtml = '';

      if (action === 'churn') {
        const topAtRisk = adjustedCustomers
          .filter(c => c.churnRisk > 0.4)
          .sort((a,b) => b.churnRisk - a.churnRisk)
          .slice(0, 3);
          
        responseHtml = `
          <strong style="color:var(--danger); display:flex; align-items:center; gap:6px;"><i data-lucide="alert-triangle" style="width:16px;"></i> Churn Risk Analysis:</strong>
          <p style="margin-top:6px;">Average Customer Churn is hovering at <strong>${formatPercent(avgChurnRate * 100)}</strong>. Operational delays (Lead Time modifier: <strong>${Math.round(supplierScale*100)}%</strong>) have directly impacted client satisfaction.</p>
          <ul style="margin: 8px 0 0 16px; padding-left:0;">
            ${topAtRisk.map(c => `<li><strong>${c.name}</strong> (${c.country}) - Churn Risk: <span style="color:var(--danger); font-weight:700;">${formatPercent(c.churnRisk*100)}</span> (Sentiment: ${c.sentiment}/5)</li>`).join('')}
          </ul>
          <p style="margin-top:8px; font-size:12px; color:var(--text-muted);"><em>OmniAI Recommendation:</em> Send an automated win-back voucher to accounts with churn &gt; 40%. Reducing the Supplier Lead Time below 100% will lower customer churn risk by up to 12% globally.</p>
        `;
      } else if (action === 'opp') {
        const productsWithOpp = state.operationsData.inventory.map(p => {
          return { ...p, score: calculateProductOpportunity(p, { baseMarkup: markup, currentDiscount: discount }) };
        }).sort((a,b) => b.score - a.score).slice(0, 3);

        responseHtml = `
          <strong style="color:var(--primary); display:flex; align-items:center; gap:6px;"><i data-lucide="target" style="width:16px;"></i> Inventory Opportunity Review:</strong>
          <p style="margin-top:6px;">Average Product Opportunity Score is <strong>${productOpportunity}/100</strong>. Optimization recommended for high-velocity items:</p>
          <ul style="margin: 8px 0 0 16px; padding-left:0;">
            ${productsWithOpp.map(p => `<li><strong>${p.name}</strong> (Stock: ${p.stock} / Alert Point: ${p.reorderPoint}) - Opportunity Score: <span style="color:var(--primary); font-weight:700;">${p.score}</span></li>`).join('')}
          </ul>
          <p style="margin-top:8px; font-size:12px; color:var(--text-muted);"><em>OmniAI Recommendation:</em> Trigger replenishment immediately for items where stock is below their alert threshold. Adjust Pricing Markup to a balanced 1.45x and maintain discounts under 8% to maximize sell-through velocity without eroding margin pools.</p>
        `;
      } else if (action === 'forecast') {
        responseHtml = `
          <strong style="color:var(--success); display:flex; align-items:center; gap:6px;"><i data-lucide="trending-up" style="width:16px;"></i> Financial Forecast Briefing:</strong>
          <p style="margin-top:6px;">Current GMV stands at <strong>${formatCurrency(totalRevenue)}</strong> with net profitability of <strong>${formatCurrency(totalProfit)}</strong> (${formatPercent(avgMargin)} margin).</p>
          <p style="margin-top:4px;">Under standard conditions, next quarter revenue is projected to expand by <strong>+12%</strong>. However, with your current Price Markup (<strong>${markup.toFixed(2)}x</strong>) and Discount rate (<strong>${discount}%</strong>), margins are projected to ${avgMargin > 38 ? 'increase and strengthen' : 'soften slightly'}.</p>
          <p style="margin-top:8px; font-size:12px; color:var(--text-muted);"><em>OmniAI Recommendation:</em> Maintain a marketing spend scaling index of &gt; 1.1x to offset price markup resistances and prevent client base contraction in European hubs.</p>
        `;
      } else if (action === 'ops') {
        const averageOTD = state.operationsData.deliveryMetrics.reduce((acc, curr) => acc + curr.onTime, 0) / state.operationsData.deliveryMetrics.length;
        responseHtml = `
          <strong style="color:var(--info); display:flex; align-items:center; gap:6px;"><i data-lucide="truck" style="width:16px;"></i> Operations & Fulfillment Audit:</strong>
          <p style="margin-top:6px;">On-Time Delivery rate is at <strong>${formatPercent(averageOTD)}</strong>. The average delivery latency is <strong>${(2.0 * supplierScale).toFixed(2)} hours</strong>.</p>
          <p style="margin-top:4px;">Supplier delays in <strong>Apparel & Fashion</strong> (lead time: ${Math.round(21 * supplierScale)} days) constitute the largest supply chain bottleneck, causing inventory-out risks.</p>
          <p style="margin-top:8px; font-size:12px; color:var(--text-muted);"><em>OmniAI Recommendation:</em> Negotiate with regional carriers (especially DHL/USPS) to consolidate routes, and aim to bring Supplier Lead Times down to at least 90% of base thresholds by onboarding backup distributors.</p>
        `;
      }

      simulateAiTyping(responseHtml);
    });
  });

  submitBtn.addEventListener('click', () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    let responseHtml = `
      <strong style="color:var(--purple); display:flex; align-items:center; gap:6px;"><i data-lucide="message-square" style="width:16px;"></i> Auditing Custom Directive:</strong>
      <p style="margin-top:6px;">Audited query: <em>"${prompt}"</em></p>
      <p style="margin-top:6px;">Based on current metrics: Price markup is at <strong>${markup.toFixed(2)}x</strong>, discount is <strong>${discount}%</strong>, marketing scale is <strong>${Math.round(marketingScale*100)}%</strong>, and lead times scale is <strong>${Math.round(supplierScale*100)}%</strong>.</p>
      <p style="margin-top:6px;">OmniAI has indexed this setup and confirms operational efficiency is ${businessGrowth > 70 ? 'Optimal' : 'Suboptimal'}. Regional growth indicates that NA accounts for the highest share of GMV (${formatPercent((adjustedRegions[0].sales/totalRevenue)*100)}), whereas Europe has the highest shipping delay risk.</p>
    `;
    simulateAiTyping(responseHtml);
  });

  promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitBtn.click();
    }
  });

  // Speech Synthesis Controller
  const speakBtn = container.querySelector('#speak-brief-btn');
  const speakIcon = container.querySelector('#speak-brief-icon');

  if (speakBtn && speakIcon) {
    speakBtn.addEventListener('click', () => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speakIcon.setAttribute('data-lucide', 'volume-2');
        speakBtn.title = "Listen to Briefing";
        speakBtn.innerHTML = `<i data-lucide="volume-2" id="speak-brief-icon" style="width:13px; height:13px;"></i> Speak`;
        lucide.createIcons();
        return;
      }

      if (window.speechSynthesis) {
        // Strip out HTML tags for Speech Text
        const cleanRevenueNarrative = revenueNarrative.replace(/<\/?[^>]+(>|$)/g, "");
        const cleanCustomerNarrative = customerNarrative.replace(/<\/?[^>]+(>|$)/g, "");
        const cleanDirectives = strategicDirectives.map(d => d.replace(/<\/?[^>]+(>|$)/g, "")).join(". ");

        const briefingSpeechText = `Performance Insight. ${cleanRevenueNarrative}. Retention Analysis. ${cleanCustomerNarrative}. Strategic Directives: ${cleanDirectives}`;

        window.speechSynthesis.cancel(); // Cancel any current utterances

        const utterance = new SpeechSynthesisUtterance(briefingSpeechText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          speakIcon.setAttribute('data-lucide', 'volume-2');
          speakBtn.innerHTML = `<i data-lucide="volume-2" id="speak-brief-icon" style="width:13px; height:13px;"></i> Speak`;
          lucide.createIcons();
        };

        utterance.onerror = () => {
          speakIcon.setAttribute('data-lucide', 'volume-2');
          speakBtn.innerHTML = `<i data-lucide="volume-2" id="speak-brief-icon" style="width:13px; height:13px;"></i> Speak`;
          lucide.createIcons();
        };

        speakIcon.setAttribute('data-lucide', 'square');
        speakBtn.innerHTML = `<i data-lucide="square" id="speak-brief-icon" style="width:13px; height:13px;"></i> Stop`;
        speakBtn.title = "Stop Listening";
        lucide.createIcons();

        window.speechSynthesis.speak(utterance);
      }
    });
  }
}
