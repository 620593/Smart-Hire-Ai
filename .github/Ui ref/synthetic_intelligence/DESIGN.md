---
name: Synthetic Intelligence
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#adc6ff'
  on-tertiary: '#002e6a'
  tertiary-container: '#005cc6'
  on-tertiary-container: '#cedbff'
  error: '#F43F5E'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  success: '#10B981'
  warning: '#F59E0B'
  slate-50: '#F8FAFC'
  slate-400: '#94A3B8'
  slate-800: '#1E293B'
  electric-blue: '#60A5FA'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
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
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system is built for a high-stakes, AI-driven professional environment. It draws inspiration from the precision of developer tools and the polish of modern fintech platforms. The visual narrative centers on **Sophisticated Intelligence**—merging the cold efficiency of AI with a warm, empathetic user experience.

The style is **Modern Corporate with Glassmorphism**. It utilizes a "Dark Mode First" philosophy, featuring deep slate backgrounds, high-contrast typography, and vibrant electric accents. Surfaces are defined by subtle translucency and microscopic borders rather than heavy shadows, creating an interface that feels lightweight yet structurally sound. The overall aesthetic should evoke a sense of calm authority and technological edge.

## Colors
The palette is rooted in a deep **Slate** foundation to provide a premium "pro-tool" feel. The primary **Indigo-600** is used for main actions, while **Secondary Purple** is reserved for AI-specific features and "magic" moments.

- **Primary & Secondary:** Use Indigo for functional navigation and Purple for generative AI interactions.
- **Accents:** High-saturation Emerald, Amber, and Rose are used sparingly for status indicators and destructive actions.
- **Neutrals:** A tight range of Slates. Use `slate-800` for cards and `slate-400` for secondary text.
- **Backgrounds:** In dark mode, use the base neutral `#0F172A`. In light mode (if implemented), use `#FAFAFA` with Indigo-900 text.

## Typography
This design system employs a three-tier font strategy:
1. **Display/Headlines (Geist):** Used for impactful titles and section headers. Its tight tracking and geometric construction feel modern and precise.
2. **Body (Inter):** The workhorse for all candidate data, feedback notes, and descriptions. It ensures maximum legibility across all resolutions.
3. **Labels/Technical (JetBrains Mono):** Used for metadata, AI confidence scores, timestamps, and status badges to reinforce the technical/AI nature of the platform.

Keep line heights generous for body text to maintain an "empathetic" and breathable reading experience during long assessments.

## Layout & Spacing
The layout follows a **Strict 8px Grid** system to ensure mathematical harmony. 

- **Grid Model:** 12-column fluid grid for desktop with 24px gutters. On tablet, switch to an 8-column grid. On mobile, use a 4-column grid.
- **Rhythm:** Internal component spacing should use `sm` (8px) or `md` (16px). Section margins should use `xl` (32px) or `64px`.
- **Max Width:** Content should be capped at 1280px for optimal readability of assessment data, centered within the viewport.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Glassmorphism** rather than traditional drop shadows.

- **Base Level (Level 0):** Background color `#0F172A`.
- **Surface Level (Level 1):** Cards and main UI containers use a slightly lighter slate (`#1E293B`) with a 1px border of `white/10%`.
- **Overlay Level (Level 2):** Modals and dropdowns use a background blur (20px) with a semi-transparent slate fill (`rgba(30, 41, 59, 0.8)`). 
- **Shadows:** When used, shadows must be "Ambient"—very large blur radius (32px+), low opacity (15%), and tinted with the primary Indigo color to avoid a "dirty" look.

## Shapes
The shape language is **Rounded**, balancing professional structure with approachable softness.

- **Standard Elements:** Buttons, inputs, and small cards use a **12px** (rounded) radius.
- **Large Containers:** Dashboard widgets and main content areas use a **16px** (rounded-lg) radius.
- **Status Elements:** Badges and AI "pills" use a fully rounded/circular radius to distinguish them from functional buttons.

## Components

- **Buttons:** 
  - *Primary:* Solid Indigo-600 with white text. 
  - *AI Action:* Gradient from Indigo-600 to Purple-500.
  - *Secondary:* Ghost style with 1px border and subtle hover fill.
- **Inputs:** 
  - Use `slate-800` backgrounds with a 1px `white/10%` border. 
  - On focus, the border transitions to Primary Indigo with a 2px outer "glow" (not shadow).
- **Cards:** 
  - Should have a subtle inner highlight on the top edge to simulate light hitting the edge. 
  - Padding should be a consistent 24px (`lg`).
- **Progress Bars:** 
  - Thin 4px height. Track is `slate-800`, indicator is a gradient of Primary/Secondary. 
  - Use success/error colors for specific assessment outcomes.
- **Badges:** 
  - Small, uppercase JetBrains Mono text. 
  - Low-opacity background fills (15% of the accent color) with 100% opacity text for high legibility.
- **AI Feedback Cards:** 
  - Feature a subtle 2px left-border accent in Purple-500 to denote machine-generated content.