require('dotenv').config();

const axios = require('axios');
const { isRelevant, calculateRelevance } = require('./relevanceFilter');
const { extractArticle } = require('./articleExtractor');

const API_KEY = process.env.GNEWS_API_KEY;

const PREDICTOR_URL = (
    process.env.PREDICTOR_URL ||
    'http://localhost:8000'
).replace(/\/$/, '');

const BACKEND_URL = (
    process.env.BACKEND_URL ||
    'http://localhost:3000'
).replace(/\/$/, '');

const TICKER = (
    process.env.TICKER ||
    'GOLD'
).trim().toUpperCase();

const MAX_ARTICLES = Math.min(
    Math.max(
        Number(process.env.GNEWS_MAX_ARTICLES || 10),
        1
    ),
    100
);

const HTTP_TIMEOUT = Number(
    process.env.HTTP_TIMEOUT_MS || 30000
);

const http = axios.create({
    timeout: HTTP_TIMEOUT
});


function determineSourceTier(sourceName) {

    if (!sourceName) return 'unknown';

    const name = sourceName.toLowerCase();

    if (
        name.includes('reuters') ||
        name.includes('bloomberg') ||
        name.includes('associated press') ||
        name === 'ap' ||
        name.includes('dow jones')
    ) {
        return 'news_wire';
    }

    if (
        name.includes('wall street journal') ||
        name.includes('wsj') ||
        name.includes('financial times') ||
        name.includes('barron') ||
        name.includes('economist')
    ) {
        return 'tier_1_financial';
    }

    if (
        name.includes('kitco') ||
        name.includes('fxstreet') ||
        name.includes('mining.com') ||
        name.includes('goldprice') ||
        name.includes('bullionvault') ||
        name.includes('investing.com')
    ) {
        return 'commodity_specialist';
    }

    if (
        name.includes('cnbc') ||
        name.includes('marketwatch') ||
        name.includes('yahoo finance') ||
        name.includes('forbes') ||
        name.includes('business insider') ||
        name.includes('seeking alpha') ||
        name.includes('benzinga')
    ) {
        return 'broad_financial';
    }

    if (
        name.includes('cnn') ||
        name.includes('bbc') ||
        name.includes('fortune') ||
        name.includes('nytimes') ||
        name.includes('new york times') ||
        name.includes('washington post') ||
        name.includes('the guardian')
    ) {
        return 'mainstream_news';
    }

    if (
        name.includes('msn') ||
        name.includes('yahoo news') ||
        name.includes('times of india') ||
        name.includes('ndtv') ||
        name.includes('news18')
    ) {
        return 'aggregator_regional';
    }

    return 'unknown';
}


function buildQuery() {

    const queries = {

        GOLD:
            '"gold price" OR "gold prices" OR "gold futures" OR "gold market"',

    };

    return queries[TICKER] || `"${TICKER}"`;
}


function normalizeArticle(article) {

    return {

        title: article.title || '',

        description:
            article.description || '',

        content:
            article.content || '',

        url:
            article.url || '',

        source:
            article.source?.name || 'Unknown',

        publishedAt:
            article.publishedAt ||
            new Date().toISOString(),

    };
}


async function getGoldNews() {

    if (!API_KEY) {

        throw new Error(
            'GNEWS_API_KEY is not defined in news-scraper/.env'
        );

    }

    const response = await http.get(
        'https://gnews.io/api/v4/search',
        {
            params: {

                q: buildQuery(),

                lang: 'en',

                country: 'us',

                max: MAX_ARTICLES,

                sortby: 'publishedAt',

                apikey: API_KEY,

            },
        }
    );


    const articles =
        (response.data?.articles || [])
            .map(normalizeArticle);


    /*
     * IMPORTANT CHANGE:
     *
     * Extract the full article BEFORE calculating relevance.
     *
     * Old:
     *
     * GNews
     *   ↓
     * relevance
     *   ↓
     * extraction
     *
     * New:
     *
     * GNews
     *   ↓
     * extraction
     *   ↓
     * relevance using full text
     */


    const extractedArticles =
        await Promise.all(

            articles.map(
                async article => {

                    const fullText =
                        await extractArticle(
                            article.url
                        );

                    const hasFullText =
                        Boolean(
                            fullText &&
                            fullText.length > 100
                        );

                    const content = (
                        hasFullText
                            ? fullText
                            : (
                                article.content ||
                                article.description ||
                                article.title
                            )
                    ).trim();

                    return {

                        ...article,

                        content,

                        fullText,

                        hasFullText,

                    };

                }
            )

        );


    /*
     * Calculate relevance using
     * the extracted article content.
     */

    const filteredArticles =
        extractedArticles

            .map(article => ({

                ...article,

                relevanceScore:
                    calculateRelevance({

                        title:
                            article.title,

                        description:
                            article.description,

                        content:
                            article.content,

                    }),

            }))

            .filter(article =>

                isRelevant({

                    title:
                        article.title,

                    description:
                        article.description,

                    content:
                        article.content,

                })

            );


    console.log(
        `Found ${articles.length} articles, ${filteredArticles.length} relevant.`
    );


    if (filteredArticles.length === 0) {

        console.log(
            'No relevant articles found. Nothing to send.'
        );

        return;
    }


    /*
     * Build the structure expected
     * by the predictor.
     *
     * Existing structure is preserved.
     */

    const rawItems =
        filteredArticles.map(
            article => ({

                text:
                    article.content,

                source_name:
                    article.source,

                source_url:
                    article.url,

                source_type:
                    determineSourceTier(
                        article.source
                    ),

                timestamp:
                    article.publishedAt,

                ticker:
                    TICKER,

                relevance_score:
                    article.relevanceScore,

                is_full_text:
                    article.hasFullText,

            })
        );


    const validItems =
        rawItems.filter(
            item =>
                item.text.length > 0 &&
                item.source_url
        );


    if (validItems.length === 0) {

        console.log(
            'Relevant articles contained no usable text/URLs. Nothing to send.'
        );

        return;
    }


    console.log(
        `Sending ${validItems.length} items to predictor: ${PREDICTOR_URL}/api/analyze`
    );


    const predictorResponse =
        await http.post(

            `${PREDICTOR_URL}/api/analyze`,

            validItems,

            {
                timeout:
                    Math.max(
                        HTTP_TIMEOUT,
                        60000
                    )
            }

        );


    if (
        predictorResponse.data?.status !==
        'success'
    ) {

        throw new Error(
            'Predictor returned an unsuccessful response.'
        );

    }


    console.log(
        'Momentum scores received.'
    );


    console.log(
        `Sending predictor output to backend: ${BACKEND_URL}/api/save-momentum`
    );


    const backendResponse =
        await http.post(

            `${BACKEND_URL}/api/save-momentum`,

            predictorResponse.data,

            {
                timeout:
                    HTTP_TIMEOUT
            }

        );


    console.log(
        'Backend response:',
        backendResponse.data
    );

    console.log(
        'Pipeline completed successfully.'
    );

}


getGoldNews().catch(error => {

    console.error(
        '\nNews pipeline failed:'
    );

    console.error(
        error.response?.data ||
        error.message
    );

    process.exitCode = 1;

});