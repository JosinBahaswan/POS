-- Migration for Advanced POS Features

-- 1. Customers (CRM)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    loyalty_points INTEGER DEFAULT 0,
    member_tier TEXT DEFAULT 'Silver', -- Silver, Gold, Platinum
    outstanding_debt DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Split Payments & Debt Tracking
-- Assuming transactions table exists, let's create a payment_splits table
CREATE TABLE payment_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    payment_method TEXT NOT NULL, -- cash, qris, debt
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Complex Promotions
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- bogo, bundle, wholesale, happy_hour
    condition_config JSONB NOT NULL, -- e.g. {"buy_qty": 2, "get_qty": 1, "target_product": "uuid"}
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Returns & Refunds
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    reason TEXT NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    return_type TEXT NOT NULL, -- void, defect, exchange
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES returns(id),
    product_id UUID NOT NULL REFERENCES products(id),
    qty INTEGER NOT NULL,
    restock BOOLEAN DEFAULT TRUE
);

-- 5. Suppliers & Purchase Orders
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, received, cancelled
    expected_date DATE,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    qty INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    received_qty INTEGER DEFAULT 0
);
