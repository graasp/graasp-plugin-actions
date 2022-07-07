CREATE TABLE "action" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "member_id" uuid REFERENCES "member" ("id") ON DELETE SET NULL,
    "item_id" uuid REFERENCES "item" ("id") ON DELETE SET NULL,
    "member_type" character varying(100),
    "item_type" character varying(100),
    "action_type" character varying(100),
    "view" character varying(100),
    "geolocation" jsonb DEFAULT '{}'::jsonb,
    "extra" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at" timestamp NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE "action_request_export" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "member_id" uuid REFERENCES "member" ("id") ON DELETE CASCADE,
  "item_id" uuid REFERENCES "item" ("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
