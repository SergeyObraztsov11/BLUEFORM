\set ON_ERROR_STOP on
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'blueform_directus_shop', :'directus_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'blueform_directus_shop')
\gexec
SELECT format('ALTER ROLE %I PASSWORD %L', 'blueform_directus_shop', :'directus_password')
\gexec
GRANT CONNECT ON DATABASE blueform TO blueform_directus_shop;
GRANT USAGE, CREATE ON SCHEMA public TO blueform_directus_shop;
GRANT SELECT ON TABLE orders, order_items TO blueform_directus_shop;
\i /directus-shop-check.sql
