CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('IT', 'VENDOR', 'ADMIN')),
    company_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE specifications (
    spec_id SERIAL PRIMARY KEY,
    spec_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    work_items TEXT NOT NULL, -- JSON array
    deliverables TEXT NOT NULL, -- JSON array
    desired_delivery_date DATE,
    delivery_location VARCHAR(200),
    acceptance_conditions TEXT,
    estimate_copies INTEGER DEFAULT 1,
    supplied_items TEXT,
    loaned_items TEXT,
    applicable_standards TEXT,
    special_notes TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estimate_requests (
    request_id SERIAL PRIMARY KEY,
    spec_id INTEGER REFERENCES specifications(spec_id),
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    budget_range_min DECIMAL(15,2),
    budget_range_max DECIMAL(15,2),
    requirements TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'RESPONDED', 'CLOSED')),
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estimate_responses (
    response_id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES estimate_requests(request_id),
    vendor_id INTEGER REFERENCES users(user_id),
    total_amount DECIMAL(15,2) NOT NULL,
    breakdown TEXT,
    delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    validity_period INTEGER NOT NULL, -- days
    notes TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_flows (
    flow_id SERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('SPECIFICATION', 'REQUEST', 'RESPONSE')),
    target_id INTEGER NOT NULL,
    current_step INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_steps (
    step_id SERIAL PRIMARY KEY,
    flow_id INTEGER REFERENCES approval_flows(flow_id),
    step_order INTEGER NOT NULL,
    approver_id INTEGER REFERENCES users(user_id),
    action_type VARCHAR(20) CHECK (action_type IN ('APPROVE', 'REJECT')),
    comments TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attached_files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('SPECIFICATION', 'REQUEST', 'RESPONSE')),
    target_id INTEGER NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    blob_url VARCHAR(500),
    uploaded_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_specifications_created_by ON specifications(created_by);
CREATE INDEX idx_specifications_status ON specifications(status);
CREATE INDEX idx_estimate_requests_spec_id ON estimate_requests(spec_id);
CREATE INDEX idx_estimate_requests_created_by ON estimate_requests(created_by);
CREATE INDEX idx_estimate_requests_status ON estimate_requests(status);
CREATE INDEX idx_estimate_responses_request_id ON estimate_responses(request_id);
CREATE INDEX idx_estimate_responses_vendor_id ON estimate_responses(vendor_id);
CREATE INDEX idx_approval_flows_target ON approval_flows(target_type, target_id);
CREATE TABLE approval_history (
    history_id SERIAL PRIMARY KEY,
    flow_id INTEGER REFERENCES approval_flows(flow_id),
    step_number INTEGER NOT NULL,
    approver_id INTEGER REFERENCES users(user_id),
    action VARCHAR(20) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approval_steps_flow_id ON approval_steps(flow_id);
CREATE INDEX idx_approval_history_flow_id ON approval_history(flow_id);
CREATE INDEX idx_attached_files_target ON attached_files(target_type, target_id);

INSERT INTO users (username, email, password_hash, full_name, department, position, user_type, is_active)
VALUES ('admin', 'admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', '管理者', 'IT企画部', '部長', 'ADMIN', TRUE);
