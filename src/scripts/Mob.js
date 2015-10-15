var previousMob = root.Mob;

var Mob = {};

Mob.$ = $;

Mob.VERSION = '$VERSION';

Mob.noConflict = function() {
  root.Mob = previousMob;
  return this;
};