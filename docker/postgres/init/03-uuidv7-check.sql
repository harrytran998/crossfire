DO $$
BEGIN
  IF to_regprocedure('uuidv7()') IS NULL THEN
    RAISE EXCEPTION 'PostgreSQL runtime does not expose uuidv7(); PostgreSQL 18+ is required';
  END IF;
END;
$$;
