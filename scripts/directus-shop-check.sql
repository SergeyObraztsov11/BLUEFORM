DO $$
BEGIN
  IF NOT has_table_privilege('blueform_directus_shop', 'orders', 'SELECT')
    OR NOT has_table_privilege('blueform_directus_shop', 'order_items', 'SELECT') THEN
    RAISE EXCEPTION 'Directus must be able to read orders';
  END IF;
  IF has_table_privilege('blueform_directus_shop', 'orders', 'INSERT')
    OR has_table_privilege('blueform_directus_shop', 'orders', 'UPDATE')
    OR has_table_privilege('blueform_directus_shop', 'orders', 'DELETE')
    OR has_table_privilege('blueform_directus_shop', 'order_items', 'INSERT')
    OR has_table_privilege('blueform_directus_shop', 'order_items', 'UPDATE')
    OR has_table_privilege('blueform_directus_shop', 'order_items', 'DELETE')
    OR has_table_privilege('blueform_directus_shop', 'account', 'SELECT')
    OR has_table_privilege('blueform_directus_shop', 'session', 'SELECT')
    OR has_table_privilege('blueform_directus_shop', 'verification', 'SELECT') THEN
    RAISE EXCEPTION 'Directus has unsafe access to shop data';
  END IF;
END $$;
