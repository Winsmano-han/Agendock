from flask import Flask, request, jsonify
import os

import requests
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)


VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "dev-verify-token")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
AGENTDOCK_API_BASE = os.getenv("AGENTDOCK_API_BASE", "http://localhost:5000")

# Optional Twilio configuration, used when the webhook payload is from
# Twilio's WhatsApp Sandbox (form-encoded Body/From fields).
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")


@app.route("/health", methods=["GET"])
def health() -> tuple:
  return jsonify({"status": "ok", "service": "whatsapp"}), 200


@app.route("/webhook/whatsapp", methods=["GET"])
def verify_webhook() -> tuple:
  """
  WhatsApp webhook verification endpoint (GET).
  Meta will call this when you set up the webhook.
  """
  mode = request.args.get("hub.mode")
  token = request.args.get("hub.verify_token")
  challenge = request.args.get("hub.challenge")

  if mode == "subscribe" and token == VERIFY_TOKEN and challenge:
    return challenge, 200

  return "Forbidden", 403


@app.route("/webhook/whatsapp", methods=["POST"])
def handle_webhook() -> tuple:
  """
  Incoming WhatsApp messages (POST).
  We support two webhook formats:
  - Meta WhatsApp Cloud API (JSON with entry/changes/value/messages).
  - Twilio WhatsApp Sandbox (form-encoded with Body/From/ProfileName).

  In both cases we forward the text to the AgentDock API and then send
  the AI's reply back to the user via either Twilio or WhatsApp Cloud.
  """
  data = request.get_json(silent=True) or {}
  app.logger.info("Received WhatsApp webhook payload: %s", data)

  messages = []
  contacts = []
  contact_name = ""
  is_twilio = False

  if isinstance(data, dict) and data.get("entry"):
    # Meta WhatsApp Cloud payload
    try:
      entry = (data.get("entry") or [])[0]
      change = (entry.get("changes") or [])[0]
      value = change.get("value") or {}
      messages = value.get("messages") or []
      contacts = value.get("contacts") or []
    except Exception:
      app.logger.warning(
        "Unexpected WhatsApp Cloud payload shape, could not parse messages/contacts"
      )

    if contacts:
      profile = contacts[0].get("profile") or {}
      contact_name = profile.get("name", "") or ""
  else:
    # Assume Twilio WhatsApp Sandbox style: form-encoded fields.
    form = request.form or {}
    from_wa = form.get("From") or form.get("WaId")
    text_body = form.get("Body") or ""
    contact_name = form.get("ProfileName", "") or ""

    if from_wa and text_body:
      is_twilio = True
      messages = [
        {
          "from": from_wa,
          "type": "text",
          "text": {"body": text_body},
        }
      ]
    else:
      app.logger.warning(
        "Unexpected Twilio-style payload: missing From/Body. form=%s", dict(form)
      )

  if not messages:
    return jsonify({"received": True}), 200

  for msg in messages:
    if msg.get("type") != "text":
      continue

    from_wa = msg.get("from")
    text_body = (msg.get("text") or {}).get("body") or ""

    if not from_wa or not text_body:
      continue

    # Call AgentDock API to get an AI reply, letting the API resolve
    # the correct tenant using the START-<tenant_id> code + sessions.
    reply_text = (
      "Sorry, I'm having trouble reaching our assistant right now. "
      "Please try again in a few minutes."
    )

    try:
      api_resp = requests.post(
        f"{AGENTDOCK_API_BASE}/whatsapp/route",
        json={
          "message": text_body,
          "customer_name": contact_name,
          "customer_phone": from_wa,
        },
        timeout=20,
      )
      api_resp.raise_for_status()
      api_data = api_resp.json() or {}
      reply_text = api_data.get("reply") or reply_text
    except Exception as exc:
      app.logger.error("Error calling AgentDock API /whatsapp/route: %s", exc)

    # Send the reply back to the user via either Twilio or WhatsApp Cloud.
    try:
      if is_twilio and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        twilio_from = TWILIO_WHATSAPP_FROM
        data = {
          "From": twilio_from,
          "To": from_wa,
          "Body": reply_text,
        }
        w_resp = requests.post(
          url,
          data=data,
          auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
          timeout=20,
        )
        if w_resp.status_code >= 400:
          app.logger.error("Error sending WhatsApp reply via Twilio: %s", w_resp.text)
      else:
        if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
          app.logger.error(
            "WhatsApp credentials are missing; cannot send reply via Cloud API."
          )
          continue

        url = f"https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {
          "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
          "Content-Type": "application/json",
        }
        payload = {
          "messaging_product": "whatsapp",
          "to": from_wa,
          "text": {"body": reply_text},
        }
        w_resp = requests.post(url, headers=headers, json=payload, timeout=20)
        if w_resp.status_code >= 400:
          app.logger.error("Error sending WhatsApp reply via Cloud API: %s", w_resp.text)
    except Exception as exc:
      app.logger.error("Exception sending WhatsApp reply: %s", exc)

  return jsonify({"received": True}), 200


if __name__ == "__main__":
  port = int(os.getenv("PORT", "5001"))
  # Light debugging so you can verify the env values being used.
  app.logger.info("Starting WhatsApp service on port %s", port)
  app.logger.info("Using WHATSAPP_PHONE_NUMBER_ID=%s", WHATSAPP_PHONE_NUMBER_ID)
  if WHATSAPP_ACCESS_TOKEN:
    app.logger.info(
      "Using WHATSAPP_ACCESS_TOKEN starting with: %s...",
      WHATSAPP_ACCESS_TOKEN[:12],
    )
  else:
    app.logger.warning("WHATSAPP_ACCESS_TOKEN is not set!")
  app.run(host="0.0.0.0", port=port, debug=True)
