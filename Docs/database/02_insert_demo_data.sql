-- =====================================================================
-- Innov'Events
-- Jeu de données de démonstration
--
-- Prérequis :
--   - Exécuter d'abord 01_create_schema.sql
--   - Utiliser uniquement une base PostgreSQL de démonstration
-- =====================================================================

BEGIN;

-- 1. Utilisateurs
INSERT INTO accounts_user (
    id, password, last_login, is_superuser, username, first_name, last_name,
    email, is_staff, is_active, date_joined, role, must_change_password
)
VALUES
(
    1, '!mot-de-passe-inutilisable-demo', NULL, TRUE, 'admin.demo',
    'Alice', 'Martin', 'alice.martin@innovevents.test',
    TRUE, TRUE, '2026-01-05 09:00:00+00', 'ADMIN', FALSE
),
(
    2, '!mot-de-passe-inutilisable-demo', '2026-07-15 08:30:00+00', FALSE,
    'employe.demo', 'Thomas', 'Bernard',
    'thomas.bernard@innovevents.test',
    TRUE, TRUE, '2026-02-10 10:00:00+00', 'EMPLOYEE', FALSE
),
(
    3, '!mot-de-passe-inutilisable-demo', '2026-07-16 14:20:00+00', FALSE,
    'client.demo', 'Sophie', 'Durand',
    'sophie.durand@example.test',
    FALSE, TRUE, '2026-03-12 11:15:00+00', 'CLIENT', FALSE
);

-- 2. Profil client
INSERT INTO crm_clientprofile (
    id, user_id, company, phone, address
)
VALUES (
    1, 3, 'Durand Conseil', '+33 6 12 34 56 78',
    '12 rue des Lilas, 69003 Lyon'
);

-- 3. Prospect
INSERT INTO crm_prospect (
    id, first_name, last_name, email, phone, company, city, message,
    event_type, desired_date, participant_count, status, created_at
)
VALUES (
    1, 'Julien', 'Morel', 'julien.morel@example.test',
    '+33 6 98 76 54 32', 'Morel Industries', 'Grenoble',
    'Organisation d''un séminaire annuel pour les équipes commerciales.',
    'SEMINAR', '2026-10-15', 80, 'QUALIFIED',
    '2026-07-01 09:30:00+00'
);

-- 4. Événement
INSERT INTO events_event (
    id, title, description, city, start_at, end_at, capacity, event_type,
    theme, image, status, visible, client_agreed, organizer_id, client_id,
    created_at
)
VALUES (
    1,
    'Conférence Transformation Numérique',
    'Conférence professionnelle consacrée à la transformation numérique des PME.',
    'Lyon',
    '2026-09-20 08:30:00+00',
    '2026-09-20 17:30:00+00',
    150,
    'CONFERENCE',
    'Innovation et numérique',
    NULL,
    'ACCEPTED',
    TRUE,
    TRUE,
    2,
    3,
    '2026-06-10 10:00:00+00'
);

-- 5. Réservation
INSERT INTO bookings_booking (
    id, user_id, event_id, quantity, status, created_at
)
VALUES (
    1, 3, 1, 2, 'CONFIRMED', '2026-07-05 14:00:00+00'
);

-- 6. Devis client
INSERT INTO crm_quote (
    id, client_id, prospect_id, status, tva_rate, created_at
)
VALUES (
    1, 3, NULL, 'ACCEPTED', 0.20, '2026-06-12 09:00:00+00'
);

-- 7. Devis prospect
INSERT INTO crm_quote (
    id, client_id, prospect_id, status, tva_rate, created_at
)
VALUES (
    2, NULL, 1, 'SENT', 0.20, '2026-07-03 15:30:00+00'
);

-- 8. Lignes de devis
INSERT INTO crm_quoteitem (
    id, quote_id, label, amount_ht
)
VALUES
(1, 1, 'Location de la salle de conférence', 1800.00),
(2, 1, 'Prestation technique audiovisuelle', 950.00),
(3, 1, 'Accueil café pour 100 participants', 600.00),
(4, 2, 'Organisation du séminaire', 2400.00),
(5, 2, 'Restauration pour 80 participants', 3200.00);

-- 9. Note interne
INSERT INTO crm_note (
    id, author_id, client_id, content, pinned, created_at
)
VALUES (
    1, 2, 3,
    'Le client a validé le programme et les horaires de la conférence.',
    TRUE,
    '2026-06-18 16:45:00+00'
);

-- 10. Avis
INSERT INTO reviews_review (
    id, author_id, rating, content, created_at
)
VALUES (
    1, 3, 5,
    'Organisation professionnelle et équipe très disponible.',
    '2026-07-10 12:00:00+00'
);

-- 11. Synchronisation des séquences d'identité
SELECT setval(pg_get_serial_sequence('accounts_user', 'id'),
              COALESCE((SELECT MAX(id) FROM accounts_user), 1), TRUE);

SELECT setval(pg_get_serial_sequence('crm_clientprofile', 'id'),
              COALESCE((SELECT MAX(id) FROM crm_clientprofile), 1), TRUE);

SELECT setval(pg_get_serial_sequence('crm_prospect', 'id'),
              COALESCE((SELECT MAX(id) FROM crm_prospect), 1), TRUE);

SELECT setval(pg_get_serial_sequence('events_event', 'id'),
              COALESCE((SELECT MAX(id) FROM events_event), 1), TRUE);

SELECT setval(pg_get_serial_sequence('bookings_booking', 'id'),
              COALESCE((SELECT MAX(id) FROM bookings_booking), 1), TRUE);

SELECT setval(pg_get_serial_sequence('crm_quote', 'id'),
              COALESCE((SELECT MAX(id) FROM crm_quote), 1), TRUE);

SELECT setval(pg_get_serial_sequence('crm_quoteitem', 'id'),
              COALESCE((SELECT MAX(id) FROM crm_quoteitem), 1), TRUE);

SELECT setval(pg_get_serial_sequence('crm_note', 'id'),
              COALESCE((SELECT MAX(id) FROM crm_note), 1), TRUE);

SELECT setval(pg_get_serial_sequence('reviews_review', 'id'),
              COALESCE((SELECT MAX(id) FROM reviews_review), 1), TRUE);

COMMIT;

-- 12. Requêtes de vérification
SELECT id, username, email, role
FROM accounts_user
ORDER BY id;

SELECT id, title, city, start_at, status, organizer_id, client_id
FROM events_event
ORDER BY id;

SELECT id, client_id, prospect_id, status, tva_rate
FROM crm_quote
ORDER BY id;

SELECT
    q.id AS quote_id,
    q.status,
    SUM(qi.amount_ht) AS total_ht,
    SUM(qi.amount_ht) * q.tva_rate AS total_tva,
    SUM(qi.amount_ht) * (1 + q.tva_rate) AS total_ttc
FROM crm_quote AS q
JOIN crm_quoteitem AS qi
    ON qi.quote_id = q.id
GROUP BY q.id, q.status, q.tva_rate
ORDER BY q.id;