import os

from celery import Celery


CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")


celery_app = Celery(
  "agentdock_worker",
  broker=CELERY_BROKER_URL,
  backend=CELERY_RESULT_BACKEND,
)


@celery_app.task
def process_incoming_message(payload: dict) -> dict:
  """
  Stub Celery task to process an incoming WhatsApp message.
  Later, this will call the AI service and API service.
  """
  # TODO: integrate with AI service and API service
  return {"status": "processed_stub", "payload": payload}


if __name__ == "__main__":
  # Helper: run `celery -A app.celery_app worker --loglevel=info` from this directory.
  print("Run the worker with: celery -A app.celery_app worker --loglevel=info")
