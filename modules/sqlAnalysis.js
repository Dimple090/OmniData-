// modules/sqlAnalysis.js - SQL Playground Module

import { formatCurrency, formatPercent, formatNumber } from '../utils.js';

export function render(container, state, onStateChange) {
  // Pre-calculate active lists (similar to other modules)
  const priceMultiplier = (state.priceMarkup / 1.3) * (1 - state.discountRate / 100);
  const supplierScale = state.supplierLeadTimeScale;
  const marketingScale = state.marketingSpendScale;

  const adjustedCustomers = state.customerData.map(c => {
    let riskFactor = 1.0;
    if (supplierScale > 1.0) riskFactor = 1.0 + (supplierScale - 1.0) * 0.4;
    else if (supplierScale < 1.0) riskFactor = 1.0 - (1.0 - supplierScale) * 0.2;
    const churnRisk = Math.min(0.99, c.churnRisk * riskFactor);
    return { ...c, churnRisk };
  });

  const adjustedInventory = state.operationsData.inventory.map(item => {
    const adjustedReorder = Math.max(0, item.reorderPoint + (state.operationsReorderOffset || 0));
    return {
      sku: item.sku,
      name: item.name,
      category: item.category,
      stock: item.stock,
      reorderPoint: adjustedReorder,
      unitCost: item.unitCost,
      retailPrice: item.retailPrice
    };
  });

  const adjustedSales = state.retailData.monthlyTrends.map(t => {
    const revenue = t.revenue * priceMultiplier;
    const profit = revenue - t.cost;
    return {
      month: t.month,
      revenue,
      cost: t.cost,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      salesCount: t.salesCount
    };
  });

  const adjustedCampaigns = state.marketingData.campaigns.map(c => {
    const spend = c.spend * marketingScale;
    const efficiency = marketingScale > 1 ? Math.pow(marketingScale, -0.18) : 1.0;
    const revenue = c.revenue * marketingScale * efficiency;
    return {
      id: c.id,
      name: c.name,
      channel: c.channel,
      spend,
      conversions: Math.round(c.conversions * marketingScale * efficiency),
      revenue
    };
  });

  // Table registry for local queries
  const tables = {
    customers: adjustedCustomers,
    inventory: adjustedInventory,
    sales: adjustedSales,
    campaigns: adjustedCampaigns
  };

  // SQL Runner Engine
  function executeSQL(sql) {
    const cleanSql = sql.trim().replace(/;\s*$/, ''); // Remove ending semicolon
    
    // Regex parsing
    const selectMatch = cleanSql.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i);
    
    if (!selectMatch) {
      return { 
        success: false, 
        error: 'Syntax Error. Please use standard SQL syntax:\nSELECT col1, col2 FROM table [WHERE col = val] [ORDER BY col [ASC|DESC]] [LIMIT n]' 
      };
    }

    const selectFieldsStr = selectMatch[1].trim();
    const tableName = selectMatch[2].trim().toLowerCase();
    const whereClause = selectMatch[3] ? selectMatch[3].trim() : null;
    const orderByField = selectMatch[4] ? selectMatch[4].trim() : null;
    const orderByDir = selectMatch[5] ? selectMatch[5].trim().toUpperCase() : 'ASC';
    const limitVal = selectMatch[6] ? parseInt(selectMatch[6].trim()) : null;

    // Retrieve dataset
    const rawData = tables[tableName];
    if (!rawData) {
      return { 
        success: false, 
        error: `Table not found: "${tableName}". Available tables: [customers, inventory, sales, campaigns]` 
      };
    }

    let results = JSON.parse(JSON.stringify(rawData)); // Deep copy table

    // Evaluate WHERE clause
    if (whereClause) {
      try {
        const operators = ['>=', '<=', '>', '<', '=', '!=', 'LIKE'];
        let matchedOperator = null;
        let leftHand = null;
        let rightHand = null;

        for (const op of operators) {
          const index = whereClause.indexOf(op);
          if (index !== -1) {
            matchedOperator = op;
            leftHand = whereClause.substring(0, index).trim();
            rightHand = whereClause.substring(index + op.length).trim();
            break;
          }
        }

        if (!matchedOperator) {
          return { success: false, error: `Invalid WHERE clause. Supported operators: ${operators.join(', ')}` };
        }

        // Clean value quotes
        const valStr = rightHand.replace(/^['"]|['"]$/g, '');
        const isNumVal = !isNaN(valStr) && valStr !== '';
        const compareVal = isNumVal ? parseFloat(valStr) : valStr;

        results = results.filter(row => {
          let cellVal = row[leftHand];
          if (cellVal === undefined) return false;

          if (matchedOperator === '=') return cellVal == compareVal;
          if (matchedOperator === '!=') return cellVal != compareVal;
          if (matchedOperator === '>') return cellVal > compareVal;
          if (matchedOperator === '<') return cellVal < compareVal;
          if (matchedOperator === '>=') return cellVal >= compareVal;
          if (matchedOperator === '<=') return cellVal <= compareVal;
          if (matchedOperator === 'LIKE') {
            const regexStr = valStr.replace(/%/g, '.*');
            const regex = new RegExp(`^${regexStr}$`, 'i');
            return regex.test(cellVal.toString());
          }
          return false;
        });
      } catch (err) {
        return { success: false, error: `WHERE clause error: ${err.message}` };
      }
    }

    // Evaluate ORDER BY
    if (orderByField) {
      if (results.length > 0 && results[0][orderByField] === undefined) {
        return { success: false, error: `Order by field "${orderByField}" not found in table columns.` };
      }

      results.sort((a, b) => {
        let valA = a[orderByField];
        let valB = b[orderByField];

        if (typeof valA === 'string') {
          return orderByDir === 'DESC' ? valB.localeCompare(valA) : valA.localeCompare(valB);
        } else {
          return orderByDir === 'DESC' ? valB - valA : valA - valB;
        }
      });
    }

    // Evaluate LIMIT
    if (limitVal !== null) {
      results = results.slice(0, limitVal);
    }

    // Evaluate SELECT projection columns
    let columns = [];
    if (selectFieldsStr === '*') {
      if (results.length > 0) {
        columns = Object.keys(results[0]);
      } else {
        // Fallback schema if empty
        columns = Object.keys(rawData[0] || {});
      }
    } else {
      columns = selectFieldsStr.split(',').map(f => f.trim());
      // Validate columns
      for (const col of columns) {
        if (rawData.length > 0 && rawData[0][col] === undefined) {
          return { success: false, error: `Column "${col}" not found in table "${tableName}".` };
        }
      }
    }

    // Map rows to match selected columns
    const rows = results.map(row => {
      return columns.map(col => {
        const val = row[col];
        // Formatting helper inside cell values
        if (val === null || val === undefined) return 'NULL';
        if (col === 'monetary' || col === 'revenue' || col === 'cost' || col === 'profit' || col === 'unitCost' || col === 'retailPrice' || col === 'spend') {
          return formatCurrency(val);
        }
        if (col === 'churnRisk' || col === 'margin') {
          return formatPercent(val.toString().includes('%') ? parseFloat(val) : val * (col === 'churnRisk' ? 100 : 1));
        }
        return val;
      });
    });

    return {
      success: true,
      columns,
      rows,
      rowCount: results.length
    };
  }

  // Pre-configured Query options
  const presets = [
    {
      title: '⚠️ High Risk Customers',
      sql: 'SELECT name, country, monetary, churnRisk, sentiment FROM customers WHERE churnRisk > 0.35 ORDER BY churnRisk DESC LIMIT 5;'
    },
    {
      title: '📦 Safety stock violations',
      sql: 'SELECT sku, name, category, stock, reorderPoint FROM inventory WHERE stock < reorderPoint ORDER BY stock ASC;'
    },
    {
      title: '💸 High ROI Marketing',
      sql: 'SELECT name, channel, spend, revenue FROM campaigns WHERE revenue > 100000 ORDER BY revenue DESC;'
    },
    {
      title: '📉 Sales with low margins',
      sql: 'SELECT month, revenue, cost, profit, margin FROM sales WHERE margin < 25 ORDER BY profit ASC;'
    }
  ];

  // 2. Generate HTML Layout
  container.innerHTML = `
    <!-- Top info panel -->
    <div class="card animate-fade-in" style="margin-bottom: 20px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.03) 100%); border-color: rgba(6, 182, 212, 0.25);">
      <div class="card-header-row" style="margin-bottom: 8px;">
        <span class="card-title" style="display:flex; align-items:center; gap:8px; color:#a5f3fc; font-family:'Outfit';">
          <i data-lucide="database" style="color:var(--info);"></i> SQL Query Analysis Console
        </span>
        <span class="badge badge-info">Interactive Query Engine</span>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: var(--text-muted);">
        Analyze datasets directly via a client-side SQL parser. Query database tables <strong>customers</strong>, <strong>inventory</strong>, <strong>sales</strong>, or <strong>campaigns</strong>. Pre-calculations adjust based on your strategy sliders live!
      </p>
    </div>

    <!-- Playground layout -->
    <div class="dashboard-grid animate-fade-in">
      <!-- Side Presets Column -->
      <div class="card" style="grid-column: span 4; display:flex; flex-direction:column; gap:16px;">
        <span class="card-title"><i data-lucide="bookmark" style="width:16px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Preset SQL Audits</span>
        <p style="font-size:11px; color:var(--text-dark); line-height:1.4;">
          Select a preset query to analyze specific business conditions (like low stockout margins or at-risk customers) immediately.
        </p>
        <div class="sql-preset-container" style="display:flex; flex-direction:column; gap:10px; flex-grow:1;">
          ${presets.map((p, i) => `
            <button class="btn btn-secondary sql-preset-btn" style="text-align:left; justify-content:flex-start; width:100%; font-size:12px; padding: 12px 14px;" data-sql="${p.sql}">
              <div>
                <strong style="color:var(--text-main); display:block; margin-bottom:2px;">${p.title}</strong>
                <code style="font-size:10px; color:var(--text-dark); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.sql}</code>
              </div>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Editor & Output Column -->
      <div class="card" style="grid-column: span 8; display:flex; flex-direction:column; gap:16px;">
        <span class="card-title"><i data-lucide="terminal" style="width:16px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> SQL Query Console</span>
        
        <!-- Editor terminal block -->
        <div style="background:#05070c; border:1px solid var(--border-muted); border-radius:8px; overflow:hidden; font-family:'Courier New', monospace;">
          <div style="background:#0c0f17; border-bottom: 1px solid var(--border-muted); padding: 6px 16px; display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:11px; color:var(--text-dark); font-weight:700;">SQL Editor</span>
            <div style="display:flex; gap:6px;">
              <span style="width:10px; height:10px; border-radius:50%; background:#ef4444; display:block;"></span>
              <span style="width:10px; height:10px; border-radius:50%; background:#f59e0b; display:block;"></span>
              <span style="width:10px; height:10px; border-radius:50%; background:#10b981; display:block;"></span>
            </div>
          </div>
          <div style="padding:14px; position:relative;">
            <textarea id="sql-query-textarea" style="width:100%; height:80px; background:transparent; border:none; color:#38bdf8; outline:none; font-family:inherit; font-size:14px; line-height:1.6; resize:none;" placeholder="SELECT * FROM customers WHERE sentiment < 3.5 ORDER BY recency DESC LIMIT 5;"></textarea>
          </div>
          <div style="border-top:1px solid var(--border-muted); padding:8px 14px; background:rgba(255,255,255,0.01); display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:var(--text-dark);">Press Run Query to fetch database items</span>
            <button class="btn" id="run-sql-btn" style="padding:6px 16px; font-size:12px; background:var(--info); box-shadow:0 4px 12px var(--info-glow);">
              <i data-lucide="play" style="width:11px; height:11px;"></i> Run Query
            </button>
          </div>
        </div>

        <!-- Output Terminal block -->
        <div style="flex-grow:1; display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="card-subtitle" style="font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Query Result Output</span>
            <span id="sql-row-count-badge" class="badge badge-info" style="display:none;">0 Rows returned</span>
          </div>

          <div id="sql-console-output" style="background:#05070c; border:1px solid var(--border-muted); border-radius:8px; padding:16px; min-height:180px; max-height:280px; overflow-y:auto; font-family:'Courier New', monospace; font-size:12px; color:var(--text-muted);">
            <div style="color:var(--text-dark); font-style:italic;">Run a query above or click a preset to explore databases...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize Icons
  lucide.createIcons();

  // 3. Register DOM interactive binds
  const textarea = container.querySelector('#sql-query-textarea');
  const runBtn = container.querySelector('#run-sql-btn');
  const presetButtons = container.querySelectorAll('.sql-preset-btn');
  const consoleOutput = container.querySelector('#sql-console-output');
  const countBadge = container.querySelector('#sql-row-count-badge');

  function renderQueryOutput(sqlQuery) {
    const result = executeSQL(sqlQuery);
    
    if (!result.success) {
      countBadge.style.display = 'none';
      consoleOutput.innerHTML = `<div style="color:var(--danger); white-space:pre-wrap; line-height:1.5;"><i data-lucide="x-circle" style="width:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> <strong>SQL Engine Error:</strong>\n${result.error}</div>`;
      lucide.createIcons();
      return;
    }

    countBadge.style.display = 'inline-flex';
    countBadge.textContent = `${result.rowCount} rows returned`;

    if (result.rowCount === 0) {
      consoleOutput.innerHTML = `<div style="color:var(--warning);"><i data-lucide="alert-circle" style="width:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> <strong>Empty Set:</strong> No matching database rows found.</div>`;
      lucide.createIcons();
      return;
    }

    // Render as database grid layout
    const cols = result.columns;
    const rows = result.rows;

    consoleOutput.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left; color:#e2e8f0;">
          <thead>
            <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);">
              ${cols.map(c => `<th style="padding:8px 12px; color:var(--info); font-weight:700;">${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                ${r.map(cell => `<td style="padding:8px 12px;">${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Bind Preset buttons
  presetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Find button or closest button block
      const button = e.target.closest('.sql-preset-btn');
      const sql = button.getAttribute('data-sql');
      
      textarea.value = sql;
      renderQueryOutput(sql);
    });
  });

  // Bind Submit Button
  runBtn.addEventListener('click', () => {
    const query = textarea.value.trim();
    if (!query) return;
    renderQueryOutput(query);
  });
}
