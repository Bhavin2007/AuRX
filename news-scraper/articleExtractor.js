const axios = require("axios");
const cheerio = require("cheerio");

async function extractArticle(url) {

    try {

        const response = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            },

            timeout: 10000,
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);

        $("script, style, nav, footer, header, aside, form, iframe, noscript").remove();

        const paragraphs = [];

        const selectors = [
            "article p",
            "[itemprop='articleBody'] p",
            ".article-body p",
            ".article-content p",
            ".story-body p",
            ".story-content p",
            "main p"
        ];

        let selected = false;

        for (const selector of selectors) {

            const elements = $(selector);

            if (elements.length > 0) {

                elements.each((index, element) => {

                    const text = $(element)
                        .text()
                        .replace(/\s+/g, " ")
                        .trim();

                    if (text.length > 50) {
                        paragraphs.push(text);
                    }

                });

                if (paragraphs.length >= 3) {
                    selected = true;
                    break;
                }
            }
        }

        // Fallback if the site does not use common article selectors.
        if (!selected) {

            $("p").each((index, element) => {

                const text = $(element)
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();

                if (text.length > 50) {
                    paragraphs.push(text);
                }

            });
        }

        const uniqueParagraphs = [...new Set(paragraphs)];

        return uniqueParagraphs.join("\n\n");

    } catch (error) {

        console.log("Could not extract article:", url);

        return null;
    }
}

module.exports = { extractArticle };