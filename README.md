# Retargeting Clients - Yousuf Rice Call Center

A Next.js 16 application for call center agents to retarget existing and WordPress customers, track calls, and place orders.

## Features

- **Unified Customer View**: Merges WordPress customer data (3000+ customers) with current website customers by phone number
- **CSV Upload**: Import WordPress customer CSV with columns: email, phone, first_name, last_name, ct, value
- **Real-time Data**: Reads current customer orders and history from the existing Appwrite database
- **Call Logging**: Track calls with response types (answered & ordered, interested, not interested, callback later, no answer, wrong number, DND, not reachable)
- **Order Placement**: Agents can place orders on behalf of customers
- **Dashboard**: Stats on customers, calls, orders, and retargeting candidates

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Appwrite (TablesDB)
- Lucide React icons

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `env.example` to `.env` and fill in all values:

```bash
cp env.example .env
```

Required env vars:
- `APPWRITE_API_KEY` - Server API key
- `NEXT_PUBLIC_APPWRITE_RETARGETING_DATABASE_ID` - New database ID for this project
- `NEXT_PUBLIC_APPWRITE_WORDPRESS_CUSTOMERS_TABLE_ID`
- `NEXT_PUBLIC_APPWRITE_CALL_LOGS_TABLE_ID`
- `NEXT_PUBLIC_APPWRITE_AGENT_ORDERS_TABLE_ID`
- `NEXT_PUBLIC_APPWRITE_CAMPAIGNS_TABLE_ID`

The existing website credentials are already pre-filled in env.example.

### 3. Create Appwrite tables

In your Appwrite project:
1. Create a new Database for retargeting
2. Create these tables with the attributes listed in `scripts/setup-appwrite.ts`:
   - `wordpress_customers` (email, phone, first_name, last_name, city, value)
   - `call_logs` (customer_phone, customer_name, agent_name, response_type, notes, follow_up_date, order_placed, order_id)
   - `agent_orders` (customer_phone, customer_name, address, city, items, total_price, status, agent_name, notes)
   - `campaigns` (name, description, target_city, min_value, max_value, status, created_by)
3. Add a `phone` index on both `wordpress_customers` and `call_logs` tables for performance

Or run the setup script (with .env loaded):
```bash
npx tsx scripts/setup-appwrite.ts
```

### 4. Upload WordPress customers

Go to `/upload` in the app and drag your `output.csv` file. The CSV parser handles the format from your existing Meta export.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats, top customers, retargeting candidates |
| `/customers` | Search all customers by phone/name/email/city |
| `/customers/:phone` | Customer detail with order history, call log, place order |
| `/calls` | Call center view: today's calls, response breakdown, follow-ups |
| `/orders` | All agent orders with status management |
| `/upload` | Upload WordPress customer CSV |

## Data Architecture

This app connects to **two databases** in the same Appwrite project:
1. **Existing Database** (read-only): customers, orders, order_items, addresses, products
2. **Retargeting Database** (read/write): wordpress_customers, call_logs, agent_orders, campaigns

Phone number is the universal key linking WordPress customers to website customers.

## Git

Git is initialized. Make your first commit after configuring `.env`:

```bash
git add .
git commit -m "Initial retargeting setup"
```
