// utils.js - Business Logic, Math Projections & Scoring Algorithms

// Formatting helpers
export const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
};

export const formatPercent = (val) => {
  return `${val.toFixed(1)}%`;
};

export const formatNumber = (val) => {
  return new Intl.NumberFormat('en-US').format(Math.round(val));
};

/**
 * 1. Customer Health Score (0 - 100)
 * Evaluates how engaged, loyal, and satisfied a customer is based on RFM + Sentiment.
 * Weights: Recency (30%), Frequency (30%), Spend Volume (25%), Customer Sentiment Rating (15%)
 */
export function calculateCustomerHealth(customer) {
  // Recency weight: shorter days since last order = better health (max 120 days considered)
  const rScore = Math.max(0, 100 - (customer.recency / 120) * 100);
  
  // Frequency weight: more orders = better health (cap frequency at 30 for max score)
  const fScore = Math.min(100, (customer.frequency / 30) * 100);
  
  // Monetary weight: higher spend = better health (cap spend at $10,000 for max score)
  const mScore = Math.min(100, (customer.monetary / 10000) * 100);
  
  // Sentiment weight: scale 1-5 to 0-100
  const sScore = ((customer.sentiment - 1) / 4) * 100;
  
  const health = (rScore * 0.3) + (fScore * 0.3) + (mScore * 0.25) + (sScore * 0.15);
  return Math.min(100, Math.max(0, Math.round(health)));
}

/**
 * 2. Product Opportunity Score (0 - 100)
 * Identifies high-potential products where revenue can be maximized.
 * High score indicates strong demand velocity and good profit margins, 
 * especially if stock level is critically low (reorder signal) or pricing can be optimized.
 */
export function calculateProductOpportunity(product, pricingRules) {
  const marginPercent = ((product.retailPrice - product.unitCost) / product.retailPrice) * 100;
  
  // Demand velocity score: higher sales speed = higher opportunity (cap at 45 items/day)
  const velocityScore = Math.min(100, (product.demandVelocity / 45) * 100);
  
  // Margin score: higher markup/margin = higher opportunity (cap margin at 75%)
  const marginScore = Math.min(100, (marginPercent / 75) * 100);
  
  // Stock alert multiplier: if stock is below reorder point, opportunity to capture demand increases
  const stockRatio = product.stock / (product.reorderPoint || 1);
  const stockRiskScore = stockRatio < 1.0 ? 100 : Math.max(0, 100 - (stockRatio - 1) * 30);
  
  const opportunity = (marginScore * 0.35) + (velocityScore * 0.35) + (stockRiskScore * 0.3);
  return Math.min(100, Math.max(0, Math.round(opportunity)));
}

/**
 * 3. Region Performance Index (0 - 100)
 * Evaluates operational and sales efficiency across hubs.
 * Weights: Sales share (40%), Margin percentage (30%), Average delivery delays (30% inverted)
 */
export function calculateRegionPerformance(region, maxSales = 1000000, maxDelay = 5.0) {
  const salesScore = (region.sales / maxSales) * 100;
  const marginPercent = (region.profit / region.sales) * 100;
  const marginScore = Math.min(100, (marginPercent / 50) * 100); // 50% margin = max score
  
  const delayScore = Math.max(0, 100 - (region.deliveryDelayHours / maxDelay) * 100);
  
  const performanceIndex = (salesScore * 0.4) + (marginScore * 0.3) + (delayScore * 0.3);
  return Math.min(100, Math.max(0, Math.round(performanceIndex)));
}

/**
 * 4. Business Growth Score (0 - 100)
 * Compound score evaluating overall corporate velocity.
 * Formula: Combined weighted scores of:
 * - Net Margin (30%)
 * - Customer Churn Retention Rate (30%)
 * - Marketing Campaigns Average ROI (20%)
 * - Operations Delivery Speed / OTD Rate (20%)
 */
export function calculateBusinessGrowthScore(retailTrends, customers, marketingCampaigns, deliveryMetrics) {
  // Net Margin: average margin across last 12 months (cap at 45% margin)
  const avgMargin = retailTrends.reduce((acc, curr) => acc + curr.margin, 0) / retailTrends.length;
  const marginGrowthFactor = Math.min(100, (avgMargin / 45) * 100);
  
  // Churn Retention: 1 - average churn risk
  const avgChurn = customers.reduce((acc, curr) => acc + curr.churnRisk, 0) / customers.length;
  const retentionScore = (1 - avgChurn) * 100;
  
  // Marketing ROI: average ROI across active campaigns (cap at 350% ROI)
  const totalSpend = marketingCampaigns.reduce((acc, curr) => acc + curr.spend, 0);
  const totalRevenue = marketingCampaigns.reduce((acc, curr) => acc + curr.revenue, 0);
  const averageROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
  const roiScore = Math.min(100, (averageROI / 350) * 100);
  
  // Delivery Speed: average on-time delivery rate
  const avgOTD = deliveryMetrics.reduce((acc, curr) => acc + curr.onTime, 0) / deliveryMetrics.length;
  const deliveryScore = avgOTD; // Already 0 - 100
  
  const growthScore = (marginGrowthFactor * 0.3) + (retentionScore * 0.3) + (roiScore * 0.2) + (deliveryScore * 0.2);
  return Math.min(100, Math.max(0, Math.round(growthScore)));
}

/**
 * Simple Linear Regression Forecasting Engine
 * Predicts next 6 months of revenue based on historical trend, modified by growth multiplier.
 */
export function forecastFutureRevenue(monthlyTrends, growthFactor = 1.0, seasonalityFactor = 1.0) {
  const n = monthlyTrends.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  monthlyTrends.forEach((data, index) => {
    const x = index;
    const y = data.revenue;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const lastIndex = n - 1;
  const futureMonths = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Seasonal coefficients to model realistic year-end spikes (Nov, Dec) and early-year dips
  const seasonalMultipliers = {
    'Jul': 0.85, 'Aug': 0.90, 'Sep': 0.95, 'Oct': 1.05, 'Nov': 1.25, 'Dec': 1.45
  };
  
  return futureMonths.map((month, index) => {
    const xFuture = lastIndex + 1 + index;
    const basePrediction = slope * xFuture + intercept;
    
    // Apply user inputs (growthFactor) and built-in seasonal profile
    const seasonCoeff = seasonalMultipliers[month] || 1.0;
    const finalPrediction = basePrediction * growthFactor * ((seasonCoeff - 1) * seasonalityFactor + 1);
    
    return {
      month: `${month} (F)`,
      revenue: Math.round(finalPrediction),
      isForecast: true
    };
  });
}
