// app.js - Main Application Orchestrator

import { retailData, customerData, marketingData, financeData, operationsData, regionalData } from './data.js';

// 1. Central Global State
const state = {
  // Simulator Adjustable Constants
  priceMarkup: 1.30,          // multiplier on wholesale cost (aligned with Superstore defaults)
  discountRate: 0,            // storewide percentage discount (aligned with Superstore defaults)
  marketingSpendScale: 1.0,   // multiplier on marketing budgets
  supplierLeadTimeScale: 1.0, // multiplier on shipping lead times
  financeGrowthFactor: 1.0,   // forecast linear regression multiplier
  financeSeasonalScale: 1.0,  // forecast seasonality multiplier
  operationsReorderOffset: 0, // offset in units added to safety stock reorder thresholds

  // Dataset References (Deep-copied to allow interactive modification)
  retailData: JSON.parse(JSON.stringify(retailData)),
  customerData: JSON.parse(JSON.stringify(customerData)),
  marketingData: JSON.parse(JSON.stringify(marketingData)),
  financeData: JSON.parse(JSON.stringify(financeData)),
  operationsData: JSON.parse(JSON.stringify(operationsData)),
  regionalData: JSON.parse(JSON.stringify(regionalData)),

  // Running State variables
  currentModule: 'executive',
  activeCharts: []
};

// 2. Import Module Render Handlers
import { render as renderExecutive } from './modules/executive.js';
import { render as renderRetail } from './modules/retail.js';
import { render as renderCustomer } from './modules/customer.js';
import { render as renderMarketing } from './modules/marketing.js';
import { render as renderFinance } from './modules/finance.js';
import { render as renderOperations } from './modules/operations.js';
import { render as renderScenario } from './modules/scenario.js';
import { render as renderDataQuality } from './modules/dataQuality.js';

// 3. Module Configuration Router
const modules = {
  executive: {
    render: renderExecutive,
    title: 'Executive Suite',
    subtitle: 'Enterprise-wide performance health indicators, unique scores, and strategic decisions.'
  },
  retail: {
    render: renderRetail,
    title: 'Retail & Sales core',
    subtitle: 'Track department margins, sales volume indicators, and pricing elasticity.'
  },
  customer: {
    render: renderCustomer,
    title: 'Customer Lifecycle Desk',
    subtitle: 'Database health evaluation, LTV projections, and targeted marketing wins.'
  },
  marketing: {
    render: renderMarketing,
    title: 'Marketing & Campaigns ROI',
    subtitle: 'Attribute conversion funnels, channel spends, and campaign acquisition efficiency.'
  },
  finance: {
    render: renderFinance,
    title: 'Corporate Finance & Forecasts',
    subtitle: 'Linear regression modeling, monthly breakevens, and profitability reserves.'
  },
  operations: {
    render: renderOperations,
    title: 'Supply Chain & Operations',
    subtitle: 'Monitor shipping delay matrices, on-time deliveries, and warehouse stock velocities.'
  },
  scenario: {
    render: renderScenario,
    title: 'Executive Scenario Simulator',
    subtitle: 'Perform predictive impact studies on revenues, profits, and retention.'
  },
  dataQuality: {
    render: renderDataQuality,
    title: 'Data Quality & Auditing Center',
    subtitle: 'Monitor null values, duplicate records, and statistical spend anomalies.'
  }
};

// 4. Dom Target Selectors
const container = document.getElementById('module-container');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');

// 5. State Mutator & Render Trigger
function updateState(newState) {
  // Check what changed to trigger ticker messages
  let tickerMsg = '';
  let tickerType = 'info';

  if (newState.priceMarkup !== undefined && newState.priceMarkup !== state.priceMarkup) {
    tickerMsg = `📈 Pricing Strategy: Price markup adjusted to <strong>${newState.priceMarkup.toFixed(2)}x</strong>. Profit margins and demand elasticity have shifted.`;
  } else if (newState.discountRate !== undefined && newState.discountRate !== state.discountRate) {
    tickerMsg = `🏷️ Promo Campaign: Storewide seasonal discount set to <strong>${newState.discountRate}%</strong>. Average order values compressed.`;
  } else if (newState.marketingSpendScale !== undefined && newState.marketingSpendScale !== state.marketingSpendScale) {
    tickerMsg = `📣 Marketing Audit: Channel acquisition spend scaled to <strong>${Math.round(newState.marketingSpendScale * 100)}%</strong>. Diminishing returns coefficients updated.`;
  } else if (newState.supplierLeadTimeScale !== undefined && newState.supplierLeadTimeScale !== state.supplierLeadTimeScale) {
    tickerMsg = newState.supplierLeadTimeScale > 1.0 
      ? `🚨 Operations Warning: Vendor delivery times scaled to <strong>${Math.round(newState.supplierLeadTimeScale * 100)}%</strong>. Shipping latencies are triggering customer churn risks.`
      : `✅ Logistics Optimization: Supplier lead times reduced to <strong>${Math.round(newState.supplierLeadTimeScale * 100)}%</strong>. Average customer health score is recovering.`;
    tickerType = newState.supplierLeadTimeScale > 1.0 ? 'warning' : 'success';
  } else if (newState.operationsReorderOffset !== undefined && newState.operationsReorderOffset !== state.operationsReorderOffset) {
    tickerMsg = `📦 Inventory Buffer: Reorder threshold offset set to <strong>${newState.operationsReorderOffset > 0 ? '+' : ''}${newState.operationsReorderOffset} units</strong>. Tied capital modified.`;
  } else if (newState.financeGrowthFactor !== undefined && newState.financeGrowthFactor !== state.financeGrowthFactor) {
    tickerMsg = `📊 Forecasting Model: Optimistic growth factor adjusted to <strong>${Math.round(newState.financeGrowthFactor * 100)}%</strong> for linear regression forecasts.`;
  } else if (newState.financeSeasonalScale !== undefined && newState.financeSeasonalScale !== state.financeSeasonalScale) {
    tickerMsg = `🍂 Seasonality Audit: Q4 seasonality scale modified to <strong>${Math.round(newState.financeSeasonalScale * 100)}%</strong>. Projected peak demand adjusted.`;
  }

  if (tickerMsg) {
    const tickerText = document.getElementById('strategy-ticker-text');
    const tickerTitle = document.querySelector('.ticker-title');
    if (tickerText && tickerTitle) {
      tickerText.innerHTML = tickerMsg;
      if (tickerType === 'warning') {
        tickerTitle.style.color = 'var(--danger)';
        tickerTitle.style.background = 'var(--danger-glow)';
        tickerTitle.querySelector('span').textContent = 'WARNING';
      } else if (tickerType === 'success') {
        tickerTitle.style.color = 'var(--success)';
        tickerTitle.style.background = 'var(--success-glow)';
        tickerTitle.querySelector('span').textContent = 'SUCCESS';
      } else {
        tickerTitle.style.color = 'var(--warning)';
        tickerTitle.style.background = 'var(--warning-glow)';
        tickerTitle.querySelector('span').textContent = 'STRATEGY';
      }
    }
  }

  Object.assign(state, newState);
  renderActiveModule();
}

function renderActiveModule() {
  const currentKey = state.currentModule;
  const config = modules[currentKey];

  if (!config) {
    console.error(`Module configuration not found for: ${currentKey}`);
    return;
  }

  // Update Headers
  pageTitle.textContent = config.title;
  pageSubtitle.textContent = config.subtitle;

  // Run render pipeline
  config.render(container, state, updateState);
}

// 6. Navigation Event Listeners
menuItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetModule = item.getAttribute('data-module');
    if (targetModule === state.currentModule) return;

    // Toggle Active Class
    menuItems.forEach(li => li.classList.remove('active'));
    item.classList.add('active');

    // Switch view
    state.currentModule = targetModule;

    // Cancel Speech Synthesis on module switch to prevent background voice overlap
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Destroy existing charts to prevent memory leaks and canvas errors
    if (state.activeCharts && state.activeCharts.length > 0) {
      state.activeCharts.forEach(c => {
        try {
          c.destroy();
        } catch (err) {
          console.warn('Error destroying chart instance:', err);
        }
      });
      state.activeCharts = [];
    }

    // Clear elements and draw new module
    container.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted);"><i data-lucide="loader" class="spinner-icon"></i> Loading workspace assets...</div>`;
    lucide.createIcons();
    
    setTimeout(() => {
      renderActiveModule();
    }, 100);
  });
});

// Collapsible Sidebar Handler
toggleSidebarBtn.addEventListener('click', () => {
  const isCollapsed = sidebar.classList.toggle('collapsed');
  
  // Update button visual
  const btnSpan = toggleSidebarBtn.querySelector('span');
  const btnIcon = toggleSidebarBtn.querySelector('i');
  
  if (isCollapsed) {
    btnSpan.style.display = 'none';
    toggleSidebarBtn.style.padding = '10px';
    toggleSidebarBtn.title = "Expand Menu";
  } else {
    btnSpan.style.display = 'inline';
    toggleSidebarBtn.style.padding = '10px 20px';
    toggleSidebarBtn.removeAttribute('title');
  }
});

// 7. Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  renderActiveModule();

  // 8. Contact Developer Modal Handler
  const contactDevLink = document.querySelector('.sidebar-footer a[href^="mailto:"]');
  const contactModal = document.getElementById('contact-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const contactForm = document.getElementById('contact-form');

  if (contactDevLink && contactModal && closeModalBtn && contactForm) {
    contactDevLink.addEventListener('click', (e) => {
      e.preventDefault(); // Stop raw mailto trigger
      contactModal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', () => {
      contactModal.classList.remove('active');
    });

    // Close on overlay background click
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        contactModal.classList.remove('active');
      }
    });

    // Form Submission fetch API dispatch
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const senderEmail = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      const statusDiv = document.getElementById('contact-status');

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      // Setup loading status
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="spinner-icon" data-lucide="loader" style="width:14px; height:14px; animation:spin 1s linear infinite; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Sending...`;
      
      if (statusDiv) {
        statusDiv.style.display = 'flex';
        statusDiv.style.background = 'rgba(255, 255, 255, 0.03)';
        statusDiv.style.border = '1px solid var(--border-muted)';
        statusDiv.style.color = 'var(--text-muted)';
        statusDiv.innerHTML = `<i class="spinner-icon" data-lucide="loader" style="width:13px; height:13px; animation:spin 1s linear infinite; display:inline-block; vertical-align:middle;"></i> Connecting to SMTP server...`;
      }
      lucide.createIcons();

      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderEmail, subject, message })
        });

        const data = await response.json();

        const tickerText = document.getElementById('strategy-ticker-text');
        const tickerTitle = document.querySelector('.ticker-title');

        if (response.ok && data.success) {
          if (statusDiv) {
            statusDiv.style.background = 'rgba(16, 185, 129, 0.15)';
            statusDiv.style.border = '1px solid var(--success)';
            statusDiv.style.color = '#34d399';
            statusDiv.innerHTML = `<i data-lucide="check" style="width:13px; height:13px; display:inline-block; vertical-align:middle;"></i> Message sent successfully!`;
          }
          if (tickerText && tickerTitle) {
            tickerText.innerHTML = `✅ Contact System: Email successfully sent to developer!`;
            tickerTitle.style.color = 'var(--success)';
            tickerTitle.style.background = 'var(--success-glow)';
            tickerTitle.querySelector('span').textContent = 'DELIVERED';
          }
          
          contactForm.reset();
          
          // Keep modal open for 2 seconds to let them see success
          setTimeout(() => {
            contactModal.classList.remove('active');
            if (statusDiv) statusDiv.style.display = 'none';
          }, 2000);
        } else {
          if (statusDiv) {
            statusDiv.style.background = 'rgba(245, 158, 11, 0.15)';
            statusDiv.style.border = '1px solid var(--warning)';
            statusDiv.style.color = '#fbbf24';
            statusDiv.innerHTML = `<i data-lucide="alert-circle" style="width:13px; height:13px; display:inline-block; vertical-align:middle;"></i> ${data.error || 'SMTP Offline'}`;
          }
          if (tickerText && tickerTitle) {
            tickerText.innerHTML = `⚠️ Mailer Alert: Email captured but SMTP is offline. (Error: ${data.error || 'Check .env config'})`;
            tickerTitle.style.color = 'var(--warning)';
            tickerTitle.style.background = 'var(--warning-glow)';
            tickerTitle.querySelector('span').textContent = 'OFFLINE';
          }
        }
      } catch (err) {
        console.warn('SMTP Request failed:', err);
        if (statusDiv) {
          statusDiv.style.background = 'rgba(239, 68, 68, 0.15)';
          statusDiv.style.border = '1px solid var(--danger)';
          statusDiv.style.color = '#f87171';
          statusDiv.innerHTML = `<i data-lucide="x-circle" style="width:13px; height:13px; display:inline-block; vertical-align:middle;"></i> Network error. Failed to reach backend.`;
        }
        
        const tickerText = document.getElementById('strategy-ticker-text');
        const tickerTitle = document.querySelector('.ticker-title');
        if (tickerText && tickerTitle) {
          tickerText.innerHTML = `🚨 Network Error: Backend server failed to process email dispatch request.`;
          tickerTitle.style.color = 'var(--danger)';
          tickerTitle.style.background = 'var(--danger-glow)';
          tickerTitle.querySelector('span').textContent = 'ERROR';
        }
      } finally {
        lucide.createIcons();
        const successOccurred = statusDiv && statusDiv.innerHTML.includes('sent successfully');
        if (!successOccurred) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          lucide.createIcons();
        }
      }
    });
  }
});
