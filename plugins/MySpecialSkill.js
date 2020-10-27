/*:
 * @plugindesc 盗むやライブラなどの特殊スキルシステム
 * @author paisuygoda
 */

(function() {

	Game_Action.prototype.applySpecialSkills = function(target) {
		// ダメージ処理時にぬすむ判定も行う
		this.applySteal(target);
		// ライブラ処理も行う
		this.applyLibrary(target);
		// ラーニング処理
		this.applyLearning(target);
	}

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

	// ライブラ処理
	Game_Action.prototype.applyLibrary = function(target) {
		if(this.item().isLibrary) {
			BattleManager._logWindow.addItemNameText("レベル" + target.blv + "  ＨＰ " + target.hp + "／" + target.mhp + "  ＭＰ " + target.mp + "／" + target.mmp);
			BattleManager._waitAnim = 90;

			var weakness = "";
			// var noEffect = "";
			// var drain = "";
			for (var elementId = 2; elementId < 11; elementId++) {
				var rate = target.traitsWithId(Game_BattlerBase.TRAIT_ELEMENT_RATE, elementId).reduce(function(r, trait) {
					if (trait.value > 2 || r > 2) return 2.01; 
					else if (trait.value === 0) return -1;
					else if (trait.value === 0.01) return Math.min(r, 0);
					else return r != 1 ? Math.min(r, trait.value) : trait.value;
				}, 1);
				if (rate >= 2) weakness += $dataSystem.elements[elementId] + " ";
				// else if (rate == 0) noEffect += $dataSystem.elements[elementId] + " ";
				// else if (rate <= -1) drain += $dataSystem.elements[elementId] + " ";
			}
			if (weakness != "") {
				BattleManager._logWindow.addItemNameText(weakness + "の力に弱い");
				BattleManager._waitAnim += 30;
			}
		}
	}

	// 敵がそのスロットにアイテムを持っているか
	Game_Enemy.prototype.itemAvailable = function(i) {
		return this.enemy().dropItems[i].kind != 0 && this.haveItem[i];
	};

	// ドロップアイテムは1種に絞る
	Game_Enemy.prototype.makeDropItems = function() {
		var di = this.enemy().dropItems[0];
		return (di.kind > 0 && Math.random() * di.denominator < this.dropItemRate()) ? [this.itemObject(di.kind, di.dataId)] : [];
	};

	// ラーニング処理
	Game_Action.prototype.applyLearning = function(target) {
		var item = this.item();
		if(target.isActor() 
				&& item.stypeId == 5 
				&& (target.isStateAffected(48) || $gameParty.allMembers().some(actor => actor.isStateAffected(49)))
				&& !target.isLearnedSkill(item.id)
				&& !BattleManager._learnedSkill.contains(item.id)) {
			BattleManager._learnedSkill.push(item.id);
		}
	}

	BattleManager.displayLearned = function() {
		if (BattleManager._learnedSkill.length > 0) {
			$gameMessage.newPage();
			BattleManager._learnedSkill.forEach(function(skillId) {
				var item = $dataSkills[skillId];
				$gameParty.allMembers().forEach(function(actor) {
					actor.learnSkill(skillId);
				});
				$gameMessage.add('\\>「' + item.name + '」をラーニング！');
			});
		}
		BattleManager._learnedSkill = [];
	};

})();