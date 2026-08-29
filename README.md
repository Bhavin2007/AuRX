````markdown
# AuRX — AI Gold Sentiment Intelligence

AuRX is an AI-powered financial intelligence prototype that analyzes financial news and combines it with live gold market data to estimate the current market sentiment for gold (XAUUSDT).

The system goes beyond simple positive/negative/neutral classification by considering sentiment strength, article relevance, source credibility, and recency before producing an overall weighted market sentiment.

## 🎥 Demo

**Demo Video:**  
https://drive.google.com/file/d/18LB-uBN4TD6VdVceVDV7RWDzthRXefYr/view?usp=sharing

**GitHub Repository:**  
https://github.com/Bhavin2007/AuRX

---

## 🎯 Problem

Gold prices are influenced by many factors, including:

- Interest rates
- Inflation
- US Dollar movements
- Treasury yields
- Government debt
- Geopolitical events
- Central-bank decisions
- Economic uncertainty
- Investor risk sentiment

A large portion of this information appears first in financial news.

However, simply classifying an article as positive, negative, or neutral does not tell us how important that article actually is for the gold market.

For example, two articles may both be positive for gold, but one may come from a highly credible financial source and discuss a major economic event, while the other may be a minor article with little relevance.

AuRX attempts to solve this by combining multiple factors into a single market-intelligence pipeline.

---

## 💡 What AuRX Does

AuRX follows this general workflow:

```text
Financial News
      ↓
News Scraping & Filtering
      ↓
Article Extraction
      ↓
FinBERT Sentiment Analysis
      ↓
Credibility + Relevance + Recency
      ↓
Article-Level Market Signal
      ↓
Weighted Overall Sentiment
      ↓
MongoDB
      ↓
React Dashboard
````

At the same time, live gold market data is obtained separately:

```text
Binance XAUUSDT
      ↓
Live Price Data
      ↓
Candlestick Chart
      ↓
Technical Indicators
      ↓
React Dashboard
```

The dashboard brings both sources together so users can compare the current market movement with the sentiment coming from financial news.

---

# 🏗️ System Architecture

```text
                         ┌─────────────────┐
                         │    GNews API    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  News Scraper   │
                         │     Node.js     │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    Predictor    │
                         │ Python/FastAPI  │
                         │    FinBERT      │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     Backend     │
                         │ Node.js/Express │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
             ┌─────────────┐             ┌─────────────┐
             │   MongoDB   │             │   Frontend  │
             │   Database  │             │    React    │
             └─────────────┘             └─────────────┘
                                                ▲
                                                │
                                         ┌──────┴──────┐
                                         │   Binance   │
                                         │   XAUUSDT   │
                                         └─────────────┘
```

---

# 📰 1. News Collection

The news-scraper uses the GNews API to collect recent financial news related to gold.

Each article can contain:

* Title
* Description
* URL
* Source
* Publication time
* Article content

The current prototype analyzes **10 articles per analysis cycle**.

The number is intentionally limited because this is a prototype and external news APIs can impose request limits.

---

# 🔎 2. Article Relevance

Not every article mentioning gold is equally useful.

The system evaluates how relevant an article is to the gold market.

Articles related to topics such as:

* Gold prices
* Inflation
* Interest rates
* Federal Reserve decisions
* US Dollar
* Treasury yields
* Government debt
* Geopolitical uncertainty
* Central-bank activity
* Safe-haven demand

are more relevant to gold-market analysis.

This prevents unrelated financial news from having too much influence on the final sentiment.

---

# 🤖 3. FinBERT Sentiment Analysis

AuRX uses **FinBERT** as the foundation for financial sentiment analysis.

FinBERT is a BERT-based language model trained specifically for financial language.

Its original purpose is to classify financial text into:

```text
Positive
Negative
Neutral
```

However, this alone is not enough for AuRX.

The system uses FinBERT's sentiment output as the foundation and adds additional scoring logic around it.

```text
Financial Article
       ↓
     FinBERT
       ↓
Positive / Negative / Neutral
       ↓
Sentiment Strength
       +
Relevance
       +
Credibility
       +
Recency
       ↓
Market Signal
```

This allows AuRX to move beyond basic sentiment classification toward a more detailed financial-market analysis.

---

# 📊 4. Sentiment Score

FinBERT provides probabilities for the three sentiment classes.

These probabilities are converted into a signed sentiment value.

Conceptually:

```text
Positive → Positive score
Negative → Negative score
Neutral  → Score around zero
```

The magnitude of the score represents the strength of the sentiment.

For example:

```text
+0.80 → Strong positive signal
+0.20 → Weak positive signal
 0.00 → Neutral
-0.20 → Weak negative signal
-0.80 → Strong negative signal
```

---

# ⭐ 5. Credibility

Different sources should not necessarily have equal influence.

AuRX assigns a credibility score to each article.

Credibility acts as a weighting factor when calculating the overall market sentiment.

For example:

```text
Article A
Credibility = 0.82

Article B
Credibility = 0.45
```

Article A therefore has greater influence on the final result.

The credibility value is a model-defined estimate used by the prototype and should not be interpreted as an objective measurement of journalistic reliability.

---

# 🎯 6. Relevance

Relevance measures how strongly an article is connected to gold and factors that influence the gold market.

A highly relevant article receives greater influence than an article that only mentions gold indirectly.

This is important because a highly credible source can still publish an article that has very little relevance to gold.

---

# ⏱️ 7. Recency

Recent information generally has more influence on current market sentiment than older information.

AuRX therefore applies a recency weighting mechanism using exponential decay.

The prototype uses a 3-hour half-life.

Conceptually:

```text
Article age       Approx. weight

0 hours              100%
3 hours               50%
6 hours               25%
```

A minimum weight is maintained so that reasonably recent articles are not completely discarded.

---

# ⚖️ 8. Weighted Sentiment

The individual articles are combined into an overall weighted sentiment.

Conceptually:

```text
Weighted Sentiment
=
Σ(Sentiment × Weight)
----------------------
       Σ(Weight)
```

The weight takes factors such as credibility and recency into account.

Therefore, the final result is not simply the average of the 10 articles.

A recent, highly credible and highly relevant article can have substantially more influence than a weak or older article.

---

# 📈 9. Momentum

AuRX also maintains sentiment readings over time.

Weighted sentiment answers:

> What is the current overall news sentiment?

Momentum answers:

> Is that sentiment changing?

The basic idea is:

```text
Momentum
=
Current Weighted Sentiment
-
Previous Weighted Sentiment
```

A positive value means sentiment is becoming more positive.

A negative value means sentiment is becoming more negative.

Momentum is currently maintained under the hood as part of the analysis pipeline.

---

# 📉 10. EMA Momentum

The system also calculates an Exponential Moving Average of momentum.

EMA is used to smooth short-term changes in momentum.

The general formula is:

```text
EMA = α × Current Value
    + (1 - α) × Previous EMA
```

where:

```text
α = 2 / (span + 1)
```

This provides the foundation for future sentiment-trend analysis as more historical readings become available.

---

# 💾 11. MongoDB Storage

The backend stores processed information in MongoDB.

Two main collections are used.

## articles

Stores information about individual analyzed articles.

Typical information includes:

* Title
* Source
* URL
* Publication time
* Sentiment
* Sentiment score
* Credibility
* Relevance
* Signal
* Analysis results

## momentumsnapshots

Stores aggregated sentiment readings over time.

Typical information includes:

* Ticker
* Timestamp
* Weighted sentiment
* Momentum
* Number of analyzed articles
* Total credibility weight

The two collections serve different purposes:

```text
articles
    ↓
Individual news signals

momentumsnapshots
    ↓
Aggregated sentiment over time
```

---

# 🔌 12. Backend

The Node.js/Express backend acts as the communication layer between the AI pipeline, MongoDB and the frontend.

Its responsibilities include:

```text
Receive AI results
       ↓
Process results
       ↓
Store articles
       ↓
Store sentiment snapshots
       ↓
Provide data to frontend
```

The backend allows the frontend and AI services to remain independent.

---

# 🤖 13. Predictor Service

The predictor is implemented using Python and FastAPI.

It receives article data from the news scraper and returns structured analysis.

```text
Articles
    ↓
FinBERT
    ↓
Sentiment
    ↓
Scoring Logic
    ↓
Credibility + Relevance + Recency
    ↓
Analyzed Results
```

The predictor is kept as a separate service so that the AI pipeline can be improved independently from the frontend and backend.

---

# 🔄 14. Complete Data Flow

The complete pipeline is:

```text
GNews
  ↓
News Scraper
  ↓
Article Filtering
  ↓
Article Extraction
  ↓
Predictor API
  ↓
FinBERT
  ↓
Sentiment + Scoring
  ↓
Backend API
  ↓
MongoDB
  ↓
Frontend Dashboard
```

At the same time:

```text
Binance XAUUSDT
       ↓
Live Market Data
       ↓
Frontend Dashboard
```

The final dashboard therefore combines:

```text
AI News Intelligence
          +
Live Market Data
          +
Technical Analysis
```

---

# 📈 15. Live Gold Market Data

The frontend displays live XAUUSDT market information.

The dashboard includes:

* Current gold price
* Price change
* Live market status
* Candlestick chart
* Multiple time intervals

Supported intervals include:

* 1 minute
* 30 minutes
* 1 hour
* 4 hours

The candlestick chart displays:

* Open
* High
* Low
* Close

Users can interact with the chart to inspect price movement at different points in time.

---

# 📊 16. Technical Indicators

AuRX also displays traditional market indicators alongside the AI analysis.

### RSI

Relative Strength Index, used to understand recent price strength and potential overbought or oversold conditions.

### MACD

Moving Average Convergence Divergence, used to analyze momentum and possible trend changes.

### EMA

Exponential Moving Average, used to smooth price data and identify trends.

### Trend

Provides a simplified interpretation of the relationship between current price movement and moving averages.

---

# 📰 17. Key News

The dashboard highlights the major articles from the analyzed news set.

The selected articles can display:

* Source
* Sentiment
* Headline
* Description
* Credibility
* Relevance
* Signal

This makes the final sentiment more explainable.

Instead of showing only:

```text
AI Sentiment: +57%
```

the user can also inspect the news articles that contributed to that result.

---

# 🔍 18. Explainability

One of the main goals of AuRX is to avoid presenting the final sentiment as an unexplained number.

The analysis can be viewed as:

```text
                    Overall Sentiment
                           │
             ┌─────────────┴─────────────┐
             │                           │
      Aggregate Data                Key Articles
             │                           │
      ┌──────┼──────┐              ┌─────┼─────┐
      │      │      │              │     │     │
 Sentiment Cred. Recency        Source Signal Relevance
```

This allows the user to understand both:

**What the system thinks**

and

**What information contributed to that conclusion.**

---

# 🛠️ Technology Stack

| Component         | Technology       |
| ----------------- | ---------------- |
| Frontend          | React            |
| Styling           | Tailwind CSS     |
| State Management  | Recoil           |
| Backend           | Node.js          |
| Backend Framework | Express          |
| AI Service        | Python           |
| AI API            | FastAPI          |
| NLP Model         | FinBERT          |
| Database          | MongoDB Atlas    |
| News API          | GNews            |
| Market Data       | Binance          |
| Communication     | REST APIs / JSON |

---

# 📂 Project Structure

```text
AuRX/
│
├── backend/
│   ├── models/
│   ├── routes/
│   └── ...
│
├── news-scraper/
│   ├── newsScraper.js
│   ├── .env
│   └── package.json
│
├── predictor/
│   ├── models/
│   ├── momentum.py
│   ├── main.py
│   └── ...
│
├── frontend/
│   └── AuRX/
│       ├── src/
│       ├── public/
│       └── package.json
│
└── README.md
```

---

# 🚀 Running Locally

AuRX consists of multiple services that need to run separately.

### Backend

```bash
cd backend
npm install
npm start
```

### Predictor

```bash
cd predictor
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### News Scraper

```bash
cd news-scraper
npm install
node newsScraper.js
```

### Frontend

```bash
cd frontend/AuRX
npm install
npm run dev
```

The frontend can then be opened using the local URL provided by the development server.

---

# ⚠️ Limitations

AuRX is currently a prototype.

Some limitations include:

* Only a limited number of articles are analyzed per cycle.
* Some publishers prevent automated article extraction.
* External APIs can impose rate limits.
* Sentiment depends on the quality of available article text.
* Credibility and relevance are model-defined estimates.
* News sentiment does not guarantee future price movement.
* Markets can react to information that is not captured by the selected news sources.
* The prototype has not undergone extensive historical backtesting.
* The system should not be used as the sole basis for financial decisions.

---

# 🔮 Future Goals

The current prototype provides the foundation for a more advanced financial intelligence platform.

Future improvements include:

* Larger news coverage
* More financial news sources
* Better API-rate management
* Improved article extraction
* More advanced credibility scoring
* Better gold-specific relevance analysis
* Historical sentiment visualization
* Sentiment and price correlation analysis
* Historical backtesting
* Major financial event detection
* Geopolitical event analysis
* Real-time alerts
* Improved duplicate-news detection
* Additional financial indicators
* Support for other assets such as silver, crude oil, Bitcoin and equities
* More advanced financial language models
* Continuous background analysis

The long-term goal is to move from a prototype that summarizes financial news sentiment toward a continuously updated financial market intelligence platform.

---

# 📚 References

### FinBERT

Araci, D. — *FinBERT: Financial Sentiment Analysis with Pre-trained Language Models*

[https://arxiv.org/abs/1908.10063](https://arxiv.org/abs/1908.10063)

### Gold Market & News Sentiment

Smales, L. A. — *News sentiment in the gold futures market*

[https://www.sciencedirect.com/science/article/abs/pii/S0378426614003069](https://www.sciencedirect.com/science/article/abs/pii/S0378426614003069)

### Gold Futures & Sentiment

*Can FinBERT2-Based Investor Sentiment Predict Gold Futures Volatility? A Fine-Grained Sentiment Category Analysis*

[https://www.mdpi.com/2227-7072/14/8/225](https://www.mdpi.com/2227-7072/14/8/225)

### GNews

[https://gnews.io/](https://gnews.io/)

### Binance API

[https://developers.binance.com/](https://developers.binance.com/)

### MongoDB

[https://www.mongodb.com/](https://www.mongodb.com/)

### FastAPI

[https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)

### React

[https://react.dev/](https://react.dev/)

---

# ⚖️ Disclaimer

AuRX is an educational and experimental prototype.

The outputs generated by AuRX are not financial advice and should not be treated as guaranteed market predictions.

Market prices can move independently of news sentiment, and sentiment signals can be incorrect or incomplete.

Any future production version would require extensive historical validation, backtesting, risk controls, monitoring and model evaluation before being used for real-world financial decision support.

---

# ⭐ AuRX

**AI Gold Sentiment Intelligence**

**Financial News → AI Analysis → Market Sentiment → Market Intelligence**

```
```
