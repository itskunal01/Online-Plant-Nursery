**Online Nursery**

A clean, full-stack e-commerce web application for purchasing organically grown plants, seeds, and gardening tools. It features a user-friendly customer shopfront and a secure administrative dashboard.

Key Features

Customer Storefront
- **Secure Authentication**: User sign-up and login using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Dynamic Shop Grid**: Category filtering and item searches in real-time.
- **Quick View Modal**: Immediate product details popup with descriptions and current stock statuses.
- **Cart & Wishlist**: Persistent client-side cart and wishlist (saved in `localStorage`).
- **Checkout Flow**: Checkout forms supporting multiple payment methods  Payment gateway not integrated(COD, UPI, Card).


Admin Panel
- **Metrics Dashboard**: Quick overview of total products, orders, customers, and pending shipments.
- **Product Management**: Real-time CRUD operations (Create, Read, Update, Delete) for catalog items.
- **Order Tracking**: Complete order status workflow (Pending, Shipped, Delivered, Cancelled).
- **Customer Directory**: Customer spending histories and order summaries.

Tech Stack

- **Frontend**: HTML5, Vanilla CSS3, Vanilla JavaScript,
- **Backend**: Node.js, Express.js
- **Database**: MySQL Workbench
- **Security**: JSON Web Tokens (JWT) for session management, Bcrypt for passwords

<img width="1910" height="4410" alt="screencapture-localhost-5001-index-html-2026-06-28-23_00_02" src="https://github.com/user-attachments/assets/38387070-65b9-447a-b955-67c826df8cb6" />

<img width="1910" height="3458" alt="screencapture-localhost-5001-product-html-2026-06-28-23_00_20" src="https://github.com/user-attachments/assets/a05c9f1c-cd72-4e44-9b0e-e41f116f2e9b" />
<img width="1910" height="4071" alt="screencapture-localhost-5001-orders-html-2026-06-28-23_00_56" src="https://github.com/user-attachments/assets/2060b1ce-7a95-43ae-8785-4d93ddfee5cd" />


<img width="1766" height="987" alt="Individual product details" src="https://github.com/user-attachments/assets/a3f18473-ea82-4a3a-816b-7c6806204c87" />
<img width="1877" height="978" alt="order management" src="https://github.com/user-attachments/assets/0e6baed9-a723-4e45-bb9f-e9b934e75b26" />
<img width="1886" height="986" alt="inventory management " src="https://github.com/user-attachments/assets/77a9296b-d02c-49f6-9c5e-9dc45abb575c" />



