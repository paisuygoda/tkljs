/*:
 * @plugindesc ダメージ計算式をFF5式(FF6要素を含む)に変更
 * @author paisuygoda
 * @help 属性有効度は0=吸収、1=無効、それ以上=実値である
 */

(function() {

    Game_Action.prototype.makeDamageValue = function(target, critical) {
		// 石化時は一切の計算をせずに0で返す
		if (target.isStateAffected(24)) return 0;
		
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
		if (this.isStateAffected(30) && elementId === 2) this.removeState(30);
		// 生存者に蘇生技が当たっていたら回復量を無効化する
		if (this.isAlive() && elementId === 13) return 0;
		return this.traitsWithId(Game_BattlerBase.TRAIT_ELEMENT_RATE, elementId).reduce(function(r, trait) {
			if (trait.value === 0) return -1;
			if (trait.value === 0.01) return Math.min(r, 0);
			else return Math.min(r, trait.value);
		}, 1);
	};
	
	// たたかうのダメージをX倍するスキル用に、計算式から戦うダメージを引けるようにする
	Game_Action.prototype.attackDamage = function(target) {
		try {
			var item =$dataSkills[this.subject().attackSkillId()];
			var a = this.subject();
			var b = target;
			var v = $gameVariables._data;
			var sign = ([3, 4].contains(item.damage.type) ? -1 : 1);
			var value = Math.max(eval(item.damage.formula), 0) * sign;
			if (isNaN(value)) value = 0;
			return value;
		} catch (e) {
			return 0;
		}
	};

	//　成功率が0の時、必中に読み替える
	Game_Action.prototype.itemHit = function(target) {
		if (this.item().successRate == 0) return 1;
		if (this.isPhysical()) {
			return this.item().successRate * 0.01 * this.subject().hit;
		} else {
			return this.item().successRate * 0.01;
		}
	};
	
	Game_Action.prototype.itemEva = function(target) {
		if (this.item().successRate == 0) return 0;
		if (this.isPhysical()) {
			return target.eva;
		} else if (this.isMagical()) {
			return target.mev;
		} else {
			return 0;
		}
	};

})();