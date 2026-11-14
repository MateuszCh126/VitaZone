# Furgonetka shipping adapter

This credential-gated adapter defaults to the Furgonetka sandbox host and currently supports service discovery and price calculation. It checks that returned service IDs belong to the requested InPost/DPD carrier and Furgonetka account. It does not create a shipment/package, request a pickup, or fetch labels, and it is not connected to the checkout/payment webhook flow.

Shipping quotes fail closed unless the selected service ID belongs to the requested InPost/DPD carrier and has `owner: furgonetka` in the account's configured services. The shipping service only accepts categories with an approved standard parcel profile and deliberately excludes live animal and feeder-insect categories. Callers derive category and package data server-side from the product catalog; do not trust a browser-supplied category.

Set `FURGONETKA_ACCESS_TOKEN` through the deployment secret manager after the account and carrier service agreements are configured. Requests have a default 10-second deadline; `FURGONETKA_TIMEOUT_MS` can set another positive duration. The token remains server-side. The API host is currently fixed to the sandbox URL in code; there is no `FURGONETKA_API_BASE_URL` setting, production host adapter, label flow, or shipment creation implementation. No credentials are stored here.
