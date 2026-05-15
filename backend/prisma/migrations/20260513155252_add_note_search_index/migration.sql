CREATE INDEX note_search_idx
ON "Note"
USING GIN (to_tsvector('english', title || ' ' || content));