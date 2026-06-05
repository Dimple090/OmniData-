// modules/caseStudy.js - Portfolio Case Study Walkthrough Module

import { formatCurrency, formatPercent } from '../utils.js';

export function render(container, state, onStateChange) {
  // Pre-calculate baseline statistics for display
  const totalSpend = state.marketingData.campaigns.reduce((acc, curr) => acc + curr.spend, 0);
  const totalRevenue = state.retailData.monthlyTrends.reduce((acc, curr) => acc + curr.revenue, 0);

  const sections = [
    {
      id: 'problem',
      title: '🎯 1. Problem Statement',
      badge: 'Business Context',
      icon: 'target',
      html: `
        <p style="margin-bottom:12px;"><strong>What corporate problem are we solving?</strong></p>
        <p style="margin-bottom:10px; line-height:1.6;">
          OmniData solves a multi-layered operational challenge: <strong>how to maximize profit margins and annual GMV without triggering database churn and stockouts.</strong>
        </p>
        <p style="margin-bottom:10px; line-height:1.6;">
          In retail and supply chain analytics, operations cannot be analyzed in silos. In this application, we model the real-world operational feedback loop:
        </p>
        <div style="background:rgba(99, 102, 241, 0.05); border:1px solid rgba(99, 102, 241, 0.15); border-radius:8px; padding:14px; display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;"><span style="color:var(--danger); font-weight:700;">1. Logistics Stress:</span> Scaling supplier lead times (logistical stress) automatically increases shipping delivery latencies.</div>
          <div style="display:flex; align-items:center; gap:8px;"><span style="color:var(--warning); font-weight:700;">2. Retention Decay:</span> High delivery latencies drop the On-Time Delivery (OTD) rate and trigger customer churn risk coefficients.</div>
          <div style="display:flex; align-items:center; gap:8px;"><span style="color:var(--info); font-weight:700;">3. Margin Squeeze:</span> Storewide promotional discounts compress profit margins, while increasing safety inventory buffers ties up capital.</div>
        </div>
        <p style="font-size:12px; color:var(--text-muted);">
          <em>Actionable Objective:</em> Find the optimal equilibrium where price markup, discounts, marketing budgets, and lead times yield the highest composite <strong>Business Growth Score</strong>.
        </p>
      `
    },
    {
      id: 'collection',
      title: '📊 2. Data Collection',
      badge: 'Superstore Slices',
      icon: 'database',
      html: `
        <p style="margin-bottom:12px;"><strong>Where does the simulation data come from?</strong></p>
        <p style="margin-bottom:10px; line-height:1.6;">
          The platform runs on sliced transactions from the industry-standard <strong>Tableau Sample Superstore corporate dataset</strong>.
        </p>
        <table style="width:100%; border-collapse:collapse; font-size:12px; margin-top:8px; margin-bottom:12px; background:rgba(0,0,0,0.2); border-radius:6px; overflow:hidden;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-muted); background:rgba(255,255,255,0.02); text-align:left;">
              <th style="padding:6px 12px; color:var(--info);">Dataset Segment</th>
              <th style="padding:6px 12px; color:var(--info);">Data Points</th>
              <th style="padding:6px 12px; color:var(--info);">Key Metric Tracked</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
              <td style="padding:6px 12px; font-weight:600;">retailData</td>
              <td style="padding:6px 12px;">12 months sales trends</td>
              <td style="padding:6px 12px;">Revenue vs cost profit margins</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
              <td style="padding:6px 12px; font-weight:600;">customerData</td>
              <td style="padding:6px 12px;">Detailed client records</td>
              <td style="padding:6px 12px;">RFM indices (Recency, Frequency, Spend)</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
              <td style="padding:6px 12px; font-weight:600;">operationsData</td>
              <td style="padding:6px 12px;">Live warehouse inventories</td>
              <td style="padding:6px 12px;">SKU safety limits and delivery OTD</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size:12px; color:var(--text-muted);">
          To enable real-time interactive sandboxing, the data is loaded locally as dynamic ES6 imports, allowing deep-copied modifications to propagate instantly across all models.
        </p>
      `
    },
    {
      id: 'cleaning',
      title: '🧹 3. Data Cleaning & Integrity',
      badge: 'Database Auditing',
      icon: 'shield-check',
      html: `
        <p style="margin-bottom:12px;"><strong>How do we handle missing values, duplicates, and anomalies?</strong></p>
        <p style="margin-bottom:10px; line-height:1.6;">
          Real datasets contain noise. The platform includes seeded anomalies audited in our **Data Quality Desk**:
        </p>
        <ul style="margin-left: 18px; margin-bottom: 12px; display:flex; flex-direction:column; gap:6px; line-height:1.5;">
          <li><strong>Duplicate Records:</strong> Deduplicates Sandra Flanagan's identical row collision.</li>
          <li><strong>Completeness Nulls:</strong> Imputes missing emails (Diana Prince) and missing sentiment ratings (Bruce Wayne).</li>
          <li><strong>Statistical Outliers:</strong> Detects anomalies using the <strong>Z-Score formula</strong> (e.g. flagging SKU ` + "`TEC-CO-100`" + ` with a price deviation of ` + "`> 2.0σ`" + ` standard deviations).</li>
        </ul>
        <p style="font-size:12px; color:var(--text-muted);">
          <em>Live Cleaning Script:</em> Clicking "Cleanse Data" in the Data Quality Desk runs a client-side sanitation script, restoring uniqueness, completeness, and validity scores to <strong>100%</strong>.
        </p>
      `
    },
    {
      id: 'eda',
      title: '📈 4. Exploratory Data Analysis (EDA)',
      badge: 'Trends & Visuals',
      icon: 'line-chart',
      html: `
        <p style="margin-bottom:12px;"><strong>What trends and insights have been discovered?</strong></p>
        <p style="margin-bottom:10px; line-height:1.6;">
          By navigating the interactive sub-dashboards, we gather critical operational takeaways:
        </p>
        <ul style="margin-left: 18px; margin-bottom: 12px; display:flex; flex-direction:column; gap:6px; line-height:1.5;">
          <li><strong>Seasonality:</strong> Sales spike massively during Q4 (Nov, Dec), while early Q1 experiences a baseline sales compression.</li>
          <li><strong>Department Margins:</strong> Technology yields the highest margin pool, but requires high cost overhead, whereas Office Supplies drives volume.</li>
          <li><strong>Marketing Diminishing Returns:</strong> Paid display ROI drops logarithmically as audience saturation increases, driving blended CAC higher.</li>
        </ul>
        <p style="font-size:12px; color:var(--text-muted);">
          Interactive combo bar/line charts and polar RFM segmentation maps make these complex multidimensional matrices simple to read.
        </p>
      `
    },
    {
      id: 'sql',
      title: '💻 5. SQL Analysis Console',
      badge: 'Data Querying',
      icon: 'terminal',
      html: `
        <p style="margin-bottom:12px;"><strong>How do we extract key metrics programmatically?</strong></p>
        <p style="margin-bottom:10px; line-height:1.6;">
          While visual charts are helpful, analysts need query consoles. The platform features an integrated **SQL Playground** module.
        </p>
        <p style="margin-bottom:10px; line-height:1.6;">
          You can write queries like:
        </p>
        <div style="background:#05070c; border:1px solid var(--border-muted); border-radius:6px; padding:10px; font-family:'Courier New', monospace; font-size:11px; color:#38bdf8; margin-bottom:12px;">
          SELECT name, country, monetary, churnRisk FROM customers WHERE churnRisk > 0.40 ORDER BY churnRisk DESC LIMIT 3;
        </div>
        <p style="font-size:12px; color:var(--text-muted);">
          The custom parser translates SELECT, FROM, WHERE, ORDER BY, and LIMIT query clauses, running queries instantly on the active simulator state.
        </p>
      `
    },
    {
      id: 'insights',
      title: '💡 6. Insights & Strategy',
      badge: 'AI Consultant Decisions',
      icon: 'sparkles',
      html: `
        <p style="margin-bottom:12px;"><strong>What recommendations should be implemented?</strong></p>
        <p style="margin-bottom:10px; line-height:1.6;">
          Based on the simulation parameters, the **OmniAI Strategic Consultant** identifies optimal operational directives:
        </p>
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
          <div style="border-left:3px solid var(--success); padding-left:12px;">
            <strong style="font-size:12px; color:var(--success);">Fulfillment Restocking</strong>
            <p style="font-size:11px; color:var(--text-muted); margin-top:2px;">Trigger safety inventory replenishment for critical SKUs to prevent high-velocity stockouts.</p>
          </div>
          <div style="border-left:3px solid var(--primary); padding-left:12px;">
            <strong style="font-size:12px; color:var(--primary);">Win-Back Promos</strong>
            <p style="font-size:11px; color:var(--text-muted); margin-top:2px;">Dispatch vouchers to customers with churn risk > 40% to prevent lifetime value contraction.</p>
          </div>
          <div style="border-left:3px solid var(--warning); padding-left:12px;">
            <strong style="font-size:12px; color:var(--warning);">Pricing Balancing</strong>
            <p style="font-size:11px; color:var(--text-muted); margin-top:2px;">Scale pricing markups to 1.45x and maintain discounts under 8% to prevent profit leakage.</p>
          </div>
        </div>
        <p style="font-size:12px; color:var(--text-muted);">
          Using sandboxed forecasting, the business can audit predictions prior to deploying changes in live production database channels.
        </p>
      `
    }
  ];

  // 2. Generate HTML structure
  container.innerHTML = `
    <!-- Top summary cards -->
    <div class="dashboard-grid animate-fade-in" style="margin-bottom:20px;">
      <div class="card" style="grid-column: span 6; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span class="card-subtitle">Project Sourced Scope</span>
          <div class="kpi-value" style="font-size:24px; margin-top:4px;">Tableau Superstore</div>
        </div>
        <i data-lucide="folder" style="color:var(--primary); width:28px; height:28px;"></i>
      </div>
      <div class="card" style="grid-column: span 6; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span class="card-subtitle">Annual Sourced Revenue</span>
          <div class="kpi-value" style="font-size:24px; margin-top:4px;">${formatCurrency(totalRevenue)}</div>
        </div>
        <i data-lucide="dollar-sign" style="color:var(--success); width:28px; height:28px;"></i>
      </div>
    </div>

    <!-- Case Study sections list -->
    <div style="display:flex; flex-direction:column; gap:20px;" class="animate-fade-in">
      ${sections.map(sec => `
        <div class="card" id="case-${sec.id}" style="scroll-margin-top:20px;">
          <div class="card-header-row" style="margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:10px;">
            <span class="card-title" style="display:inline-flex; align-items:center; gap:8px; font-family:'Outfit'; font-size:16px;">
              <i data-lucide="${sec.icon}" style="color:var(--primary); width:18px; height:18px;"></i>
              ${sec.title}
            </span>
            <span class="badge badge-info">${sec.badge}</span>
          </div>
          <div style="font-size:13px; color:var(--text-main);">
            ${sec.html}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Initialize Icons
  lucide.createIcons();
}
