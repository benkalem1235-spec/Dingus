// One extra engine slot is reserved by entrypoint.sh for joining humans.
// The playable population stays fixed; YaPB fill replaces bots one-for-one.
export function populationTarget(map, maximum) {
 return Math.max(2, Math.min(31, Math.trunc(Number(maximum) || 12)));
}
export const botCommands = maximum => [
 'yb_quota_mode fill', 'yb_autovacate 1', 'yb_autovacate_keep_slots 1',
 'yb_kick_after_player_connect 1', 'yb_join_after_player 1',
 'yb_difficulty_auto 2', 'yb_difficulty_auto_balance_interval 60',
 'yb_chat 0', 'yb_chat_percent 0', 'yb_radio_mode 0',
 'yb_quota '+populationTarget('',maximum),
];
