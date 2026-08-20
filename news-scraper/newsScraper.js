require("dotenv").config();

const axios = require("axios");

const {
    isRelevant,
    calculateRelevance
} = require("./relevanceFilter");


const API_KEY = process.env.GNEWS_API_KEY;


async function getGoldNews() {

    try {

        const response = await axios.get(
            "https://gnews.io/api/v4/search",
            {
                params: {
                    q: '"gold price" OR "gold prices" OR "gold futures" OR "gold market"',
                    lang: "en",
                    country: "us",
                    max: 10,
                    sortby: "publishedAt",
                    apikey: API_KEY
                }
            }
        );


        // Convert GNews response into our format

        const articles = response.data.articles.map(article => ({
            title: article.title || "",
            description: article.description || "",
            content: article.content || "",
            url: article.url || "",
            source: article.source?.name || "Unknown",
            publishedAt: article.publishedAt || ""
        }));


        // Calculate relevance and remove irrelevant articles

        const filteredArticles = articles
            .map(article => ({
                ...article,
                relevanceScore: calculateRelevance(article)
            }))
            .filter(article => isRelevant(article));


        // Display results

        console.log(
            `Found ${articles.length} articles, ` +
            `${filteredArticles.length} relevant\n`
        );


        filteredArticles.forEach((article, index) => {

            console.log(`${index + 1}. ${article.title}`);
            console.log(`Source: ${article.source}`);
            console.log(`Relevance: ${article.relevanceScore}`);
            console.log(`Published: ${article.publishedAt}`);
            console.log(`URL: ${article.url}`);

            console.log("----------------------------------------");

        });


    } catch (error) {

        console.error(
            "Error:",
            error.response?.data || error.message
        );

    }
}


getGoldNews();