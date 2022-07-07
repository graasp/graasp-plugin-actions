ALTER TABLE action
ADD item_path ltree REFERENCES "item" ("path") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE action as a1 SET item_path = 
(SELECT path FROM item WHERE a1.item_id = item.id);

ALTER TABLE action DROP COLUMN item_id;

CREATE INDEX "action_item_path_idx" ON "action" USING gist ("item_path");

CREATE INDEX "action_view_idx" ON action("view");
