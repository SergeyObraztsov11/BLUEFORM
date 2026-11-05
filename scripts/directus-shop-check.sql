DO $$
BEGIN
  IF NOT has_table_privilege('blueform_directus_shop', 'orders', 'SELECT')
    OR NOT has_table_privilege('blueform_directus_shop', 'order_items', 'SELECT') THEN
    RAISE EXCEPTION 'Directus must be able to read orders';
  END IF;
  IF NOT has_table_privilege('blueform_directus_shop', 'products', 'INSERT')
    OR NOT has_table_privilege('blueform_directus_shop', 'product_colorways', 'INSERT')
    OR NOT has_table_privilege('blueform_directus_shop', 'skus', 'UPDATE')
    OR NOT has_table_privilege('blueform_directus_shop', 'media_files', 'INSERT')
    OR NOT has_table_privilege('blueform_directus_shop', 'product_images', 'DELETE') THEN
    RAISE EXCEPTION 'Directus must be able to manage catalog entries';
  END IF;
  IF has_table_privilege('blueform_directus_shop', 'products', 'DELETE')
    OR has_table_privilege('blueform_directus_shop', 'product_colorways', 'DELETE')
    OR has_table_privilege('blueform_directus_shop', 'skus', 'DELETE')
    OR has_table_privilege('blueform_directus_shop', 'media_files', 'DELETE')
    OR has_table_privilege('blueform_directus_shop', 'orders', 'INSERT')
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
