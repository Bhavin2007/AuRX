const positiveKeywords = [
    "gold",
    "gold price",
    "gold prices",
    "gold futures",
    "gold market",
    "gold demand",
    "gold supply",
    "gold reserves",
    "gold production",
    "gold mining",
    "gold bullion",
    "xau",
    "xau/usd",

    "central bank",
    "inflation",
    "interest rate",
    "rate cut",
    "rate hike",
    "federal reserve",
    "fed",
    "dollar",
    "treasury",
    "treasury yield",
    "bond yield",
    "cpi",
    "jobs report",
    "employment",
    "geopolitical",
    "war",
    "sanctions",
    "tariff",
    "trade war",
    "recession",
    "economic growth"
];

const negativeKeywords = [
    "gold necklace",
    "gold chain",
    "gold jewellery",
    "gold jewelry",
    "gold theft",
    "gold stolen",
    "gold snatching",
    "gold medal",
    "gold award",

    "current price of gold",
    "gold price today",
    "gold price update",

    "illegal gold mining",
    "gold mining crime",
    "gold smuggling"
];

const marketDrivers = [
    "interest rate",
    "rate cut",
    "rate hike",
    "federal reserve",
    "fed",
    "inflation",
    "cpi",
    "jobs report",
    "employment",
    "dollar",
    "treasury yield",
    "bond yield",
    "central bank",
    "gold reserves",
    "gold demand",
    "gold supply",
    "geopolitical",
    "war",
    "sanctions",
    "tariff",
    "trade war",
    "recession",
    "economic growth",
    "gold futures",
    "gold price",
    "gold prices",
    "gold outlook",
    "gold forecast"
];

function calculateRelevance(article) {

    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const content = (article.content || '').toLowerCase();

    const text = `${title} ${description} ${content}`;

    let score = 0;

    // Title is more important than body text.
    for (const keyword of positiveKeywords) {

        if (title.includes(keyword)) {
            score += 3;
        } else if (description.includes(keyword)) {
            score += 2;
        } else if (content.includes(keyword)) {
            score += 1;
        }
    }

    // Market-moving terms receive additional weight.
    for (const keyword of marketDrivers) {

        if (title.includes(keyword)) {
            score += 2;
        } else if (description.includes(keyword)) {
            score += 1;
        }
    }

    // Remove clearly irrelevant stories.
    for (const keyword of negativeKeywords) {

        if (text.includes(keyword)) {
            score -= 3;
        }
    }

    return score;
}

function isRelevant(article) {

    const score = calculateRelevance(article);

    return score >= 3;
}

module.exports = {
    calculateRelevance,
    isRelevant
};