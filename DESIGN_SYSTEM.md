# Mamba Widget Design System

This document outlines the design system for the Mamba widget, encompassing the foundational visual identity and component specifications.

## 1. Core Foundations

### 1.1 Color Palette
The Mamba palette is built around nature-inspired greens and soft, neutral backgrounds.

| Variable | Hex/RGBA | Usage |
| :--- | :--- | :--- |
| `--mamba-body` | #C7E8C4 | Surface/Background |
| `--mamba-soft` | #D9F2D3 | Secondary Surfaces |
| `--mamba-leaf` | #4A7B4F | Brand/Action |
| `--mamba-leaf-dark`| #3E6B3F | Active/Pressed State |
| `--mamba-accent` | #5C8A5A | Accent |
| `--mamba-deep` | #2F4D2F | Primary Text |
| `--mamba-text` | #2B2B2B | Secondary Text |
| `--mamba-creme` | #F7F4E8 | Card Background |

### 1.2 Typography
*   **Font Family:** 'Inter', system-ui, -apple-system, sans-serif
*   **Font Weights:** 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold), 800 (Extra-bold)

### 1.3 Spacing & Radius
*   **Border Radius (Large):** 32px (`--radius-lg`)
*   **Border Radius (Medium):** 18px (`--radius-md`)
*   **Spacing Units:** Based on 4px grid (e.g., 4px, 8px, 12px, 16px, 24px)

### 1.4 Shadows
*   **Soft:** 0 10px 30px rgba(47, 77, 47, 0.12)
*   **Hover:** 0 15px 45px rgba(47, 77, 47, 0.2)

---

## 2. Component Specifications

### 2.1 Widget Container
*   **Background:** `--bg-card` (rgba(247, 244, 232, 0.9))
*   **Blur:** `backdrop-filter: blur(25px)`
*   **Border:** 1px solid rgba(255, 255, 255, 0.5)

### 2.2 Buttons
*   **Primary (`.primary-btn`):** High-contrast, brand-colored action button.
    *   Background: Linear gradient (`--mamba-leaf` to `--mamba-accent`)
    *   Radius: 12px
*   **Chip (`.chip`):** Utility/Toggle button.
    *   Background: `--mamba-soft`
    *   Radius: 999px

### 2.3 Tasks
*   **Container:** Grid layout, 14px padding, white background.
*   **Category Indicator:** Left border based on category (Study, Work, Personal).

### 2.4 Inputs
*   **Text/Time/Select:** 12px border radius, 1px subtle border, white background.

---

## 3. Implementation Guidelines
Refer to `style.css` for the complete CSS variable declarations. Maintain consistency by utilizing existing CSS variables (`--mamba-*`, `--radius-*`, `--shadow-*`) rather than hardcoding values.
