/*:
 * @plugindesc かばう発動条件や、かばう時のアニメーションをFF仕様にする
 * @author paisuygoda
 */

(function() {

	// 物理攻撃 & 全体攻撃でない時のみかばわれる
	BattleManager.checkSubstitute = function(target) {
	    return this._action.isPhysical() && !this._action.isForAll();
	};

	// 混乱 or 魅了でないときのみかばえる
	Game_BattlerBase.prototype.isSubstitute = function() {
		return this.specialFlag(Game_BattlerBase.FLAG_ID_SUBSTITUTE) && this.canMove()
		&& !(this.isStateAffected(8) || this.isStateAffected(9));
	};
	// におうだち状態判定
	Game_BattlerBase.prototype.isWall = function() {
		return this.isStateAffected(44) && this.canMove()
		&& !(this.isStateAffected(8) || this.isStateAffected(9));
	};

	// HP高い順にかばう、ただしにおうだち>かばうの優先順位はある
	Game_Unit.prototype.substituteBattler = function() {
	    var members = this.members().sort(function(a, b) {
	        var p1 = a.hp / a.mhp;
	        var p2 = b.hp / b.mhp;
	        if (p1 !== p2) {
	            return p2 - p1;
	        }
	        return a - b;
	    });
	    for (var i = 0; i < members.length; i++) {
	        if (members[i].isSubstitute()) {
	            return members[i];
	        }
	    }
	};

	// HP高い順にかばう、ただしにおうだち>かばうの優先順位はある
	Game_Unit.prototype.wallBattler = function() {
	    var members = this.members().sort(function(a, b) {
	        var p1 = a.hp / a.mhp;
	        var p2 = b.hp / b.mhp;
	        if (p1 !== p2) {
	            return p2 - p1;
	        }
	        return a - b;
	    });
	    for (var i = 0; i < members.length; i++) {
	        if (members[i].isWall()) {
	            return members[i];
	        }
	    }
	};

	// かばう移動量の設定項目追加
	var GaAc_initMembers = Game_Actor.prototype.initMembers;
	Game_Actor.prototype.initMembers = function() {
		GaAc_initMembers.call(this);
		this._substitutePosition = 0;
	};

	BattleManager.applySubstitute = function(target) {
		if (this.checkSubstitute(target)) {
			var substitute = target.friendsUnit().wallBattler();
			if (!substitute && target.isDying()) substitute = target.friendsUnit().substituteBattler();
			if (substitute && target !== substitute) {
				this._logWindow.displaySubstitute(substitute, target);
				// かばう発動時、移動量を設定 (アクターのみ)
				if (target.isActor()) {
					substitute._substitutePosition = $gameParty.getPositionDiff(substitute, target);
				}
				return substitute;
			}
		}
		return target;
	};
	// 実際に移動量を反映する処理はMyStateEffects: Sprite_Actor.prototype.updatePosition に書いた
	// 攻撃後、位置を修正する処理はMyStateEffects: Sprite_Actor.prototype.refreshMotion に書いた

	// パーティー中二人の隊列の差分取得
	Game_Party.prototype.getPositionDiff = function(baseActor, targetActor) {
		return targetActor.index() - baseActor.index();
	};

})();