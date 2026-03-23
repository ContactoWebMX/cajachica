mysql -u root induwell_caja_chica -e "
SELECT id, user_id, amount_requested, amount_approved, status, type FROM advances ORDER BY id DESC LIMIT 5;
SELECT id, user_id, amount, status, advance_id FROM expenses ORDER BY id DESC LIMIT 5;
"
