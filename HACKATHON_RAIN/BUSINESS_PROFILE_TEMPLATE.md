# AgentDock Business Profile Template

This is a standardized information sheet that any business fills to configure their AgentDock agent. The goal is:

- Make setup fast during a hackathon demo.
- Capture everything the agent needs: services, working hours, policies, tone, languages.
- Work across different business types (salon, barber, restaurant, boutique, etc.).

You can store this as JSON in the database or as a config file per tenant.

---

## 1. Basic business info

- **Business name**:  
- **Business type**: (e.g. barber, hair salon, restaurant, fashion boutique)  
- **Short tagline**: (one sentence about what you do)  
- **Location**: (area/city + address or landmark)  
- **Contact phone**:  
- **WhatsApp number**:  
- **Website / link in bio** (optional):  

## 2. Opening hours

Define the regular weekly schedule.

- **Time zone**: (e.g. Africa/Lagos)  
- **Hours by day**:
  - Monday:  
  - Tuesday:  
  - Wednesday:  
  - Thursday:  
  - Friday:  
  - Saturday:  
  - Sunday:  
- **Special notes**: (e.g. “Closed on public holidays”, “Last booking 30 mins before closing”.)

## 3. Services / products

List the core services or products. For a salon/barber, think like a menu.

For each service:

- **Name**: (e.g. “Regular haircut”, “Fade + beard trim”)  
- **Code/ID** (optional): (e.g. HC1, HC2)  
- **Description**: (short, customer-friendly)  
- **Duration**: (e.g. 30 mins, 45 mins)  
- **Price**: (e.g. ₦3,000)  
- **Category** (optional): (e.g. Haircut, Treatment, Kids, Ladies, Men)  
- **Available days** (optional): (if different from default opening hours)

## 4. Booking rules

Tell the agent how to handle bookings.

- **Booking types**: (walk-in, appointment, both)  
- **How far in advance** can customers book? (same day, up to 7 days, etc.)  
- **Buffer between appointments**: (e.g. 10 mins)  
- **Required info**: (full name, phone number, date, time, service, style preference)  
- **Late arrivals policy**: (e.g. “If you are more than 15 mins late, we may give your slot to someone else.”)  
- **No-show policy**: (optional; e.g. “After 2 no-shows we may require a deposit.”)

## 5. Payment & pricing

- **Currency**: (e.g. NGN)  
- **Payment methods**: (cash, transfer, POS, online payment)  
- **Deposit required?** (yes/no; if yes, how much or %?)  
- **Service fees / extra charges**: (e.g. home service, special styles)

## 6. Refunds & cancellations

This is important for trust and for a “professional” feel.

- **Cancellation window**: (e.g. “At least 3 hours before your appointment.”)  
- **Refund policy**:
  - When do you offer refunds?  
  - Do you offer rescheduling instead of refund?  
  - Any non-refundable services or deposits?  
- **Quality issues**:
  - What happens if a customer is not satisfied? (e.g. “Free touch-up within 3 days.”)

The agent can use this to:

- Explain policies clearly.
- Stay consistent, instead of making up answers.

## 7. Brand voice & languages

- **Preferred tone**: (e.g. friendly & casual, professional, playful)  
- **Use local slang?** (e.g. allow Pidgin phrases like “How far”, “No wahala”.)  
- **Supported languages** (priority order): (e.g. English, Pidgin, Yoruba, Igbo, Hausa)  
- **Do not use**: (phrases or language styles to avoid)

## 8. Social media & marketing

- **Instagram handle**:  
- **Facebook page**:  
- **TikTok handle** (optional):  
- **Hashtags to use**: (e.g. #LagosBarber #FadeGameStrong)  
- **Consent for posts**:
  - Do you ask before posting a client photo?  
  - Can the AI suggest a caption but require human approval?

## 9. Special rules per business type (optional)

### For salons/barbers

- Do you accept kids? From what age?  
- Any gender-specific services?  
- Protective styles / treatments list.  
- Home service / on-location service and extra cost.

### For restaurants

- Delivery vs pickup.  
- Delivery areas and fees.  
- Average prep time.  
- Allergens or dietary notes.

### For boutiques

- Size guide.  
- Exchange/return policy.  
- Delivery partners and timelines.

---

## JSON structure suggestion

You can store the profile in JSON like this (example keys):

```json
{
  "name": "Fades and Blades Barber Shop",
  "business_type": "barber",
  "tagline": "Clean fades, sharp lines, zero stress.",
  "location": "Yaba, Lagos (near XYZ bustop)",
  "contact_phone": "+234 903 000 0000",
  "whatsapp_number": "+234 903 000 0000",
  "website": null,
  "time_zone": "Africa/Lagos",
  "opening_hours": {
    "monday": "09:00-18:00",
    "tuesday": "09:00-18:00",
    "wednesday": "09:00-18:00",
    "thursday": "09:00-18:00",
    "friday": "09:00-18:00",
    "saturday": "10:00-16:00",
    "sunday": "closed"
  },
  "services": [
    {
      "id": "HC1",
      "name": "Regular haircut",
      "description": "Classic men’s haircut with simple style.",
      "duration_minutes": 30,
      "price": 3000,
      "category": "Haircut"
    },
    {
      "id": "HC2",
      "name": "Fade + beard trim",
      "description": "Skin fade with beard shaping and line up.",
      "duration_minutes": 45,
      "price": 4500,
      "category": "Haircut"
    }
  ],
  "booking_rules": {
    "booking_types": ["appointment", "walk_in"],
    "max_days_in_advance": 7,
    "buffer_minutes": 10,
    "required_fields": ["full_name", "phone", "date", "time", "service"],
    "late_policy": "If you are more than 15 minutes late, your slot may be given to someone else.",
    "no_show_policy": "After 2 no-shows we may require a deposit before new bookings."
  },
  "payments": {
    "currency": "NGN",
    "methods": ["cash", "transfer", "POS"],
    "deposit_required": false
  },
  "refunds": {
    "cancellation_window_hours": 3,
    "refund_policy": "You can cancel or reschedule up to 3 hours before your appointment. Deposits are non-refundable but can be moved to a new date once.",
    "quality_policy": "If you are not satisfied, we offer a free touch-up within 3 days."
  },
  "voice_and_language": {
    "tone": "friendly_casual",
    "use_slang": true,
    "languages": ["en", "pcm"],
    "avoid": []
  },
  "social": {
    "instagram": "@fadesandblades_ng",
    "facebook": "Fades and Blades NG",
    "tiktok": null,
    "hashtags": ["#LagosBarber", "#FadeGameStrong"],
    "needs_photo_consent": true
  }
}
```

This kind of profile can be:

- Stored per tenant.
- Loaded and passed into the LLM as context so the same agent “brain” can adapt to any business.

