# OmniData | Multi-Domain Business Analytics & Strategy Simulator

OmniData is a premium, recruiter-facing **Multi-Domain Business Analytics & Strategy Simulation Platform** built natively with **Vanilla HTML, Custom CSS, and Javascript (ES6 Modules)**. 

Rather than a static dashboard, OmniData functions as an interactive decision sandbox running on the authentic **Tableau Sample Superstore** corporate dataset. It models operational, retail, financial, and customer lifecycle feedback loops in real-time.

---

## 🚀 Key Architectural Features

1. **Native ES6 Module SPA Structure**: The application runs completely client-side. Views are loaded dynamically via modular scripts (`executive.js`, `customer.js`, etc.) without requiring a bundler (Webpack/Vite), keeping the project fast, clean, and dependency-free.
2. **Tableau Sample Superstore Data**: All statistics, transaction trends, regional matrices, and product lists are sourced directly from the industry-standard commercial dataset.
3. **Double-Event Slider Decoupling**: To ensure a fluid dragging experience, slider updates modify value labels instantly on the browser's `input` event, while Chart.js animations and core recalculations only trigger on the `change` event, preventing focus loss and rendering lag.
4. **Operations & Lifecycle Link**: The platform models cross-module cause-and-effect loops. For example:
   * Scaling up *Supplier Lead Times* (logistical stress) automatically increases *Carrier delays*.
   * Increased delays dynamically deteriorate the *On-Time Delivery (OTD)* rate.
   * Poor delivery rates trigger higher customer *Churn Risk* coefficients in the customer database, directly shrinking LTV projections and dropping the *Customer Health Score*.

---

## 🛠️ Module Breakdown

### 1. Executive Suite
* **Enterprise KPIs**: Unified annual GMV, net profit margins, database churn, and marketing ROI.
* **4 Unique Scores**: Dynamic circular progress SVG gauges mapping *Customer Health*, *Product Opportunity*, *Region Performance*, and *Business Growth*.
* **OmniAI Strategic Consultant**: A simulated AI auditor. Click presets (e.g. "Scan Customer Churn") or enter custom prompt strings to receive formatted decision briefs based on current simulator parameters.

### 2. Retail & Sales Core
* **Department Margins**: Cost-vs-revenue breakdowns across Technology, Furniture, and Office Supplies.
* **Combo Trend Visuals**: Interactive Chart.js monthly curves comparing gross revenues and net profit margins.

### 3. Customer Lifecycle Desk
* **LTV Forecasting**: Dynamic projections using SaaS/Retail valuation models (`ARPU / Churn Rate`).
* **RFM Database Heatmap**: Chart.js Polar Area grouping of customers (Champions, Loyal Customers, Developing, At Risk, Hibernating).
* **Searchable Ledger & Win-Back Triggers**: Filters customer ledger rows by name/country, with clickable "Offer Promo" buttons that instantly reduce individual client churn risks by **-25%**.

### 4. Marketing & Campaigns ROI
* **Diminishing Returns Modeling**: Scales campaign budgets with logarithmic efficiency decay to simulate audience saturation.
* **Conversion Funnel**: Custom CSS horizontal funnel visualizer tracking drop-offs across impressions, clicks, cart additions, and purchases.

### 5. Corporate Finance & Forecasts
* **Predictive Trends**: Combines 12 months of historical data with a 6-month Linear Regression trend line, responding to custom seasonality scales.
* **EBITDA & Tax Reserves**: Automated EBITDA margin and corporate tax reserve reporting.

### 6. Supply Chain & Operations
* **Warehouse Tied Capital**: Monitors current inventory valuations.
* **Fulfillment Ledger**: Click "Restock 100" to replenish stock levels, removing critical alert tags, updating tied warehouse capital, and lifting product opportunity indexes.

### 7. Data Quality & Auditing Center
* **Live Cleansing**: Audits primary key uniqueness (Sanders Flanagan duplicate detection) and completes null values (email/sentiment) live.
* **Z-Score Outliers**: Computes standard deviations to flag mathematical anomalies (like pricing skews).

### 8. SQL Query Console
* **Interactive Compiler**: An IDE-styled terminal console to run customized or preset SQL queries (`SELECT`, `FROM`, `WHERE`, `ORDER BY`, `LIMIT`) directly on active dataset lists.

### 9. Portfolio Case Study
* **Showcase Guide**: Maps out all analytical lifecycle stages (Problem Statement, Collection, Cleaning, EDA, SQL, and AI Strategy) in a structured walkthrough.

---

## 📁 File Structure

```
cover letters/
├── index.html            # Main SPA layout shell with Collapsible Sidebar Navigation
├── styles.css            # Custom CSS variables, typography, layouts, and animations
├── app.js                # Core state manager, routing orchestrator, and event broker
├── server.js             # Express backend serving static assets and SMTP mail dispatch
├── .env                  # Private configurations (EMAIL_USER, EMAIL_PASS)
├── .env.example          # Environment template configuration
├── data.js               # Sliced Tableau Sample Superstore transaction dataset
├── utils.js              # Business logic calculations and forecasting engines
├── README.md             # Project documentation (this file)
├── package.json          # Node dependencies, scripts and settings
└── modules/              # Sub-dashboards
    ├── executive.js      # Executive suite metrics, OmniAI, and Voice Synthesis
    ├── retail.js         # Category margin analysis and transaction charts
    ├── customer.js       # Customer lifecycle, LTV, and win-back sheets
    ├── marketing.js      # Ad campaigns ROAS and conversion funnels
    ├── finance.js        # Regression forecasts and monthly breakevens
    ├── operations.js     # Inventory ledgers and restocking triggers
    ├── scenario.js       # Strategic variance simulator and Scenario Ledger
    ├── sqlAnalysis.js    # Interactive SQL terminal runner engine
    └── caseStudy.js      # Structured portfolio lifecycle showcase guide
```

---

## ⚡ How to Run Locally

1. Ensure you have **Node.js** installed on your system.
2. Create your `.env` configuration file from `.env.example` and supply your Gmail email address and App Password credentials:
   ```env
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASS=your-generated-app-password
   ```
3. Navigate to the project directory:
   ```bash
   cd "cover letters"
   ```
4. Install package dependencies:
   ```bash
   npm install
   ```
5. Boot up the Express development server:
   ```bash
   npm run dev
   ```
6. The server will start on port 3000. Open your browser and navigate to **[http://127.0.0.1:3000](http://127.0.0.1:3000)** to explore the platform.
