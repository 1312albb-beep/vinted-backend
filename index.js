const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/search', async (req, res) => {
  const query = req.query.q || "nike";

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto(`https://www.vinted.com/catalog?search_text=${query}`, {
      waitUntil: 'networkidle2'
    });

    await page.waitForSelector('a[href*="/items/"]');

    const items = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/items/"]'))
        .slice(0, 20)
        .map(item => {
          const img = item.querySelector('img');
          const price = item.querySelector('[data-testid="price"]');

          return {
            title: img?.alt || "No title",
            image: img?.src,
            price: price?.innerText || "N/A",
            link: item.href
          };
        });
    });

    await browser.close();

    res.json(items);

  } catch (err) {
    res.status(500).json({ error: "Error scraping Vinted" });
  }
});

app.listen(PORT, () => console.log("Server running"));
