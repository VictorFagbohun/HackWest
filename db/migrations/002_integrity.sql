-- Preserve the team's names and one-copy-per-item ownership model.
ALTER TABLE users ADD COLUMN auth_subject text UNIQUE;
ALTER TABLE users ADD CONSTRAINT users_balances CHECK (xp >= 0 AND coins >= 0 AND level >= 1);
ALTER TABLE users ADD CONSTRAINT users_json_objects CHECK (jsonb_typeof(character) = 'object' AND jsonb_typeof(stats) = 'object');
ALTER TABLE quests ADD CONSTRAINT quests_rewards CHECK (xp_reward >= 0 AND coin_reward >= 0);
ALTER TABLE quests ADD COLUMN minimum_duration_seconds integer NOT NULL DEFAULT 0 CHECK (minimum_duration_seconds >= 0);
ALTER TABLE quests ADD COLUMN verification_policy verification_method NOT NULL DEFAULT 'QR';
ALTER TABLE items ADD CONSTRAINT items_cost CHECK (cost >= 0);
ALTER TABLE quest_events ADD CONSTRAINT quest_events_rewards CHECK (xp_gained >= 0 AND coins_gained >= 0);
ALTER TABLE user_items ADD CONSTRAINT placement_coordinates CHECK (
  (NOT placed AND x IS NULL AND y IS NULL) OR (placed AND x IS NOT NULL AND y IS NOT NULL AND x >= 0 AND y >= 0)
);
CREATE UNIQUE INDEX user_items_position ON user_items (user_id, x, y) WHERE placed;
CREATE UNIQUE INDEX friendships_pair ON friendships (LEAST(user_id, friend_id), GREATEST(user_id, friend_id));
CREATE INDEX friendships_incoming ON friendships (friend_id, status);
CREATE INDEX users_university_xp ON users (university, xp DESC, id);

CREATE TABLE quest_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED','VERIFYING','APPROVED','REJECTED','COMPLETED')),
  started_at timestamptz NOT NULL DEFAULT now(),
  verification_token uuid,
  verification_started_at timestamptz,
  verification_calls integer NOT NULL DEFAULT 0,
  evidence_hash text,
  verification_result jsonb,
  verified_by verification_method,
  result jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX quest_attempts_active ON quest_attempts (user_id, quest_id) WHERE status IN ('STARTED','VERIFYING','APPROVED');
CREATE UNIQUE INDEX quest_attempts_evidence ON quest_attempts (user_id, evidence_hash) WHERE evidence_hash IS NOT NULL;
CREATE INDEX quest_attempts_user_time ON quest_attempts (user_id, started_at DESC);

-- Claim keys enforce DAILY / ONE_TIME limits independently of the time-series log.
CREATE TABLE quest_claims (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  period_key text NOT NULL,
  attempt_id uuid NOT NULL UNIQUE REFERENCES quest_attempts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, quest_id, period_key)
);
ALTER TABLE quest_events ADD COLUMN attempt_id uuid REFERENCES quest_attempts(id) ON DELETE CASCADE;

CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER attempts_updated BEFORE UPDATE ON quest_attempts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- QR seeds retain their agreed behavior; add one explicit photo quest for Gemini.
INSERT INTO quests (id, title, description, category, xp_reward, coin_reward, frequency, verification_policy, minimum_duration_seconds)
VALUES ('18e9c662-fbe8-45d4-905e-a5105fc0d309', 'Workout Evidence',
  'Start this quest before a one-hour gym visit, then submit a photo showing a gym or exercise setting. The photo checks context, not duration.',
  'WELLNESS', 100, 50, 'DAILY', 'PHOTO_AI', 3600);
