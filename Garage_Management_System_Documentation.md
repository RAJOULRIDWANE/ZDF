# Garage Management System (SYSTME-APPs) - Project Documentation

## 1. Project Overview
This project is a comprehensive **Garage Management System** designed to streamline operations across different roles within an auto repair shop. The system manages the entire workflow from client appointment requests to vehicle diagnosis, repair negotiation, parts management, and final invoicing. 

**Tech Stack:**
- **Backend:** Laravel (PHP)
- **Frontend:** React (JavaScript)

## 2. User Roles
The application uses a Role-Based Access Control (RBAC) system with the following roles:
- **Client**: Can book appointments, view their vehicles, track repair statuses, negotiate prices, and see invoices.
- **Receptionist**: Manages appointments, creates repair tickets, acts as a bridge between clients and mechanics, and handles invoicing.
- **Mechanic**: Diagnoses vehicles, updates repair statuses, requests parts, and logs services performed.
- **Parts Manager**: Manages inventory, processes part requests from mechanics, and tracks low stock.
- **Supervisor**: Has overarching administrative control.

## 3. Database Schema Overview

Below is the detailed structure of all core database tables handling the business logic.

### `users`
Stores all system users and their roles.
- `id`: Primary Key
- `name`, `email`, `password`: Standard credentials
- `role`: Enum (`client`, `receptionist`, `mechanic`, `parts_manager`, `supervisor`)
- `is_verified`: Boolean for email verification

### `vehicles`
Stores vehicles belonging to clients.
- `id`: Primary Key
- `user_id`: Foreign Key linking to `users` (Client)
- `make`, `model`, `year`, `license_plate`: Vehicle details
- `type`: Enum (`car`, `moto`, `truck`, `bus`)

### `appointments`
Handles appointment requests made by clients.
- `id`: Primary Key
- `user_id`: Foreign Key (`users`)
- `vehicle_id`: Foreign Key (`vehicles`)
- `preferred_date`: Requested date
- `description`: Client's issue description
- `status`: Enum (`Pending`, `Approved`, `Declined`)
- `receptionist_notes`: Notes added by the receptionist
- `repair_id`: Links to a repair ticket once approved

### `repairs`
The central hub for tracking a vehicle's repair lifecycle.
- `id`: Primary Key
- `vehicle_id`, `mechanic_id`: Foreign Keys
- `description`: Issue noted by receptionist
- `mechanic_notes`: Technical findings from diagnosis
- `status`: Lifecycle state (e.g., `Pending`, `Diagnosing`, `Estimate Sent`, `Negotiating`, `Approved`, `In Progress`, `Completed`, `Canceled`)
- `is_diagnostic`: Boolean flag for diagnostic requests
- `date_entry`, `date_end`: Timelines
- `cost`, `original_cost`, `discount_amount`: Pricing and discount metrics
- `negotiation_status`, `negotiation_count`: Tracks client-shop price negotiations
- `invoice_number`: Unique invoice identifier once completed

### `services`
Catalog of labor/services provided by the garage.
- `id`: Primary Key
- `name`: Service name (e.g., "Oil Change")
- `zone`: Vehicle zone (e.g., "engine", "wheels")
- `price`: Default cost

### `parts`
Inventory catalog for physical parts.
- `id`: Primary Key
- `name`: Part name
- `zone`: Vehicle zone
- `category`: Part category
- `price`: Sale price
- `stock_quantity`: Current inventory level
- `reference_number`: SKU/Barcode

### `repair_service` (Pivot Table)
Maps multiple services to a single repair ticket.
- `id`: Primary Key
- `repair_id`: Foreign Key (`repairs`)
- `service_id`: Foreign Key (`services`)
- `price_at_booking`: Locks in the service price at the time of the ticket creation

### `part_repair` (Pivot Table)
Maps multiple parts used to a single repair ticket.
- `id`: Primary Key
- `repair_id`: Foreign Key (`repairs`)
- `part_id`: Foreign Key (`parts`)
- `quantity`: Number of parts used
- `price`: Price of the part at the time of use

### `part_requests`
Workflow table for mechanics to request parts from the Parts Manager.
- `id`: Primary Key
- `repair_id`, `mechanic_id`, `part_id`: Foreign Keys
- `quantity`: Requested amount
- `status`: Enum (`Pending`, `Approved`, `Declined`)
- `notes`: Justification or notes

### `invoices`
Handles the billing and payment status for completed repairs.
- `id`: Primary Key
- `repair_id`: Foreign Key (`repairs`)
- `invoice_number`: Unique ID (e.g., INV-2026-001)
- `total_amount`: Final sum
- `paid_amount`: Amount paid so far
- `status`: Enum (`Unpaid`, `Partially Paid`, `Paid`)
- `payment_method`: Cash, Card, etc.
- `due_date`, `paid_at`: Timelines
