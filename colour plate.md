---
name: Eranga Management Interface
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#434655'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#525657'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b6e70'
  on-tertiary-container: '#eff1f3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

The design system is anchored in a **Corporate / Modern** aesthetic with subtle **Glassmorphism** accents to signify a forward-thinking, tech-enabled driving school. The platform prioritizes high information density without sacrificing clarity, evoking a sense of security, logistical precision, and professional growth.

The interface utilizes a sophisticated "Layered Clarity" approach: core management tasks are housed in distinct cards, while secondary navigation and informative overlays use frosted glass effects to maintain context. This ensures that administrators, instructors, and students feel they are using a reliable, high-tier educational tool.

## Colors

The palette is built on a foundation of **Primary Blue (#2563eb)** to communicate trust and authority. The background architecture uses a **light gray soft gradient** (transitioning from #F8FAFC to #F1F5F9) to reduce eye strain during long administrative sessions.

- **Primary:** Reserved for call-to-actions, active navigation states, and key progress indicators.
- **Success/Error:** High-visibility tones for booking confirmations and critical alerts.
- **Neutral:** A range of slates used for typography and iconography to ensure WCAG AA accessibility.
- **Backgrounds:** Use subtle gradients instead of flat fills to create a sense of depth and modern airiness.

## Typography

This design system utilizes a dual-font strategy. **Hanken Grotesk** is used for headlines to provide a sharp, contemporary edge that distinguishes the platform from generic enterprise software. **Inter** is utilized for body copy and data labels for its exceptional legibility in complex layouts.

For dashboard data, always prioritize `body-sm` for table rows to maintain high information density. Headers should use `headline-md` for section titles within cards to create a clear visual hierarchy.

## Layout & Spacing

The layout follows a **Fixed Grid** model for desktop, centered within a 1440px container to ensure management tools remain focused and reachable. 

- **Grid:** A 12-column system is used for dashboard layouts.
- **Sidebars:** Fixed at 280px for primary navigation.
- **Cards:** Utilize `lg` (24px) internal padding to maintain a clean, breathable feel.
- **Mobile:** Reflows to a single column with `margin-mobile` (16px) gutters; complex tables should transition to card-based list views for better accessibility.

## Elevation & Depth

Visual hierarchy is established through a combination of **Ambient Shadows** and **Tonal Layers**. 

- **Surface Level 0:** The soft gradient background.
- **Surface Level 1 (Cards):** White background with a soft, diffused shadow (`0px 4px 20px rgba(0, 0, 0, 0.05)`).
- **Surface Level 2 (Modals/Popovers):** Utilizes a **Glassmorphism** effect with a 12px backdrop blur and 80% opacity white fill, edged with a 1px low-contrast border (#E2E8F0).
- **Interactions:** Hover states on cards should subtly increase shadow spread to indicate interactivity without using heavy borders.

## Shapes

The shape language is consistently **Rounded**, reflecting the 12px (0.75rem) radius requested for a friendly yet structured feel.

- **Standard Elements:** Buttons and Input fields use a 0.5rem radius.
- **Containers:** Large cards and dashboard sections use `rounded-lg` (1rem / 16px) to frame content softly.
- **Status Pills:** Small labels or chips use the full pill-shape (999px) to contrast against the more geometric cards.

## Components

### Buttons
Primary buttons use the Primary Blue with white text. Hover states should darken the blue by 10%. Support buttons (Secondary) use a ghost style with a subtle gray border.

### Input Fields
Inputs must have a height of 48px, a 12px border radius, and a 1px border (#D1D5DB). On focus, the border shifts to Primary Blue with a 3px soft outer glow.

### Cards
Cards are the primary container for the "Driving School" modules (e.g., Student List, Schedule). They feature a white background, Level 1 shadow, and 16px corner radius. Card headers should be separated by a subtle 1px divider.

### Chips & Status Indicators
Status indicators for "Lesson Complete" or "Payment Pending" should use highly saturated text on a low-opacity background of the same color (e.g., Success Green text on 10% opacity Green background).

### List Items
Data lists use 64px row heights with thin horizontal dividers. Hover states should apply a very light gray background (#F8FAFC) to guide the eye across data points.

### Role-Based Access Badges
Include a distinct "Admin," "Instructor," or "Student" badge in the navigation header, using the secondary color palette to clarify the user's current context and permissions.