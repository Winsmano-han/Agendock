# WhatsApp Cloud API Setup (for AgentDock)

These are practical steps to get a working WhatsApp Cloud API sandbox for your barber demo.

## 1. Create Meta (Facebook) developer account

- Go to `https://developers.facebook.com/` and log in with your Facebook account.
- Accept the developer terms and create a developer account if you don't have one.

## 2. Create an app and add WhatsApp product

- In the Meta developers dashboard, click **Create App**.
- Choose **Business** app type (or the recommended type for WhatsApp).
- Give it a name (e.g. `AgentDock Hackathon`), select your account, and create.
- In the app dashboard, click **Add Product** and choose **WhatsApp**.

## 3. Get temporary test number and token

- In the WhatsApp > **Getting Started** section:
  - You will see a **Temporary access token**.
  - You will see a **Phone number ID** and a **WhatsApp Business Account ID**.
- Copy the temporary token and keep it safe (we will use it to send messages in tests).
- Note: temporary tokens expire. For a longer demo, generate a permanent token later.

## 4. Configure webhook URL and verify token

You need a public URL that points to your `whatsapp-service` running locally. Easiest is to use `ngrok`.

1. Install `ngrok` from `https://ngrok.com/` and sign in.
2. Run the Flask WhatsApp service locally:
   - Create a virtualenv in `services/whatsapp`.
   - Install dependencies: `pip install -r requirements.txt`.
   - Run: `python app.py` (it will listen on port 5001 by default).
3. Start `ngrok`:
   - `ngrok http 5001`
   - Copy the HTTPS forwarding URL, e.g. `https://abcd1234.ngrok.io`.
4. In the Meta app dashboard, under WhatsApp > Configuration:
   - Set **Callback URL** to `https://abcd1234.ngrok.io/webhook/whatsapp`.
   - Set **Verify Token** to a value you control, e.g. `dev-verify-token`.
   - In your local environment, set `WHATSAPP_VERIFY_TOKEN=dev-verify-token` before running the Flask app.
   - Click **Verify and save**. Meta will call `GET /webhook/whatsapp` and expect the token and challenge response (already implemented in `services/whatsapp/app.py`).

If verification succeeds, your webhook is active.

## 5. Subscribe to message events

- In the same configuration area, add or check the subscription for:
  - `messages`
  - `message_template` (optional for later)
- This ensures that when someone sends a message to your WhatsApp number, Meta will send a webhook to your app.

## 6. Test receiving a message

- In the Getting Started section, add your personal WhatsApp number as a test recipient (if required).
- Send a message (e.g. "Hi") to the test business number shown in the console.
- Check your `whatsapp-service` logs:
  - You should see the incoming webhook payload logged by `app.logger.info`.

At this point, you have:

- A working WhatsApp Cloud API webhook pointing to your local service.
- Verified token and subscription for messages.

Next steps (handled by the codebase):

- Parse the incoming webhook payload.
- Push a job to the worker (`process_incoming_message`).
- Have the worker call the AI service and then send a reply back with the WhatsApp **messages** API using your access token.
