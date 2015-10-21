(function() {

  QUnit.module('Mob.noConflict');

  QUnit.test('noConflict', function(assert) {
    assert.expect(2);
    var noconflictMob = Mob.noConflict();
    assert.equal(window.Mob, undefined, 'Returned window.Mob');
    window.Mob = noconflictMob;
    assert.equal(window.Mob, noconflictMob, 'Mob is still pointing to the original Mob');
  });

})();