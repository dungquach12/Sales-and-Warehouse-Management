# Revenue Tracker - Sales & Warehouse Management

A simple web app for managing products, customers, orders and sales reporting. Built for a small coffee shop to track inventory and revenue.

## What it does

- **User Management**: login with secure password hashing
- **Product & Category Management**: Create, update, delete products and organize by category
- **Order Management**: Track customer orders and order items with real-time updates
- **Sales Reporting**: View revenue reports with profit margin analysis
- **Dashboard**: Quick overview of sales, products and customer data

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Handlebars templates with vanilla JavaScript
- **Database**: PostgreSQL + Sequelize ORM
- **Auth**: JWT-based login with argon2 password hashing

## Project Structure

```
├── models/           # Database models (User, Product, Order, etc.)
├── controllers/      # Business logic & request handlers
├── routes/           # API and page routes
├── views/            # Handlebars templates
├── html/             # Static assets (CSS, JS, images)
├── migrations/       # Database migrations
├── seeders/          # Demo data
└── config/           # Configuration files
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure database in `config/config.json`

3. Run migrations:
```bash
npx sequelize-cli db:migrate
```

4. Seed demo data (optional):
```bash
npx sequelize-cli db:seed:all
```

5. Start the server:
```bash
npm start
```

Open `http://localhost:3000` in your browser.

## Features in Progress

- Categories management
- Advanced notifications system
- Custom menu configuration
- Warehouse inventory tracking

## Notes

- Session timeout: 20 minutes
- Uses Vietnamese locale for currency formatting
- All passwords are encrypted with bcrypt
