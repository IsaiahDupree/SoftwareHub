#!/usr/bin/env node

/**
 * Update feature status in feature_list_softwarehub_products.json
 * Usage: node update-feature.js <feature-id>
 */

const fs = require('fs');
const path = require('path');

const featureId = process.argv[2];

if (!featureId) {
  console.error('Usage: node update-feature.js <feature-id>');
  process.exit(1);
}

const featureListPath = '/Users/isaiahdupree/Documents/Software/autonomous-coding-dashboard/docs/feature_list_softwarehub_products.json';

// Read the feature list
const data = JSON.parse(fs.readFileSync(featureListPath, 'utf8'));

// Find and update the feature
let found = false;
function updateFeature(obj) {
  if (Array.isArray(obj)) {
    for (let item of obj) {
      updateFeature(item);
    }
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.id === featureId) {
      obj.passes = true;
      obj.status = 'completed';
      found = true;
      console.log(`✓ Updated ${featureId}: passes=true, status=completed`);
    }
    for (let key in obj) {
      updateFeature(obj[key]);
    }
  }
}

updateFeature(data);

if (!found) {
  console.error(`Feature ${featureId} not found`);
  process.exit(1);
}

// Write back to file
fs.writeFileSync(featureListPath, JSON.stringify(data, null, 2));
console.log(`✓ Feature list updated`);
