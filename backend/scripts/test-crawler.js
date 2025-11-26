const crawlerService = require('../services/crawlerService');

async function testCrawler() {
  console.log('--- Testing Site Crawler ---');
  
  // Use a safe, small site or localhost if available. 
  // For this test, we'll mock the fetchUrl method to avoid hitting external sites during test.
  // But to demonstrate functionality, we can try a known small page or just mock it.
  
  // Mocking fetchUrl for safety and speed in this test environment
  crawlerService.fetchUrl = async (url) => {
    console.log(`[Mock Fetch] ${url}`);
    if (url.includes('404')) {
      return { html: '', status: 404 };
    }
    return { 
      html: '<html><body><a href="/page1">Link 1</a><a href="/404-page">Broken Link</a></body></html>', 
      status: 200 
    };
  };

  const startUrl = 'https://mock-greenchainz.com';
  const result = await crawlerService.crawl(startUrl);
  
  console.log('\nCrawl Result:', result);
}

testCrawler();
