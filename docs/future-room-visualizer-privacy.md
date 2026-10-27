# Future room visualizer — privacy and security design

This is a design constraint document, not an implemented or activated upload/AI feature. There is no upload UI, photo bucket, AI call or image generation endpoint in this task.

## Data boundary

A room photo can reveal people, faces, addresses, possessions, documents or location. Do not assume an empty room is anonymous. Explain the intended processing before upload, suggest removing people/personal documents, and ask the user to confirm they may use the image. Keep image processing consent/terms separate from marketing or optional measurement. Review lawful basis, provider terms and whether a DPIA is needed before implementation.

## Proposed flow

1. An authenticated session (or a tightly scoped, short-lived guest session) requests an upload authorisation from a same-origin server route. Apply per-user/IP quotas and cost limits before issuing it.
2. Upload into **private** object storage. Use random object IDs; never emails, customer names or original filenames in URLs. Signatures must be scoped to one object, permitted MIME/size and a short expiry. Deny public listing/anonymous reads. Keep originals and generated results private by default.
3. Validate the uploaded file on the server: byte signature, allowed raster format, decoded dimensions/pixel count, byte limit and safe decoder. Reject SVG/HTML/archives/polyglots; decode/re-encode to remove EXIF/GPS and embedded metadata. Apply scanning and decompression safeguards. Do not trust client MIME or filename.
4. Queue processing with a bounded retry count and idempotency key. The server reads the private object and uses only an approved image provider under an appropriate processor agreement, retention/training policy and UK transfer review. Never log image bodies, prompts containing personal details, signed URLs or provider secrets. No provider browsing/tools should follow text instructions found in a photo.
5. Return results through authorisation checks or short-lived read URLs for that same session. Check object ownership on every access and deletion; use unguessable IDs as a supplement, not the only access control. No public gallery or provider-public URL fallback.
6. Show a concept-visualisation label. Do not treat inferred room dimensions or generated furniture as manufacturing truth. Measurements must be separately entered, confirmed and validated through the existing product rules before any future order.

## Retention, deletion and reporting

A proposed default is deletion of originals/results within 24 hours unless the user explicitly saves to a future account feature with a clearly stated term. This requires enforced storage lifecycle rules, queue cleanup and provider deletion support, including failed jobs. Provide a visible delete action, check backup/provider limits and record only a minimal job-state audit. A retention promise must not ship until tested.

Analytics may record only finite events such as `visualizer_started` or `visualizer_completed` after optional consent. Do not include images, prompt text, dimensions, object IDs, signed URLs, room contents, addresses or identity in event properties. Provider usage/cost reporting should use internal random job IDs with restricted access, separate from visitor analytics.

## Release evidence required

Test anonymous/other-user access denial, expired links, malformed/oversized inputs, SSRF/path traversal, EXIF removal, abusive retries, quota/cost limits, deletion after success/failure and provider failure. Review keyboard/mobile accessibility, privacy copy, DPIA outcome, contracts and UK transfers with the owner. Obtain explicit approval before activating the feature or paying for its processing.
