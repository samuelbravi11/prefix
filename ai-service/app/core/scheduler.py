from datetime import datetime, timedelta

def should_call_ai(last_call: datetime) -> bool:
    return datetime.now() - last_call > timedelta(days=30)
