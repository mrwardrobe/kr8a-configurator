# KR8A Build Constitution

## 1. Core Philosophy
- **Apple-Level Design Restraint:** Interfaces must be premium, intuitive, and minimally obtrusive. Use high-quality spacing, subdued borders, and subtle contrast.
- **Stable Architecture:** Prefer determinism and reliability over cleverness or speculative fixes.
- **Minimalism:** Do not add code, libraries, or markup that isn't strictly required.

## 2. Engineering Standards
- **Compile-Safe:** The build must never break. Use strict typing and validate all properties/state.
- **No Advanced Logic Until Stable:** Avoid complex algorithms (e.g., advanced camera framing, physics, complex state machines) until the foundation is proven and robust.
- **No Speculative Fixes:** Address bugs based on observable reality, not guesses.
- **No Extraneous Debug Helpers:** Keep the production code clean. Add debug helpers (like `console.log`, `Box3Helper`, or `AxesHelper`) only when necessary for isolated debugging, and remove them before finalizing the task.

## 3. Visuals
- Use a refined, subtle color palette (off-whites, grays, solid blacks).
- Emphasize typography, white space, and alignment.
- Implement smooth, deliberate transitions, avoiding jarring movements.
