CREATE TABLE "action" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "member_id" uuid REFERENCES "member" ("id") ON DELETE
  SET NULL,
    -- don't remove item - set creator to NULL
    "item_id" uuid REFERENCES "item" ("id") ON DELETE
  SET NULL,
    -- don't remove item - set creator to NULL
    "member_type" character varying(100),
    "item_type" character varying(100),
    "action_type" character varying(100),
    "view" character varying(100),
    "extra" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at" timestamp NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);