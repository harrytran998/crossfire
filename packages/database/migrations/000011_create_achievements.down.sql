DROP INDEX IF EXISTS idx_criteria_achievement;
DROP INDEX IF EXISTS idx_player_achievements_player;
DROP INDEX IF EXISTS idx_achievements_category;

DROP TABLE IF EXISTS player_achievements;
DROP TABLE IF EXISTS achievement_criteria;
DELETE FROM achievements WHERE achievement_key IN ('first_blood', 'kill_100', 'kill_1000', 'headshot_50', 'win_10', 'win_100', 'level_50', 'friend_5');
DROP TABLE IF EXISTS achievements;
DROP TYPE IF EXISTS achievement_category;
