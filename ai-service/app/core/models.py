from transformers import pipeline

qa_model = pipeline(
    "table-question-answering",
    model="google/tapas-base-finetuned-wtq"
)

classifier = pipeline(
    "text-classification",
    model="distilbert-base-uncased"
)
