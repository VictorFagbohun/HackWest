-- Time partitioning requires the time column in every unique key.
ALTER TABLE quest_events DROP CONSTRAINT quest_events_pkey;
ALTER TABLE quest_events ADD PRIMARY KEY (id, completed_at);
SELECT create_hypertable('quest_events', 'completed_at', migrate_data => true);
