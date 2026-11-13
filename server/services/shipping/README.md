# Furgonetka shipping adapter

This credential-gated adapter speaks to the documented Furgonetka REST API. It defaults to the official sandbox host and supports service discovery, price calculation, and creating an unsubmitted package draft. It does not order a shipment, request a pickup, or fetch labels.

The package creation method fails closed unless every order item has a trusted `categorySlug` matching one of the accessory-only category slugs. It deliberately excludes live animal and feeder-insect categories. Callers must derive this classification server-side from the product catalog; do not trust a browser-supplied category. The adapter is not connected to checkout or payment webhooks.

Set `FURGONETKA_ACCESS_TOKEN` through the deployment secret manager and optionally `FURGONETKA_API_BASE_URL` to the official production host after sandbox/account setup. The token must be provisioned using the registered Furgonetka OAuth application and kept server-side. No credentials are stored here.
