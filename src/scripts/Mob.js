var previousMob = root.Mob;

var Mob = {};

var M$ = Mob.$ = $;

Mob.VERSION = '$VERSION';

Mob.noConflict = function() {
  root.Mob = previousMob;
  return this;
};