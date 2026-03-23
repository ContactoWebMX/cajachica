const puppeteer = require('puppeteer');

(async () => {
    // We assume backend is running on 3000 and frontend on 5173
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Listen to console
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
    page.on('response', response => {
        if (!response.ok()) {
            console.error('HTTP ERROR:', response.status(), response.url());
        }
    });

    // Mock localStorage to simulate Admin login
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
        localStorage.setItem('user', JSON.stringify({ id: 27, role: 'Admin', name: 'Admin User' }));
    });
    
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000); // give time for API calls

    await browser.close();
})();
