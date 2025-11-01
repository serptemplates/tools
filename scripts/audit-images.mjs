#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionsPath = path.join(__dirname, '../packages/app-core/src/data/extensions.json');

/**
 * Check if an image URL is accessible (returns 200-299 status)
 */
async function checkImageUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : require('http');

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      timeout: 5000,
    };

    const req = protocol.request(options, (res) => {
      const isValid = res.statusCode >= 200 && res.statusCode < 300;
      resolve({
        url,
        status: res.statusCode,
        valid: isValid,
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        status: null,
        valid: false,
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: null,
        valid: false,
        error: 'Timeout',
      });
    });

    req.end();
  });
}

/**
 * Identify image source type
 */
function getImageSource(url) {
  if (url.includes('lh3.googleusercontent.com')) {
    return 'Google CDN';
  }
  if (url.includes('via.placeholder.com')) {
    return 'Placeholder Service';
  }
  return 'Unknown';
}

/**
 * Audit all images in extensions data
 */
async function auditImages() {
  console.log('📸 Image Audit Report\n');
  console.log('='.repeat(80));

  try {
    const data = JSON.parse(fs.readFileSync(extensionsPath, 'utf8'));
    let totalImages = 0;
    let brokenImages = [];
    let imagesBySource = {};

    for (const extension of data) {
      console.log(`\n🔍 ${extension.name}`);
      console.log('-'.repeat(40));

      // Check icon
      if (extension.icon) {
        const source = getImageSource(extension.icon);
        imagesBySource[source] = (imagesBySource[source] || 0) + 1;
        totalImages++;

        const result = await checkImageUrl(extension.icon);
        const status = result.valid ? '✅' : '❌';
        console.log(`  ${status} Icon (${source})`);
        console.log(`     URL: ${extension.icon.substring(0, 70)}...`);
        console.log(`     Status: ${result.status || result.error}`);

        if (!result.valid) {
          brokenImages.push({
            extension: extension.name,
            type: 'icon',
            url: extension.icon,
            reason: result.error || `Status ${result.status}`,
          });
        }
      }

      // Check screenshots
      if (extension.screenshots && Array.isArray(extension.screenshots)) {
        for (let i = 0; i < extension.screenshots.length; i++) {
          const screenshot = extension.screenshots[i];
          const source = getImageSource(screenshot);
          imagesBySource[source] = (imagesBySource[source] || 0) + 1;
          totalImages++;

          const result = await checkImageUrl(screenshot);
          const status = result.valid ? '✅' : '❌';
          console.log(`  ${status} Screenshot ${i + 1} (${source})`);
          console.log(`     Status: ${result.status || result.error}`);

          if (!result.valid) {
            brokenImages.push({
              extension: extension.name,
              type: `screenshot-${i + 1}`,
              url: screenshot,
              reason: result.error || `Status ${result.status}`,
            });
          }
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary');
    console.log('-'.repeat(40));
    console.log(`Total Images: ${totalImages}`);
    console.log(`Broken Images: ${brokenImages.length}`);
    console.log(`Valid Images: ${totalImages - brokenImages.length}`);
    console.log(`Success Rate: ${(((totalImages - brokenImages.length) / totalImages) * 100).toFixed(1)}%`);

    console.log('\nImages by Source:');
    for (const [source, count] of Object.entries(imagesBySource)) {
      console.log(`  • ${source}: ${count}`);
    }

    if (brokenImages.length > 0) {
      console.log('\n❌ Broken Images');
      console.log('-'.repeat(40));
      for (const broken of brokenImages) {
        console.log(`\n  Extension: ${broken.extension}`);
        console.log(`  Type: ${broken.type}`);
        console.log(`  Reason: ${broken.reason}`);
        console.log(`  URL: ${broken.url}`);
      }

      console.log('\n💡 Recommendations:');
      console.log('  • Use via.placeholder.com for temporary/placeholder images');
      console.log('  • Use lh3.googleusercontent.com for real Chrome Web Store images');
      console.log('  • Test URLs directly in browser to verify accessibility');

      process.exit(1);
    } else {
      console.log('\n✅ All images are accessible!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

auditImages();
