# Design System Strategy: The Tactile Authority

## 1. Overview & Creative North Star

**Creative North Star: The Precision Architect**
In the high-pressure environment of retail and hospitality, a Point of Sale system must be more than "clean"—it must be authoritative. This design system rejects the "flat and generic" SaaS aesthetic in favor of **The Precision Architect**: a UI that feels built rather than drawn. We achieve this through a "High-End Editorial" lens, utilizing expansive white space, intentional asymmetry in information density, and a sophisticated layering of surfaces that mimics physical, high-quality materials.

By moving away from traditional grid-bound boxes and toward a fluid, layered experience, we provide the user with a sense of calm and control. We are not just processing transactions; we are facilitating professional exchange.

---

## 2. Colors & Surface Philosophy

The palette is rooted in deep, authoritative teals (`primary`) and success-driven greens (`secondary`), anchored by a sophisticated range of cool-toned neutrals.

### The "No-Line" Rule
To achieve a premium feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through background color shifts. For example, a transaction summary module should be rendered in `surface-container-low` sitting directly on a `surface` background. The transition of tone creates the edge, not a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to create nested depth:
*   **Base Layer:** `surface` (#f7f9ff)
*   **Secondary Content Areas:** `surface-container-low` (#f1f4fa)
*   **Interactive Cards/Modules:** `surface-container-lowest` (#ffffff) for maximum "lift" and clarity.
*   **Elevated Overlays:** `surface-bright` (#f7f9ff) with backdrop blurs.

### The "Glass & Gradient" Rule
For floating action buttons or high-priority modals (like "Complete Sale"), utilize Glassmorphism. Use semi-transparent variants of `primary` with a `backdrop-blur` of 20px to 40px. 
*   **Signature Textures:** Main CTAs should not be flat. Apply a subtle linear gradient from `primary` (#004d64) to `primary-container` (#006684) at a 135-degree angle to give buttons a "milled" metallic depth.

---

## 3. Typography: The Editorial Edge

We pair the technical precision of **Inter** with the architectural character of **Manrope**.

*   **Display & Headlines (Manrope):** Use `display-lg` through `headline-sm` for high-impact numbers (Total Due, Unit Price). Manrope’s geometric structure provides an "editorial" feel that commands attention in a busy store.
*   **Functional Text (Inter):** All system-critical information (SKUs, Customer Names, Labels) uses Inter. It is optimized for legibility at small scales (`body-sm` at 0.75rem) and ensures high-speed readability.
*   **The Contrast Rule:** To maintain the "Professional" feel, always pair `on-surface-variant` (#3f484d) for secondary labels with `on-surface` (#181c20) for primary data. This creates a clear hierarchy without needing bold weights.

---

## 4. Elevation & Depth

We eschew "Standard UI" shadows in favor of **Tonal Layering** and **Ambient Light Physics**.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift. 
*   **Ambient Shadows:** Where floating elements (like Modals or Tooltips) are required, use extra-diffused shadows.
    *   *Spec:* `offset-y: 8px`, `blur: 24px`, `color: rgba(24, 28, 32, 0.06)`. Note the use of the `on-surface` color for the shadow tint—never use pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., input fields), use `outline-variant` (#bfc8cd) at **20% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Apply to the Navigation Bar and Top App Bar. Use `surface` at 80% opacity with a blur effect to allow product images or list items to bleed through softly as the user scrolls.

---

## 5. Component Guidelines

### Buttons (High-Impact Action)
*   **Primary:** Gradient-filled (`primary` to `primary-container`), `md` (0.75rem) rounded corners. Padding: `spacing-4` (0.9rem) vertical, `spacing-8` (1.75rem) horizontal.
*   **Secondary:** `surface-container-highest` background with `on-primary-fixed-variant` text. No border.

### Input Fields (The Data Entry Hub)
*   **Structure:** Forgo the box. Use a `surface-container-low` background with a `DEFAULT` (0.5rem) corner radius. 
*   **State:** On focus, transition the background to `surface-container-lowest` and apply a 1px "Ghost Border" using `primary` at 30% opacity.

### Cards & Lists (Transaction Logic)
*   **Zero-Divider Policy:** Never use horizontal lines to separate items in a cart. Use `spacing-3` (0.6rem) of vertical whitespace and alternating tonal shifts (`surface` vs `surface-container-low`) if high density is required.
*   **Interactive List Items:** On tap/press, the item should scale slightly (98%) and shift to `surface-container-highest`.

### Contextual POS Components
*   **The "Numpad":** Keys should be `surface-container-lowest` with `headline-md` typography. Use `spacing-2` (0.4rem) gaps to ensure no accidental presses.
*   **Status Badges:** Use `secondary-container` (#a0f399) with `on-secondary-container` (#217128) text for "Paid" or "Completed" statuses. Use `xl` (1.5rem) pill-shaped rounding.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `spacing-10` to `spacing-16` for page margins to create a "Gallery" feel for product displays.
*   **Do** use `tertiary` (#6b3a00) for "Hold" or "Pending" actions to provide a sophisticated warm contrast to the teal/blue primary theme.
*   **Do** prioritize high-contrast typography (`on-surface` on `surface-container-lowest`) for all pricing information.

### Don't
*   **Don't** use 100% opaque black for text. It feels "cheap." Stick to `on-surface` (#181c20).
*   **Don't** use "Alert Red" for everything. Reserve `error` (#ba1a1a) for destructive actions (Void Sale). For "Remove Item," use a subtle `outline` color.
*   **Don't** use hard corners. Even in a "Professional" setting, the `md` (0.75rem) and `lg` (1rem) radii communicate modern accessibility and reduce visual fatigue.