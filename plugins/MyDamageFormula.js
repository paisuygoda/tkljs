/*:
 * @plugindesc ダメージ計算式をFF5式(FF6要素を含む)に変更
 * @author paisuygoda
 * @help 属性有効度は0=吸収、1=無効、それ以上=実値である
 */

(function() {

    Game_Action.prototype.makeDamageValue = function(target, critical) {
		var item = this.item();
		var baseValue = this.evalDamageFormula(target);
		var value = baseValue * this.calcElementRate(target);
		// 回復時はプロテス/シェルの影響を受けない
		if (baseValue < 0) {
			value *= target.rec;
		} else {
			if (this.isPhysical()) {
				value *= target.pdr;
			}
			if (this.isMagical()) {
				value *= target.mdr;
			}
		}
		if (critical) {
			value = this.applyCritical(value);
		}
		value = this.applyVariance(value, item.damage.variance);
		value = this.applyGuard(value, target);
		value = Math.round(value);
		return value;
	};

	
	// 属性耐性は累計でなく一番有利な耐性のみを取る
	// 吸収>無効>半減>弱点
	Game_BattlerBase.prototype.elementRate = function(elementId) {
		// ついでに凍結解除
		if (this.isStateAffected(30) && elementId === 1) this.removeState(30);
		return this.traitsWithId(Game_BattlerBase.TRAIT_ELEMENT_RATE, elementId).reduce(function(r, trait) {
			if (trait.value === 0) return -1;
			if (trait.value === 0.01) return Math.min(r, 0);
			else return Math.min(r, trait.value);
		}, 1);
	};
	

})();