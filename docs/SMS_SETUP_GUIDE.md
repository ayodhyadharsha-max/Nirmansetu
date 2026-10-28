# Supabase Phone Auth & SMS Provider Setup Guide for NirmanSetu

This guide provides step-by-step instructions for configuring real SMS OTP authentication for the **NirmanSetu** regional construction materials marketplace.

---

## 1. Why SMS Gateway Configuration is Required

NirmanSetu uses **Supabase Auth** (`supabase.auth.signInWithOtp({ phone: '+91XXXXXXXXXX' })`) for passwordless mobile OTP customer login and registration.

By default, hosted Supabase projects do **not** include pre-configured SMS delivery. When an unconfigured project attempts to send an OTP, the Supabase Auth API returns:
```
AuthApiError: Unsupported phone provider (Status 400)
```
To send real verification SMS messages to Indian mobile numbers (+91), the account owner must configure an external SMS provider in the Supabase Dashboard.

> [!WARNING]
> **Security Protocol**: Never paste API keys, Account SIDs, or Auth Tokens into source code, chat prompts, or git repositories. Configure them directly inside the encrypted Supabase Dashboard.

---

## 2. Step-by-Step Dashboard Configuration

1. **Log in to Supabase**:
   - Open [https://supabase.com/dashboard/project/gmfpjboxcjiujwczeekt](https://supabase.com/dashboard/project/gmfpjboxcjiujwczeekt) (or your active project dashboard).

2. **Navigate to Phone Provider Settings**:
   - In the left sidebar, click **Authentication** -> **Providers**.
   - Locate and click on **Phone**.

3. **Enable Phone Authentication**:
   - Toggle **Enable Phone Provider** to **ON**.

4. **Select an SMS Provider**:
   Supabase natively supports multiple gateways:
   - **Twilio**:
     * Account SID
     * Auth Token
     * Twilio Phone Number or Messaging Service SID
   - **MessageBird**:
     * API Key (Live)
     * Originator (Alphanumeric Sender ID)
   - **Vonage / Fast2SMS / Custom HTTP Webhook**:
     * Follow provider-specific credential fields.

5. **Configure OTP Constraints**:
   - **OTP Length**: 6 digits.
   - **OTP Expiry**: 600 seconds (10 minutes).
   - **SMS Template**:
     ```
     Your NirmanSetu verification code is: {{ .Code }}. Valid for 10 minutes. Do not share this OTP with anyone.
     ```

6. **Save Changes**:
   - Click the green **Save** button at the bottom of the Phone Provider panel.

---

## 3. Mandatory Regulatory Compliance for India (TRAI & DLT)

In India, commercial SMS delivery is strictly regulated by the **Telecom Regulatory Authority of India (TRAI)** under the **TCCCPR (Telecom Commercial Communications Customer Preference Regulations)**. All SMS messages sent to +91 numbers must pass through Distributed Ledger Technology (DLT) validation.

Before sending live SMS to Indian customers, ensure:

1. **DLT Entity Registration**:
   - Your business must be registered as a Principal Entity (PE) on a telecom DLT portal (such as Jio, Airtel, Vodafone Idea, or BSNL DLT).
   - Obtain your unique **Principal Entity ID (PE ID)**.

2. **Header (Sender ID) Registration**:
   - Register a 6-character alphanumeric Sender ID (Header) under the **Service Implicit** or **Transactional** category (e.g., `NRMSET` or `NRMNDS`).

3. **Content Template Registration**:
   - Register your exact OTP message template on the DLT portal and obtain the **Template ID**.
   - Example DLT Template:
     ```
     Your NirmanSetu verification code is {#var#}. Do not share this OTP with anyone. - NirmanSetu
     ```
   - Ensure the provider (e.g. Twilio) has your Entity ID and Template ID mapped in your Messaging Service configuration, or carriers will reject (+91) delivery with error `DLT Template Mismatch`.

---

## 4. Verification and Testing

1. Once saved, open the NirmanSetu login page:
   ```
   https://stages-could-aging-yield.trycloudflare.com/login
   ```
2. Enter your authorized 10-digit Indian mobile number.
3. Click **Get OTP**.
4. Check your mobile device for incoming SMS.
5. Enter the 6-digit code to complete authentication.

---
*Documented for NirmanSetu Operations Team • October 2026*
