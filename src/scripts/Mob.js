var previousMob = root.Mob;
var undefined;

var Mob = {};

Mob.$ = $;

Mob.VERSION = '$VERSION';

Mob.noConflict = function() {
  root.Mob = previousMob;
  return this;
};