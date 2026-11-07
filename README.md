# HeyCileng Agtech

An agricultural by-product marketplace connecting suppliers (farmers, cooperatives, and agro-processors) with businesses that use agricultural by-products as raw materials.

HeyCileng provides a digital marketplace where suppliers can showcase agricultural by-products and buyers can discover, purchase, and source raw materials more efficiently.

The platform is built as a **full-stack application**, featuring a React frontend and a TypeScript backend, with Supabase powering backend and posgreSQL database infrastructure and Paystack handling payment processing.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Lucide Icons
- Recharts
- clsx
- Bricolage Grotesque + Public Sans (self-hosted fonts)

### Backend
- TypeScript
- Supabase (Backend Infrastructure)
- Supabase Database
- Paystack (Payment Integration)

## Architecture

HeyCileng follows a frontend-backend architecture:

- **Frontend:** Handles the user interface, navigation, dashboards, and marketplace interactions.
- **Backend:** Handles server-side business logic and application operations using TypeScript.
- **Supabase:** Provides backend infrastructure and data management.
- **Paystack:** Handles payment processing and transaction integration.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone 
cd 

Further folders (`types/`, `services/`, `fixtures/demo/`, `features/`) are added as each phase introduces them.

## Theming

Semantic colour tokens (`bg-surface`, `text-muted`, `bg-primary`, `bg-action`, `bg-accent-soft`, …) and switch with `data-theme="dark"` on `<html>`. Brand scales `forest-*`, `leaf-*`, `ochre-*` and `cream-*` are also available.

## Backend status

Supabase authentication, database and Paystack payments are fully connected. The UI talks to service interfaces, so a real backend can replace the demo adapters without touching pages. there are no demo records.
