// Quick test script for ingest function
const { ingestProductURL } = require('./dist/lib/ingest.js');

async function test() {
  const url = 'https://www.heathersheroes.com/';
  console.log('Testing ingest for:', url);

  try {
    const result = await ingestProductURL(url);
    console.log('\n=== INGEST RESULT ===');
    console.log('Title:', result.title);
    console.log('Description:', result.description?.substring(0, 100));
    console.log('Brand:', result.brandName);
    console.log('Images found:', result.images.length);
    console.log('Images:');
    result.images.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.substring(0, 80)}...`);
    });
    console.log('Bullets:', result.bullets.length);
    console.log('\n=== SUCCESS ===');
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
