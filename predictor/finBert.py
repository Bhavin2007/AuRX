import os
import requests

from models import SentimentResult


class FinBertHFApiClient:

    API_URL = (
        "https://router.huggingface.co/"
        "hf-inference/models/ProsusAI/finbert"
    )


    def __init__(
        self,
        api_token: str = None
    ):

        self.api_token = (
            api_token or
            os.environ.get(
                "HF_API_TOKEN"
            )
        )


        if not self.api_token:

            raise RuntimeError(
                "HF_API_TOKEN is not set. "
                "Add it to predictor/.env."
            )


        self.headers = {

            "Authorization":
                f"Bearer {self.api_token}",

            "Content-Type":
                "application/json",

        }


    def _score_chunk(
        self,
        text: str
    ):

        payload = {
            "inputs": text
        }


        try:

            response = requests.post(

                self.API_URL,

                headers=self.headers,

                json=payload,

                timeout=(10, 120),

            )


            if not response.ok:

                raise RuntimeError(

                    f"FinBERT HTTP "
                    f"{response.status_code}: "
                    f"{response.text[:1000]}"

                )


            data = response.json()


            if (

                isinstance(data, list)

                and len(data) == 1

                and isinstance(data[0], list)

            ):

                results = data[0]


            elif isinstance(data, list):

                results = data


            else:

                raise RuntimeError(

                    f"Unexpected FinBERT response: "
                    f"{data}"

                )


            scores = {}


            for item in results:

                if not isinstance(
                    item,
                    dict
                ):
                    continue


                label = str(
                    item.get(
                        "label",
                        ""
                    )
                ).lower()


                score = float(
                    item.get(
                        "score",
                        0.0
                    )
                )


                if label:

                    scores[label] = score


            if not scores:

                raise RuntimeError(

                    "No sentiment scores returned "
                    f"by FinBERT: {data}"

                )


            return (

                scores.get(
                    "positive",
                    0.0
                ),

                scores.get(
                    "negative",
                    0.0
                ),

                scores.get(
                    "neutral",
                    0.0
                ),

            )


        except requests.RequestException as exc:

            raise RuntimeError(

                f"FinBERT network request failed: "
                f"{exc}"

            ) from exc


    def score(
        self,
        text: str
    ):

        if (
            not text or
            not text.strip()
        ):

            raise ValueError(
                "Cannot run FinBERT on empty text."
            )


        # Normalize whitespace.

        text = " ".join(
            text.split()
        )


        # Keep each request small enough
        # for the inference API.

        chunk_size = 1500


        chunks = [

            text[i:i + chunk_size]

            for i in range(
                0,
                len(text),
                chunk_size
            )

        ]


        # Prevent extremely long articles
        # from creating excessive API calls.

        chunks = chunks[:8]


        positive_scores = []

        negative_scores = []

        neutral_scores = []


        for chunk in chunks:

            if not chunk.strip():

                continue


            positive, negative, neutral = (
                self._score_chunk(chunk)
            )


            positive_scores.append(
                positive
            )

            negative_scores.append(
                negative
            )

            neutral_scores.append(
                neutral
            )


        if not positive_scores:

            raise RuntimeError(
                "FinBERT returned no usable scores."
            )


        # Average sentiment across
        # all analyzed chunks.

        positive = (
            sum(positive_scores) /
            len(positive_scores)
        )


        negative = (
            sum(negative_scores) /
            len(negative_scores)
        )


        neutral = (
            sum(neutral_scores) /
            len(neutral_scores)
        )


        # Normalize the probabilities.

        total = (
            positive +
            negative +
            neutral
        )


        if total > 0:

            positive = (
                positive / total
            )

            negative = (
                negative / total
            )

            neutral = (
                neutral / total
            )


        label = max(

            {
                "positive": positive,
                "negative": negative,
                "neutral": neutral,
            },

            key={

                "positive": positive,
                "negative": negative,
                "neutral": neutral,

            }.get

        )


        return SentimentResult(

            positive=round(
                positive,
                6
            ),

            negative=round(
                negative,
                6
            ),

            neutral=round(
                neutral,
                6
            ),

            label=label,

        )