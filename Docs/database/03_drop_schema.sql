-- =====================================================================
-- Innov'Events
-- Suppression du schéma métier PostgreSQL de démonstration
--
-- Usage :
--   - À exécuter uniquement sur la base PostgreSQL de démonstration
--   - Supprime les tables métier dans l'ordre inverse des dépendances
-- =====================================================================

BEGIN;

DROP TABLE IF EXISTS reviews_review;
DROP TABLE IF EXISTS crm_note;
DROP TABLE IF EXISTS crm_quoteitem;
DROP TABLE IF EXISTS crm_quote;
DROP TABLE IF EXISTS bookings_booking;
DROP TABLE IF EXISTS events_event;
DROP TABLE IF EXISTS crm_clientprofile;
DROP TABLE IF EXISTS crm_prospect;
DROP TABLE IF EXISTS accounts_user;

COMMIT;