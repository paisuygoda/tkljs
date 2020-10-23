/*:
 * @plugindesc 盗むシステム
 * @author paisuygoda
 */

(function() {

	// 盗み処理
	Game_Action.prototype.applySteal = function(target) {
		if(this.item().isStealSkill) {
			if(!(target.itemAvailable(1) || target.itemAvailable(2))){
				BattleManager._logWindow.addItemNameText("何も持っていない！");
			} else {
				// (盗む基礎値)% で盗みに成功し、(レア盗み率) + (盗む基礎値-100)% でレアアイテムを取る
				// 盗む判定基礎値は(40 + 5 * (シーフジョブレベル))となる
				var stealBaseValue = (40 + 5 * this.subject()._jobLevel[3]) * (this.subject().isStateAffected(46) ? 2 : 1) / 100;
				// 盗み成功判定
				if(Math.random() < stealBaseValue) {
					// レア盗み判定
					if( target.itemAvailable(2) && Math.random() < 1 / target.enemy().dropItems[2].denominator + Math.max(0, stealBaseValue - 1)){
						target.haveItem[2] = false;
						var gainedItem = target.itemObject(target.enemy().dropItems[2].kind, target.enemy().dropItems[2].dataId);
						$gameParty.gainItem(gainedItem, 1);
						BattleManager._logWindow.addItemNameText(gainedItem.name + " を盗んだ");
					// 通常枠
					} else if (target.itemAvailable(1)) {
						target.haveItem[1] = false;
						var gainedItem = target.itemObject(target.enemy().dropItems[1].kind, target.enemy().dropItems[1].dataId);
						$gameParty.gainItem(gainedItem, 1);
						BattleManager._logWindow.addItemNameText(gainedItem.name + " を盗んだ");
					} else {
						BattleManager._logWindow.addItemNameText("盗みそこなった");
					}
				} else {
					BattleManager._logWindow.addItemNameText("盗みそこなった");
				}
			}
		}
	};

	// 敵がそのスロットにアイテムを持っているか
	Game_Enemy.prototype.itemAvailable = function(i) {
		return this.enemy().dropItems[i].kind != 0 && this.haveItem[i];
	};

	// ドロップアイテムは1種に絞る
	Game_Enemy.prototype.makeDropItems = function() {
		var di = this.enemy().dropItems[0];
		return (di.kind > 0 && Math.random() * di.denominator < this.dropItemRate()) ? [this.itemObject(di.kind, di.dataId)] : [];
	};

})();