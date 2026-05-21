# Mollmart Diploma Demo Flow

This script demonstrates the current Option B scope: buyer requests, seller offers, accepted-offer chat, demo payment, request-deal order tracking, and admin controls.

## Demo Setup

Use a clean local run:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:4040
```

Prepare three accounts before the live walkthrough if possible:

```text
Buyer:  demo.buyer@mollmart.test
Seller: demo.seller@mollmart.test
Admin:  demo.admin@mollmart.test
Password for all demo accounts: DemoPass123!
```

Notes:

- Buyer and seller accounts can be created from `/register`.
- New buyer accounts must verify email before creating requests. In local mode, use the local verification link shown after registration.
- Admin accounts are not created from the public registration UI. Promote a prepared account to `admin` in the database before the demo, or use an existing admin account.
- Use an incognito window, a second browser profile, or log out between role switches.

## Sample Demo Data

Buyer request:

```text
Title: Need 2 wireless keyboards for office setup
Category: Electronics
Currency: KZT
Quantity: 2
Price per unit: 18000
City / region: Almaty, Kazakhstan
Description:
Looking for two reliable wireless keyboards for a small office setup. Prefer quiet keys, USB or Bluetooth support, and delivery within one week. Please include warranty or condition details.
```

Seller offer:

```text
Price per unit: 16500 KZT
Estimated availability: Within 7 days
Message:
I can supply two new wireless keyboards with quiet keys, Bluetooth support, and local delivery. Warranty is included.
```

Chat agreement:

```text
Buyer message: Thanks, this works. Can we agree on the offer total?
Seller message: Yes, I can confirm 33,000 KZT total for both keyboards.
Demo card name: Demo Buyer
Demo card last 4: 4242
```

Admin tracking update:

```text
Status: shipped
Carrier: KazPost Demo
Tracking number: MM-DEMO-4242
```

## 1. Buyer Registers And Logs In

Open `/register`.

1. Select `Buyer`.
2. Enter the buyer demo name, email, and password.
3. Agree to terms and create the account.
4. If email verification is required, open the local verification link.
5. Go to `/login` and sign in as the buyer.

Presenter line:

> Mollmart starts from the buyer side. A buyer can register, verify their email, and enter the workspace where they manage product requests.

## 2. Buyer Creates And Publishes Request

Open `/create-product-request`.

1. Fill the sample buyer request data.
2. Click `Save as draft`.
3. Click `Open My Requests`.
4. On the draft card, click `Publish`.

Presenter line:

> Requests are saved as drafts first, so the buyer can review them before sellers see them. Once published, the request appears on the seller request board.

Expected result:

- The request status changes from `draft` to `published`.
- Seller offer count starts at `0`.

## 3. Seller Logs In And Submits Offer

Log out, then log in as the seller. The seller is routed to `/browse-buyer-requests`.

1. Open the `Published` or `All Requests` tab.
2. Find the keyboard request.
3. Click `Make an Offer`.
4. Fill the sample seller offer data.
5. Click `Send Offer`, then `Done`.

Presenter line:

> Sellers do not create the buyer need. They browse active demand and respond with a concrete price, availability, and message.

Expected result:

- The request now has one offer.
- The buyer can review it from `My Requests`.

## 4. Buyer Accepts Offer

Log out, then log in again as the buyer. Open `/my-requests`.

1. Find the published request.
2. Click `View offers`.
3. Review the seller, unit price, total, and message.
4. Click `Accept Offer`.

Presenter line:

> The buyer keeps control of the decision. Accepting an offer changes the request into negotiation and opens a direct buyer-seller chat.

Expected result:

- A success toast appears.
- The app opens `/chat`.
- A conversation exists for the accepted offer.

## 5. Chat Opens And Price Is Agreed

In `/chat`, select the new conversation if it is not already active.

1. Send the buyer message from the sample data.
2. In the `Deal & payment` panel, click `Use offer total`.
3. Log in as the seller, open `/chat`, select the same conversation, and click `Accept` on the pending price proposal.
4. Log back in as the buyer and confirm the agreed total appears.

Presenter line:

> After offer acceptance, the deal continues in chat. The app keeps normal messages and price proposals together, so both sides can agree before payment.

Expected result:

- The deal panel shows an agreed total.
- The buyer sees `Pay now (demo)` after the seller accepts the proposal.

## 6. Buyer Completes Demo Payment

As the buyer in `/chat`:

1. Click `Pay now (demo)`.
2. Enter `Demo Buyer`.
3. Enter last 4 digits `4242`.
4. Click `Complete payment`.
5. Click the order link shown in the paid state, or open `/orders`.

Presenter line:

> Payment is simulated for diploma scope. No real card is charged, but Mollmart creates a request-deal order so tracking and admin operations can be demonstrated.

Expected result:

- Chat shows the deal as paid.
- `/orders` shows a new request-deal order with `processing` status.

## 7. Admin Updates Order Status And Tracking

Log out, then log in as admin. Open `/admin/orders`.

1. Find the new request-deal order.
2. Change status to `shipped`.
3. Enter carrier `KazPost Demo`.
4. Enter tracking number `MM-DEMO-4242`.
5. Click `Save`.

Presenter line:

> Admin can update fulfillment state for request-deal orders. This simulates shipment tracking without integrating a real carrier.

Expected result:

- The order row keeps the tracking number and carrier.
- Status becomes `shipped`.

## 8. Buyer Views Order Tracking

Log back in as the buyer. Open `/orders`.

1. Find the new order.
2. Click `Track`.
3. Show the tracking timeline, carrier, and tracking number.

Presenter line:

> The buyer can now see the order status and tracking details from their order history.

Expected result:

- Tracking page shows `Processing` and `Shipped`.
- Tracking number `MM-DEMO-4242` and carrier `KazPost Demo` are visible.

## 9. Admin Shows Platform Controls

Log back in as admin, then show these pages:

1. `/admin` - dashboard summary and quick actions.
2. `/admin/moderation` - create or manage moderation cases for requests, offers, or users.
3. `/admin/categories` - add, edit, activate, or deactivate categories.
4. `/admin/users` - search users, block/unblock accounts, or delete a user.
5. `/admin/requests` - review and remove buyer requests if needed.

Presenter line:

> The admin area covers the platform management side: moderation, categories, users, requests, and order tracking operations.

## Recovery Tips

- If the seller cannot see the request, confirm the buyer clicked `Publish`.
- If the buyer cannot create a request, verify the buyer email from the local verification link.
- If `Pay now (demo)` is missing, make sure a price proposal has been accepted or the offer total has been applied and agreed.
- If tracking is not visible on the buyer order, confirm admin saved the order as `shipped` or `delivered` with a tracking number.
- If demo emails already exist, register with timestamped emails such as `buyer.demo.0521@mollmart.test`.

## Short Version

1. Buyer registers, verifies email, logs in.
2. Buyer creates request, saves draft, publishes from `My Requests`.
3. Seller logs in, browses buyer requests, submits offer.
4. Buyer logs in, views offers, accepts offer.
5. Chat opens; buyer and seller agree on total.
6. Buyer completes demo payment.
7. Admin updates request-deal order status, carrier, and tracking.
8. Buyer views order and tracking.
9. Admin shows moderation, categories, users, requests, and dashboard controls.
