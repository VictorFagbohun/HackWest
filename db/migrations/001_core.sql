-- Campus Quest — Core Schema
-- Run this once against your campusquest-core TigerData/Postgres service.

-- Extension for uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    university      text NOT NULL,
    major           text,
    level           int NOT NULL DEFAULT 1,
    xp              int NOT NULL DEFAULT 0,
    coins           int NOT NULL DEFAULT 0,
    character       jsonb NOT NULL DEFAULT '{}'::jsonb,
    stats           jsonb NOT NULL DEFAULT '{"knowledge":0,"wellness":0,"community":0,"career":0}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- QUESTS
-- ============================================================
CREATE TYPE quest_category AS ENUM ('SCHOLAR', 'WELLNESS', 'COMMUNITY', 'CAREER');
CREATE TYPE quest_frequency AS ENUM ('DAILY', 'ONE_TIME', 'REPEATABLE');

CREATE TABLE quests (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text NOT NULL,
    description     text,
    category        quest_category NOT NULL,
    xp_reward       int NOT NULL,
    coin_reward     int NOT NULL,
    location_code   text,              -- nullable; matches QR codes, e.g. 'LIBRARY'
    frequency       quest_frequency NOT NULL DEFAULT 'DAILY',
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quests_location_code ON quests (location_code);

-- ============================================================
-- QUEST EVENTS (time-series log — append only)
-- ============================================================
CREATE TYPE verification_method AS ENUM ('QR', 'PHOTO_AI', 'MANUAL');

CREATE TABLE quest_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id        uuid NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    xp_gained       int NOT NULL,
    coins_gained    int NOT NULL,
    verified_by     verification_method NOT NULL,
    completed_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quest_events_user_time ON quest_events (user_id, completed_at DESC);
CREATE INDEX idx_quest_events_completed_at ON quest_events (completed_at DESC);

-- Optional but recommended once you're on TigerData: turn this into a hypertable
-- for fast time-range queries (weekly leaderboard, streaks, etc).
-- SELECT create_hypertable('quest_events', 'completed_at');

-- Prevent completing the same non-repeatable quest twice per day (daily quests)
-- Enforced in application logic in completeQuest(), not as a hard DB constraint,
-- since "per day" resets and repeatable quests need flexibility.

-- ============================================================
-- ITEMS (placeable world objects — catalog)
-- ============================================================
CREATE TYPE item_category AS ENUM ('BUILDING', 'DECOR');

CREATE TABLE items (
    id              text PRIMARY KEY,   -- slug, e.g. 'gym', 'fountain'
    name            text NOT NULL,
    category        item_category NOT NULL,
    cost            int NOT NULL DEFAULT 0
);

-- Seed the canonical 10 placeable items from the naming contract
INSERT INTO items (id, name, category, cost) VALUES
    ('house',           'House',           'BUILDING', 0),
    ('tree',            'Tree',            'DECOR',    50),
    ('library',         'Library',         'BUILDING', 300),
    ('gym',              'Gym',            'BUILDING', 300),
    ('fountain',        'Fountain',        'DECOR',    150),
    ('garden',          'Garden',          'DECOR',    100),
    ('trophy_building', 'Trophy Building', 'BUILDING', 500),
    ('bench',           'Bench',           'DECOR',    40),
    ('lamp_post',       'Lamp Post',       'DECOR',    30),
    ('pond',            'Pond',            'DECOR',    120);

-- ============================================================
-- USER_ITEMS (ownership + placement)
-- ============================================================
CREATE TABLE user_items (
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id         text NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    x               int,
    y               int,
    placed          boolean NOT NULL DEFAULT false,
    acquired_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, item_id)
);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
CREATE TYPE friendship_status AS ENUM ('PENDING', 'ACCEPTED');

CREATE TABLE friendships (
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          friendship_status NOT NULL DEFAULT 'PENDING',
    created_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id <> friend_id)
);

-- ============================================================
-- SEED: a few starter quests so the app has data to demo against
-- ============================================================
INSERT INTO quests (title, description, category, xp_reward, coin_reward, location_code, frequency) VALUES
    ('Scholar''s Journey', 'Study at the library', 'SCHOLAR', 100, 50, 'LIBRARY', 'DAILY'),
    ('Strength Training', 'Visit the Rec Center', 'WELLNESS', 75, 40, 'REC_CENTER', 'DAILY'),
    ('Meet Your Guild', 'Attend a student organization', 'COMMUNITY', 150, 100, 'STUDENT_UNION', 'DAILY'),
    ('Career Path', 'Visit the Career Center', 'CAREER', 100, 60, 'CAREER_CENTER', 'DAILY'),
    ('Hackathon Check-in', 'Check in at the hackathon', 'COMMUNITY', 200, 150, 'HACKATHON', 'ONE_TIME');
