# Fit Pro commerce: screens, flow, and production plan

## Included in this iteration

- `/shop` is a responsive catalog backed by active coaching packages. Customers can add packages to a browser-session cart or continue directly to the existing authenticated intake and checkout flow.
- `/cart` reviews the selected packages. Completing each selection routes through OTP login, the coaching intake form, and the existing Zibal payment endpoint.
- `/checkout` is a separately labeled UI-only demo checkout with customer/address fields, line-item totals, free digital-service delivery, dummy card fields, simulated success/failure, and an in-memory order view. It does not send its fields to any server or retain card data.
- `/demo-checkout` is a separate, loudly labeled UI simulation. Its Pay action changes component state only: it makes no API call, creates no order/payment record, and cannot mark a real order paid.
- `/manual-transfer` shows the requested receiving-card instruction as a clearly labeled UI preview with `Pending verification`; it has no receipt upload or payment-recording endpoint until the secure review workflow described below is implemented.
- Login now offers an explicit consent checkbox to save a number in this browser and a separate user-triggered button to reveal it. The site does not read a number from the device.
- With `OTP_DEMO_MODE=true` and `NODE_ENV=development`, the OTP endpoint issues a hashed, expiring, rate-limited test code and returns it for the UI preview. In every other configuration the route uses the SMS provider and never returns an OTP. Verification still runs through the server and the existing secure session flow.
- Existing server-side OTP verification (expiry, attempt/send throttling, hashed code), secure session cookie, Zibal verification callback, and dashboard order/payment history remain the live flow.

## Screen designs and customer journey

1. **Catalog (`/shop`)** — RTL product cards with duration, deliverables, price, add-to-cart and order actions, plus a clear statement that real online payments are verified by the server.
2. **Product details** — package details and the existing intake form (`/dashboard/requests/new?package=…`) collects age, height, weight, training experience, goals, injuries, and health consent after login.
3. **Cart (`/cart`)** — session-scoped selected packages, remove actions, total, and a route to complete an authenticated order. The current backend supports one coaching package per request, so multi-item cart entries complete separately.
4. **OTP login (`/login`)** — enter a mobile number; optionally request browser-local storage with consent; reveal the saved value only after a separate click; enter the server-issued OTP.
5. **Live checkout** — the existing request is created server-side; Zibal redirects the customer to the provider. The callback verifies the transaction and exact amount server-to-server before changing payment status to Paid. A query parameter or client-side redirect cannot mark an order paid.
6. **Order history (`/dashboard`)** — authenticated customers see request, payment, and delivered-plan status. Pending and failed payments are distinct from paid.
7. **Demo checkout (`/demo-checkout`)** — large persistent English warning “DEMO / TEST PAYMENT — NO REAL MONEY TRANSFER.” Simulated success also explicitly says no money moved and no real order was created.

## Component structure

- `src/app/shop/page.tsx`: server-rendered package catalog.
- `src/app/cart/page.tsx` and `src/components/shop-cart.tsx`: browser-session cart, catalog actions, and isolated no-write demo simulation.
- `src/app/demo-checkout/page.tsx`: demo-only route.
- `src/components/login-form.tsx`: OTP UI and consent-gated browser-local number.
- Existing `src/app/api/auth/otp`, `src/app/api/auth/verify`, `src/app/api/payments`, and `src/app/api/payments/callback` remain the live authentication/payment boundary.
- Existing `src/app/dashboard/page.tsx` is the private order history. `src/app/admin/payments/page.tsx` is the owner-only transaction view.

## Payment options and remaining production work

- **Live gateway:** Zibal is already wired into the coaching purchase path. Configure the production merchant key and canonical HTTPS callback/site URL. Keep amounts sourced from the database, use idempotent callback processing, and record `PAID` only after provider verification. Test gateway status codes, duplicate callbacks, amount mismatch, and provider timeouts before launch.
- **Manual card transfer:** Do not treat a submitted screenshot as proof of payment. Before enabling this option, add a `CardTransfer` record linked to the order with `PENDING_VERIFICATION`, private receipt object-storage key, MIME/size limits, timestamps, and reviewer audit fields. The customer UI should show the requested receiving-card instructions and allow an optional receipt upload; order history must continue to show “Pending verification.” Only an authenticated owner-admin action after independently checking the bank transaction may atomically approve the transfer and mark the related order paid. A rejected transfer must remain unpaid. Protect uploaded receipts from public access and malware, and never store card security codes or customer full card details.
- The receiving card details should be configured outside source control (for example, server environment variables) and rendered only on the transfer instruction screen. Do not collect a customer's card number, expiry, or CVV.
- For multi-item orders, implement a first-class `Order` and `OrderItem` schema with immutable price snapshots. The current coaching `CoachingRequest` model prices one package per request, so the cart deliberately completes each package separately for now.

## Recommended backend and data model

- Keep Next.js route handlers as the application API, PostgreSQL/Prisma for durable records, the current SMS provider for OTP delivery, and Zibal as the live gateway.
- Add `Order(id, userId, status, currency, totalRials, createdAt, updatedAt)`, `OrderItem(orderId, packageId, titleSnapshot, unitPriceRials, quantity)`, and `Payment(orderId, method, status, amountRials, providerRef, verifiedAt)` when moving from coaching requests to general merchandise. Suggested payment methods: `GATEWAY`, `CARD_TRANSFER`, and a demo path that is not persisted as a payment.
- Store gateway request/verification identifiers and minimal provider metadata. Never accept the amount or paid status from the browser. Apply database transactions and uniqueness/idempotency keys around order creation and payment callbacks.
- Keep sensitive health intake encrypted and access-controlled as in the existing request flow. Use least-privilege admin checks, CSRF/same-origin checks, HTTPS-only secure HTTP-only session cookies, OTP expiration/attempt limits, per-phone and per-IP throttles, audit logs, backups, and secret rotation.
- The cart is currently session-scoped to avoid trusting client-supplied price data: the server must reload package IDs and current prices when it creates any real order.

## Deployment checklist

1. Configure production `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PHONE`, SMS credentials/template, Zibal merchant key, and canonical HTTPS site URL through the hosting secret manager.
2. Apply reviewed Prisma migrations and deploy the Next.js app behind HTTPS. Set provider callback URL to the production API callback.
3. Verify OTP expiry and throttling, unauthorized access, duplicate callbacks, amount mismatch, pending/failure states, and order ownership.
4. Keep demo mode visibly separate and unavailable as a real settlement path. Confirm its route has no write-capable calls and monitor production logs for attempts to use it as real payment.
5. Implement card-transfer persistence and owner review UI before advertising card transfer as an available payment method.
