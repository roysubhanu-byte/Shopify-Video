// Test fetching and parsing HTML
async function test() {
  const url = 'https://www.heathersheroes.com/';
  console.log('Fetching:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HobaBot/1.0)',
      },
    });

    const html = await response.text();
    console.log('HTML length:', html.length);
    console.log('HTML type:', typeof html);

    // Test image extraction
    console.log('\n=== Testing Image Extraction ===');

    // Simple img tag test
    const imgPattern = /<img[^>]+src=["']([^"']+)["']/gi;
    let count = 0;
    const images = [];

    for (const match of html.matchAll(imgPattern)) {
      count++;
      const imageUrl = match[1];
      if (imageUrl && !imageUrl.includes('logo') && !imageUrl.includes('icon')) {
        images.push(imageUrl);
      }
      if (count >= 10) break;
    }

    console.log('Found', count, 'img tags');
    console.log('Extracted', images.length, 'valid images:');
    images.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.substring(0, 100)}`);
    });

    // Check for Shopify-specific patterns
    console.log('\n=== Checking for Shopify patterns ===');
    if (html.includes('cdn.shopify.com')) {
      console.log('✓ Found Shopify CDN references');
      const shopifyImages = html.match(/https?:\/\/cdn\.shopify\.com\/[^\s"'>]+/g) || [];
      console.log(`  Found ${shopifyImages.length} Shopify images`);
      shopifyImages.slice(0, 5).forEach((img, i) => {
        console.log(`    ${i + 1}. ${img.substring(0, 100)}`);
      });
    } else {
      console.log('✗ No Shopify CDN found');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

test();
