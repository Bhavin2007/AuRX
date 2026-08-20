const positiveKeywords = [
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
    "federal reserve",
    "fed",
    "dollar",
    "treasury",
    "yield"
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

    // Low-value/repetitive news
    "current price of gold",
    "gold price today",
    "gold price today",
    "gold price update",

    // Usually not useful for short-term price prediction
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

    const text = (
        article.title + " " +
        article.description + " " +
        article.content
    ).toLowerCase();

    let score = 0;

    for (const keyword of positiveKeywords) {
        if (text.includes(keyword)) {
            score += 1;
        }
    }

    for (const keyword of negativeKeywords) {
        if (text.includes(keyword)) {
            score -= 2;
        }
    }

    return score;
}


function isRelevant(article) {

    const score = calculateRelevance(article);

    return score >= 1;
}


module.exports = {
    calculateRelevance,
    isRelevant
};