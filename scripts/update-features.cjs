const fs = require('fs');
const path = require('path');

const featureListPath = '/Users/isaiahdupree/Documents/Software/autonomous-coding-dashboard/docs/feature_list_softwarehub_products.json';

// Read the JSON file
const data = JSON.parse(fs.readFileSync(featureListPath, 'utf8'));

// Features to update
const featuresToComplete = [
  'WR-WC-016',
  'WR-WC-017',
  'WR-WC-018',
  'WR-WC-019',
  'WR-WC-020',
  'WR-WC-021',
  'WR-WC-022',
  'WR-WC-023',
  'WR-WC-024',
  'WR-WC-025'
];

// Update the features
let updated = 0;
data.features = data.features.map(feature => {
  if (featuresToComplete.includes(feature.id)) {
    updated++;
    return {
      ...feature,
      passes: true,
      status: 'completed',
      completed_at: new Date().toISOString().split('T')[0]
    };
  }
  return feature;
});

// Write back to file
fs.writeFileSync(featureListPath, JSON.stringify(data, null, 2));

console.log(`✅ Updated ${updated} features to completed status`);
console.log(`Features marked complete: ${featuresToComplete.join(', ')}`);
