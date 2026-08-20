const axios = require("axios");
const cheerio = require("cheerio");

async function extractArticle(url) {

    try {

        const response = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        // Remove things that aren't part of the article
        $("script").remove();
        $("style").remove();
        $("nav").remove();
        $("footer").remove();
        $("header").remove();
        $("aside").remove();

        // Get paragraph text
        const paragraphs = [];

        $("p").each((index, element) => {

            const text = $(element)
                .text()
                .replace(/\s+/g, " ")
                .trim();

            if (text.length > 40) {
                paragraphs.push(text);
            }
        });

        return paragraphs.join("\n\n");

    } catch (error) {

        console.log("Could not extract article:");
        console.log(url);
        console.log(error.message);

        return null;
    }
}


// TEST
const testUrl = "https://fortune.com/article/current-price-of-gold-08-14-2026/";

extractArticle(testUrl)
    .then(article => {

        if (article) {
            console.log("\nARTICLE CONTENT:\n");
            console.log(article);
        }

    });