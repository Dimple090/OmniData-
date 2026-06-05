// data.js - Tableau Sample Superstore Dataset with Seeded Data Quality Anomalies

export const retailData = {
  monthlyTrends: [
    { month: 'Jul', revenue: 147500, cost: 110600, profit: 36900, margin: 25.0, salesCount: 980 },
    { month: 'Aug', revenue: 139200, cost: 105800, profit: 33400, margin: 24.0, salesCount: 920 },
    { month: 'Sep', revenue: 250100, cost: 185000, profit: 65100, margin: 26.0, salesCount: 1670 },
    { month: 'Oct', revenue: 175400, cost: 131500, profit: 43900, margin: 25.0, salesCount: 1170 },
    { month: 'Nov', revenue: 310800, cost: 233100, profit: 77700, margin: 25.0, salesCount: 2070 },
    { month: 'Dec', revenue: 340500, cost: 258800, profit: 81700, margin: 24.0, salesCount: 2270 },
    { month: 'Jan', revenue: 112300, cost: 84200, profit: 28100, margin: 25.0, salesCount: 750 },
    { month: 'Feb', revenue: 119800, cost: 91000, profit: 28800, margin: 24.0, salesCount: 800 },
    { month: 'Mar', revenue: 187600, cost: 140700, profit: 46900, margin: 25.0, salesCount: 1250 },
    { month: 'Apr', revenue: 172900, cost: 131400, profit: 41500, margin: 24.0, salesCount: 1150 },
    { month: 'May', revenue: 205400, cost: 154000, profit: 51400, margin: 25.0, salesCount: 1370 },
    { month: 'Jun', revenue: 228100, cost: 171100, profit: 57000, margin: 25.0, salesCount: 1520 }
  ],
  categoryBreakdown: [
    { category: 'Technology', revenue: 836154, cost: 690740, itemsSold: 5600 },
    { category: 'Office Supplies', revenue: 719047, cost: 596800, itemsSold: 22900 },
    { category: 'Furniture', revenue: 742000, cost: 723600, itemsSold: 8000 }
  ],
  pricingRules: {
    baseMarkup: 1.3,
    currentDiscount: 0
  }
};

export const customerData = [
  { id: 'S001', name: 'Claire Gute', email: 'claire.gute@gmail.com', recency: 8, frequency: 12, monetary: 3250, churnRisk: 0.08, country: 'US', sentiment: 4.8 },
  { id: 'S002', name: 'Brosina Hoffman', email: 'brosina.h@yahoo.com', recency: 22, frequency: 18, monetary: 4800, churnRisk: 0.15, country: 'US', sentiment: 4.4 },
  { id: 'S003', name: 'Andrew Allen', email: 'andrew.a@outlook.com', recency: 110, frequency: 2, monetary: 190, churnRisk: 0.78, country: 'US', sentiment: 3.1 },
  { id: 'S004', name: 'Irene Ryan', email: 'iryan@msn.com', recency: 4, frequency: 28, monetary: 9200, churnRisk: 0.03, country: 'US', sentiment: 4.9 },
  { id: 'S005', name: 'Harold Pawlan', email: 'harold.p@pawlan.corp', recency: 45, frequency: 7, monetary: 1560, churnRisk: 0.38, country: 'US', sentiment: 3.8 },
  { id: 'S006', name: 'Pete Kriz', email: 'pete.k@consumer.org', recency: 14, frequency: 15, monetary: 3880, churnRisk: 0.11, country: 'US', sentiment: 4.5 },
  { id: 'S007', name: 'Alejandro Grove', email: 'alejandro.g@gmail.com', recency: 92, frequency: 4, monetary: 680, churnRisk: 0.64, country: 'US', sentiment: 2.9 },
  { id: 'S008', name: 'Zuschuss Donatelli', email: 'zdonatelli@donatelli.it', recency: 1, frequency: 35, monetary: 12400, churnRisk: 0.01, country: 'US', sentiment: 5.0 },
  { id: 'S009', name: 'Ken Lonsdale', email: 'ken.lonsdale@lonsdale.com', recency: 75, frequency: 3, monetary: 450, churnRisk: 0.52, country: 'US', sentiment: 3.5 },
  { id: 'S010', name: 'Sandra Flanagan', email: 'sandra.f@flanagan.net', recency: 3, frequency: 21, monetary: 6700, churnRisk: 0.05, country: 'US', sentiment: 4.7 },
  
  // Seeded Anomalies:
  // 1. Duplicate Record
  { id: 'S010', name: 'Sandra Flanagan', email: 'sandra.f@flanagan.net', recency: 3, frequency: 21, monetary: 6700, churnRisk: 0.05, country: 'US', sentiment: 4.7 },
  // 2. Missing email address (Completeness Issue)
  { id: 'S011', name: 'Diana Prince', email: null, recency: 12, frequency: 15, monetary: 4800, churnRisk: 0.10, country: 'US', sentiment: 4.6 },
  // 3. Missing sentiment score (Completeness Issue)
  { id: 'S012', name: 'Bruce Wayne', email: 'bwayne@wayne.corp', recency: 2, frequency: 45, monetary: 25000, churnRisk: 0.01, country: 'US', sentiment: null }
];

export const marketingData = {
  campaigns: [
    { id: 'SM01', name: 'Consumer Direct Mailer', channel: 'Direct Mail', spend: 28000, impressions: 500000, clicks: 18000, conversions: 1200, revenue: 115000 },
    { id: 'SM02', name: 'Corporate SEO Outreach', channel: 'SEO Search', spend: 12000, impressions: 2200000, clicks: 95000, conversions: 2400, revenue: 185000 },
    { id: 'SM03', name: 'Home Office Retargeting', channel: 'Paid Display', spend: 18000, impressions: 1400000, clicks: 42000, conversions: 980, revenue: 64000 },
    { id: 'SM04', name: 'Regional Coupon Catalog', channel: 'Print Media', spend: 32000, impressions: 800000, clicks: 25000, conversions: 1850, revenue: 98000 }
  ],
  funnelBase: {
    impressions: 4900000,
    clicks: 180000,
    cartAdds: 36000,
    purchases: 6430
  }
};

export const financeData = {
  fixedMonthlyCosts: 68000,
  interestRates: 4.0,
  taxRate: 21,
  historicalYears: [
    { year: 2023, revenue: 1850000, profit: 410000, rndSpend: 110000 },
    { year: 2024, revenue: 2100000, profit: 480000, rndSpend: 130000 },
    { year: 2025, revenue: 2297201, profit: 546800, rndSpend: 150000 }
  ]
};

export const operationsData = {
  inventory: [
    { sku: 'FUR-BO-100', name: 'Bush Somerset Bookcase', category: 'Furniture', stock: 18, reorderPoint: 20, demandVelocity: 1.4, unitCost: 90.00, retailPrice: 261.96 },
    { sku: 'FUR-CH-100', name: 'Hon Deluxe Fabric Chair', category: 'Furniture', stock: 45, reorderPoint: 35, demandVelocity: 2.8, unitCost: 110.00, retailPrice: 321.90 },
    { sku: 'OFF-LA-100', name: 'Avery Self-Adhesive Labels', category: 'Office Supplies', stock: 820, reorderPoint: 200, demandVelocity: 22.0, unitCost: 1.20, retailPrice: 11.85 },
    { sku: 'OFF-BI-100', name: 'GBC Ibimaster Binder System', category: 'Office Supplies', stock: 12, reorderPoint: 15, demandVelocity: 0.9, unitCost: 120.00, retailPrice: 437.47 },
    { sku: 'TEC-PH-100', name: 'Adtran IP Business Phone', category: 'Technology', stock: 64, reorderPoint: 40, demandVelocity: 4.2, unitCost: 85.00, retailPrice: 229.99 },
    { sku: 'TEC-AC-100', name: 'Logitech Wireless Mouse M310', category: 'Technology', stock: 140, reorderPoint: 50, demandVelocity: 9.5, unitCost: 8.50, retailPrice: 29.99 },
    { sku: 'TEC-CO-100', name: 'Canon imageCLASS Copier', category: 'Technology', stock: 3, reorderPoint: 5, demandVelocity: 0.4, unitCost: 1200.00, retailPrice: 3999.99 } // Outlier Price!
  ],
  deliveryMetrics: [
    { date: 'Mon', onTime: 92.4, avgDelayHours: 3.1, costPerDelivery: 14.50, carrier: 'UPS Ground' },
    { date: 'Tue', onTime: 88.9, avgDelayHours: 4.5, costPerDelivery: 15.20, carrier: 'USPS Priority' },
    { date: 'Wed', onTime: 95.1, avgDelayHours: 1.8, costPerDelivery: 13.90, carrier: 'FedEx Express' },
    { date: 'Thu', onTime: 91.8, avgDelayHours: 3.5, costPerDelivery: 14.80, carrier: 'UPS Ground' },
    { date: 'Fri', onTime: 86.4, avgDelayHours: 5.2, costPerDelivery: 16.10, carrier: 'USPS Priority' },
    { date: 'Sat', onTime: 96.0, avgDelayHours: 1.2, costPerDelivery: 18.50, carrier: 'FedEx Express' },
    { date: 'Sun', onTime: 97.2, avgDelayHours: 0.9, costPerDelivery: 19.00, carrier: 'FedEx Express' }
  ],
  supplierLeadTimes: {
    Furniture: 28,
    'Office Supplies': 10,
    Technology: 15
  }
};

export const regionalData = [
  { region: 'West Region', code: 'WEST', sales: 725457, profit: 108418, customers: 3200, deliveryDelayHours: 2.8 },
  { region: 'East Region', code: 'EAST', sales: 678781, profit: 91522, customers: 2800, deliveryDelayHours: 3.2 },
  { region: 'Central Region', code: 'CENTRAL', sales: 501239, profit: 39706, customers: 2100, deliveryDelayHours: 4.1 },
  { region: 'South Region', code: 'SOUTH', sales: 391721, profit: 46749, customers: 1600, deliveryDelayHours: 3.5 }
];
