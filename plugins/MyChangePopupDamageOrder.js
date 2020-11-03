/*:
 * @plugindesc 全体攻撃・二刀流実現プラグイン
 * @author paisuygoda
 * @help 
 * デフォルトではモーション・アクションが呼ばれた後そのままダメージ表示の処理に移る
 * 全部の処理をキューで管理することでお互いの処理が被らないようになっているが副作用として
 * 全体攻撃をしてもダメージ表示が個別に出てしまうほか、アクション→ダメージ→アクション→ダメージといった処理ができない
 * モーション・アクションとダメージ表示のフェーズを別に管理することでこれらの問題を解決する
 */

(function() {

	var BaMa_initMembers = BattleManager.initMembers;
	BattleManager.initMembers = function() {
		BaMa_initMembers.call(this);
		this._showHelp = false;
	};

	// startActionではアクションを呼ばない
	BattleManager.startAction = function() {
		var action = this._subject.currentAction();
		this._action = action;
		if (this._action._item._dataClass === 'skill') {
			// たたかうが設定されていたら武器に応じたたたかうに切り替え
			if (this._action.isAttackSkill()) this._action.setAttack();
			else {
				var id = this._action._item._itemId;
				// ものまね系だったらものまね対象に切り替え
				if (id == 21) this._action.traceSkill($gameParty._lastSkillId);
				else if (id == 22) this._action.traceSkill($gameTroop._lastSkillId);
				else if (id == 23) this._action.traceSkill(BattleManager._lastSkillId);
				else if (id == 24) this._action.traceSkill(this._subject._lastSkillId);
				// 擬態だったらその技に切り替え
				else if (id == 114) this._action.traceSkill(this._action.opponentsUnit().smoothTarget(this._targetIndex)._mimicSkillId);
			}
		}
		// ものまねスロットに登録
		if (!this._action.item().isSubSkill) {
			var id = this._action._item._itemId;
			BattleManager._lastSkillId = id;
			if (this._subject.isActor()) {
				$gameParty._lastSkillId = id;
				this._subject._lastSkillId = id;
			} else $gameTroop._lastSkillId = id;
		}
	    this._action.splitActions();
	    this._subject.useItem(action.item());
	    this._action.applyGlobal();
	    this.refreshStatus();
		this._logWindow.displayAction(this._subject, action.item());
	};

	// actionとdamageは完全に分ける
	BattleManager.update = function() {
	    if (!this.isBusy() && !this.updateEvent()) {
	        switch (this._phase) {
	        case 'start':
	            this.startInput();
	            break;
	        case 'turn':
	            this.updateTurn();
	            break;
	        case 'action':
	            this.updateAction();
	            break;
	        case 'damage':
	            this.updateDamage();
	            break;
			case 'postDamage':
				this.updatePostDamage();
				break;
			case 'specialDamage':
				this.updateSpecialDamage();
				break;
	        case 'turnEnd':
	            this.updateTurnEnd();
	            break;
	        case 'battleEnd':
	            this.updateBattleEnd();
	            break;
	        }
	    }
	};

	// 特殊行動がある時はそちらを優先
	/* MPP_ActiveTimeBattleに統合
	BattleManager.updateTurn = function() {
		$gameParty.requestMotionRefresh();
		if (this._specialSkills.length > 0) {
			this._special = this._specialSkills.shift();
			var oracleSkill = $dataSkills[this._special[skillId]];
			var targets = this._special[targets];
			this._logWindow.showNormalAnimation(targets, oracleSkill.animationId);
			this._phase = 'specialDamage';
		} else {
			if (!this._subject) {
				this._subject = this.getNextSubject();
			}
			if (this._subject) {
				this.processTurn();
			} else {
				this.endTurn();
			}
		}
	};
	*/

	// Actionがたたかう派生系であることの確認
	Game_Action.prototype.applyDualWield = function() {
		var attackskills = [1, 11, 12, 13, 14, 15, 16, 17, 18, 19, 27];
		return this._item._dataClass == 'skill' && attackskills.contains(this._item._itemId);
	}

	// 二刀流の場合にはこのタイミングでアクションを分割
	BattleManager.updateAction = function() {
		if (!this._logWindow.isBusy()) {
			
			// ._targetsと._reflecTargetsに対象を詰める
			this.substituteBeforeAnim();
			// Actionがたたかう派生系であることの確認
	    	if(this._subject.isActor() && this._action.applyDualWield()) {
				var equips = this._subject.equips();
				var bareHands = equips[0] && equips[1] && equips[0].id == 1 && equips[1].id == 1;
		    	if(!this._dualWielding && (this._subject.weapons()[1] || bareHands)) {
					this._dualWielding = true;
					this._tempWeapon = this._subject._equips[1];
					this._subject._equips[1] = null;
		    		var nextAction = JsonEx.makeDeepCopy(this._action);
		    		this._action.insert(nextAction);
		    	} else if (this._dualWielding && !bareHands) {
		    		this._subject._equips[1] = this._tempWeapon;
		    		this._tempWeapon = this._subject._equips[0];
		    		this._subject._equips[0] = null;
		    	}
			}
	    	this._logWindow.startAction(this._subject, this._action, this._targets, this._reflectTargets);
		    this._phase = 'damage';
    	}
	};

	// リフレク状態によってtargetsを分割
	// かばうによるものを含めて、スキルアニメーションが表示される前に真のtargetを決めることで描画に矛盾をなくす
	BattleManager.substituteBeforeAnim = function() {
		if (this._action.isMagical()) {
			rawTargets = this._action.makeTargets();
			this._targets = [];
			this._reflectTargets = [];
			var item = this._action.item();
			rawTargets.forEach(function(rawTarget) {
				var target = BattleManager.applySubstitute(rawTarget);
				if (target.isStateAffected(21) && !item.passReflec) BattleManager._reflectTargets.push(target);
				else BattleManager._targets.push(target);
			});
			
			// リフレク者が一人でもいれば反射先を選定しtargetに加える
			// リフレクアニメと反射後の攻撃アニメが同時に流れる
			if (this._reflectTargets.length > 0) {
				this._reflectTargets.forEach(function(target) {
					var substitute = target.opponentsUnit().randomTarget();
					if (substitute) BattleManager._targets.push(substitute);
				});
			}
		} else {
			this._targets = [];
			this._action.makeTargets().forEach(function(rawTarget) {
				BattleManager._targets.push(BattleManager.applySubstitute(rawTarget));
			});
			this._reflectTargets = [];
		}
	};

	BattleManager.updateDamage = function() {
		if (this._waitAnim > 0) this._waitAnim--;
	    if (!(this._logWindow.isBusy() || this._subject._isInMotion)) {
	    	if(this._dualWielding && this._subject._equips[0]._itemId === 0) {
				this._dualWielding = false;
				this._subject._equips[0] = this._tempWeapon;
	    	}
	    	var target = this._targets.shift();
	    	while(target) {
		        this.invokeAction(this._subject, target);
		        target = this._targets.shift();
			}
			
			this._resettingSubject = this._subject;
			// 二段階スキルなら二段階目のスキルをpushしsubjectを行動前待機状態に戻す
			if (this._action.item().isSerialSkill) {
				var secondAction = JsonEx.makeDeepCopy(this._action);
				secondAction.setSkill(this._action._item._itemId + 1);
				this._subject._actions.push(secondAction);
				this._subject.onMadeActionSubSkill(secondAction);
				this._subject = null;
			}

			// 描画時間の引き延ばし(ぬすむ系で盗んだアイテムを見る時間猶予)
			if (this._action.item().isStealSkill) this._waitAnim = 30;

			// マダンテのMP枯渇処理は最後にしないと敵全体にダメージが行かない
			if (this._action.item().sacrificeLevel == 2) {
				this._subject.setMp(0);
			}

	        this._action = this._action.pop();
	        if (this._action) this._phase = 'action';
			else this._phase = 'postDamage';
	    }
	};

	// 宣告や予言など、subjectの絡まないダメージ処理
	BattleManager.updateSpecialDamage = function() {
		if (this._waitAnim > 0) this._waitAnim--;
	    if (!(this._logWindow.isBusy())) {
			var oracleSkill = $dataSkills[this._special['skillId']];
			var targets = this._special['targets'];

			targets.forEach(function(target) {
				BattleManager.updateIndividualSpecialDamage(target, oracleSkill);
			});
			this._phase = 'turn';
	    }
	};

	BattleManager.updatePostDamage = function() {
		if (this._waitAnim > 0) this._waitAnim--;
	    else if (!(this._logWindow.isBusy())) {
			this.endAction();
			this._phase = 'turn';
	    }
	};

	BattleManager.updateIndividualSpecialDamage = function(target, oracleSkill) {
		if (oracleSkill.damage.type > 0) {
			try {
				var sign = ([3, 4].contains(oracleSkill.damage.type) ? -1 : 1);
				var baseValue = Math.max(eval(oracleSkill.damage.formula), 0);
				if (isNaN(baseValue)) baseValue = 0;
				baseValue *= ((Math.random() * 2 * oracleSkill.damage.variance) + 100 - oracleSkill.damage.variance) / 100 * sign;
			} catch (e) {
				baseValue = 0;
			}
			value = baseValue * target.elementRate(oracleSkill.damage.elementId);
			
			if (baseValue < 0) {
				value *= target.rec;
			} else {
				// 魔法攻撃のみ想定
				value *= target.mdr;
			}
			value /= (value > 0 && target.isGuard() ? 2 * target.grd : 1);
			value = Math.round(value);
			target.result().clear();
			target.gainHp(-value);
			this._logWindow.push('popupDamage', target);
		}
		oracleSkill.effects.forEach(function(effect) {
			target.addState(effect.dataId);
		}, target);
		if (this._special[origin] === 'oracle') target.removeState(14);
		else if (this._special[origin] === 'rerise') target.removeState(33);
        this._logWindow.displayAffectedStatus(target);
	}

	Window_BattleLog.prototype.displayOracleResults = function(target) {
			this.push('popupDamage', target);
	};

	// Game_Actionをキューに
	var GaAc_initialize = Game_Action.prototype.initialize;
	Game_Action.prototype.initialize = function(subject, forcing) {
	    GaAc_initialize.call(this, subject, forcing);
	    this._nextAction = null;
		this._turnFrame = 0;
		this._counter = false;
		this._oracleAction = false;
	};

	Game_Action.prototype.push = function(lastAction) {
	    if (this._nextAction) {
	    	this._nextAction.push(lastAction);
	    } else {
	    	this._nextAction = lastAction;
	    }
	};

	Game_Action.prototype.pop = function() {
	    return this._nextAction;
	};

	Game_Action.prototype.insert = function(action) {
	    if(this._nextAction) action._nextAction = this._nextAction;
	    this._nextAction = action;
	};

	Game_Action.prototype.splitActions = function() {
		if (this.item().scope > 3 && this.item().scope < 7 ) {
			var num = this.numTargets();
			$dataSkills[100] = JsonEx.makeDeepCopy(this.item());
			$dataSkills[100].scope = 3;
			this._item._itemId = 100;

	        for (var i = 1; i < num; i++) {
	            var nextAction = JsonEx.makeDeepCopy(this);
	            nextAction._nextAction = null;
	            this.push(nextAction);
	        }
	    }
	};

	// 通常消滅エフェクトの敵の場合同時撃破時には同時に消える
	Sprite_Enemy.prototype.isEffecting = function() {
	    return this._effectType !== null && this._effectType !== 'collapse';
	};

	// バトルログ処理による遅延をできるだけ減らす
	Window_BattleLog.prototype.push = function(methodName) {
		var methodArgs = Array.prototype.slice.call(arguments, 1);
		switch (methodName) {
			case 'addText':
			case 'pushBaseLine':
			case 'waitForNewLine':
			case 'popBaseLine':
				break;
			case 'popupDamage':
				methodArgs[0].startDamagePopup();
				break;
			case 'performMiss':
				methodArgs[0].performMiss();
				break;
			case 'performEvasion':
				methodArgs[0].performEvasion();
				break;
			case 'performMagicEvasion':
				methodArgs[0].performMagicEvasion();
				break;
			case 'performDamage':
				methodArgs[0].performDamage();
				break;
			case 'performCollapse':
				methodArgs[0].performCollapse();
				break;
			default:
	    		this._methods.push({ name: methodName, params: methodArgs });
		}
	};

	// アクションごとには技名は表示しない / アニメーション処理の後にフェーズチェンジ
	Window_BattleLog.prototype.startAction = function(subject, action, targets, reflectTargets) {
	    var item = action.item();
	    this.push('performActionStart', subject, action);
	    this.push('waitForMovement');
		this.push('performAction', subject, action);
		this.push('waitForEffect');
		// リフレク表示
		this.push('showAnimation', subject, reflectTargets.clone(), 123);
		this.push('showAnimation', subject, targets.clone(), item.animationId);
		this.push('waitPhase');
	    // this.displayAction(subject, item);
	};

	Window_BattleLog.prototype.waitPhase = function() {
		if (BattleManager._waitAnim > 0) {
			this._methods.unshift({ name: 'waitPhase', params: [] });
		}
		BattleManager.updateDamage();
	};

	// モーション中の情報を埋め込む
	var GaAc_initMembers = Game_Actor.prototype.initMembers;
	Game_Actor.prototype.initMembers = function() {
	    this._isInMotion = false;
	    GaAc_initMembers.call(this);
	};

	// アクターの動きを細かく設定する
	Game_Actor.prototype.performAction = function(action) {
	    Game_Battler.prototype.performAction.call(this, action);
	    this._isInMotion = true;
	    if (action.isAttackSkill()) {
	        this.performAttack();
	    } else if (action.isGuard()) {
	        this.requestMotion('guard');
	    	this._isInMotion = false;
	    } else if (action.isMagicSkill()) {
	        this.requestMotion('spell');
	    } else if (action.isSkill()) {
	        this.requestMotion('skill');
	    } else if (action.isItem()) {
	        this.requestMotion('item');
	    }
	};

	Game_Actor.prototype.attackAnimationId2 = function() {
	    if (this.hasNoWeapons()) {
	        return this.bareHandsAnimationId();
	    } else {
		    var weapons = this.weapons();
		    return weapons[1] ? weapons[1].animationId : 0;
		}
	};

})();