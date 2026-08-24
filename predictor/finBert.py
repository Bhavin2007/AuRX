import os
import requests

from models import SentimentResult


class FinBertHFApiClient:
    API_URL = (
        "https://router.huggingface.co/"
        "hf-inference/models/ProsusAI/finbert"
    )

    def __init__(self, api_token: str = None):
        self.api_token = api_token or os.environ.get("HF_API_TOKEN")

        if not self.api_token:
            raise RuntimeError(
                "HF_API_TOKEN is not set. "
                "Add it to predictor/.env."
            )

        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    def score(self, text: str) -> SentimentResult:
        if not text or not text.strip():
            raise ValueError("Cannot run FinBERT on empty text.")

        payload = {
            "inputs": text[:1800]
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
                    f"FinBERT HTTP {response.status_code}: "
                    f"{response.text[:1000]}"
                )

            data = response.json()

            # Current HF text-classification response:
            # [
            #   {"label": "positive", "score": 0.98},
            #   {"label": "negative", "score": 0.01},
            #   {"label": "neutral", "score": 0.01}
            # ]
            #
            # Also support the older nested format:
            # [
            #   [
            #       {"label": "...", "score": ...},
            #       ...
            #   ]
            # ]

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
                    f"Unexpected FinBERT response: {data}"
                )

            scores = {}

            for item in results:
                if not isinstance(item, dict):
                    continue

                label = str(item.get("label", "")).lower()
                score = float(item.get("score", 0.0))

                if label:
                    scores[label] = score

            if not scores:
                raise RuntimeError(
                    f"No sentiment scores returned by FinBERT: {data}"
                )

            positive = scores.get("positive", 0.0)
            negative = scores.get("negative", 0.0)
            neutral = scores.get("neutral", 0.0)

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
                }.get,
            )

            return SentimentResult(
                positive=positive,
                negative=negative,
                neutral=neutral,
                label=label,
            )

        except requests.RequestException as exc:
            raise RuntimeError(
                f"FinBERT network request failed: {exc}"
            ) from exc

        except ValueError:
            raise

        except Exception as exc:
            raise RuntimeError(
                f"FinBERT request failed: {exc}"
            ) from exc