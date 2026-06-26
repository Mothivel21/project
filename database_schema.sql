CREATE TABLE supplier_master (
    supplier_code VARCHAR(50) PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pin_code VARCHAR(20),
    gst_no VARCHAR(20)
);

CREATE TABLE vehicle_master (
    chassis_no VARCHAR(100) PRIMARY KEY,
    engine_no VARCHAR(100) UNIQUE NOT NULL,
    model_code VARCHAR(50),
    model_name VARCHAR(100),
    variant VARCHAR(50),
    color VARCHAR(50),
    hsn_code VARCHAR(50),
    supplier_code VARCHAR(50) REFERENCES supplier_master(supplier_code)
);
