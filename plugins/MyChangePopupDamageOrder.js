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
		this._turnCount = 0;
		this._dualWielding = false;
		this._tempWeapon = null;
		this._waitAnim = 0;
	};

	// startActionではアクションを呼ばない
	BattleManager.startAction = function() {
	    var action = this._subject.currentAction();
	    this._phase = 'action';
	    this._action = action;
	    this._action.splitActions();
	    this._subject.useItem(action.item());
	    this._action.applyGlobal();
	    this.refreshStatus();
	    // アクションの一連のシーケンスに入る前に技名を出す
	    this._subject = this._subject._isForCounter ? this._subject._isForCounter : this._subject;
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

	// 二刀流の場合にはこのタイミングでアクションを分割
	BattleManager.updateAction = function() {
		if (!this._logWindow.isBusy()) {
	    	this._targets = this._action.makeTargets();
	    	// Actionがたたかう系であることの確認も必要
	    	if(this._subject.isActor()) {
		    	if(!this._dualWielding && this._subject.weapons()[1]) {
		    		this._dualWielding = true;
		    		this._tempWeapon = this._subject._equips[1];
		    		this._subject._equips[1] = null;
		    		var nextAction = JsonEx.makeDeepCopy(this._action);
		    		this._action.insert(nextAction);
		    	} else if (this._dualWielding) {
		    		this._subject._equips[1] = this._tempWeapon;
		    		this._tempWeapon = this._subject._equips[0];
		    		this._subject._equips[0] = null;
		    	}
		    }
	    	this._logWindow.startAction(this._subject, this._action, this._targets);
		    this._phase = 'damage';
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
	        this._action = this._action.pop();
	        if (this._action) this._phase = 'action';
	    	else this.endAction();
	    }
	};

	// 宣告や予言など、subjectの絡まないダメージ処理
	BattleManager.updateSpecialDamage = function() {
		if (this._waitAnim > 0) this._waitAnim--;
	    if (!(this._logWindow.isBusy())) {
			var oracleSkill = $dataSkills[this._specialSkill];

			BattleManager._specialIsSentence = true;

			this._specialTargets.forEach(function(target) {
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
				}
				oracleSkill.effects.forEach(function(effect) {
					Game_Action.prototype.applyItemEffect(target, effect);
				}, target);
				if (BattleManager._specialIsSentence) target.removeState(14);
			});
			this._phase = 'turn';
	    }
	};

	// Game_Actionをキューに
	var GaAc_initialize = Game_Action.prototype.initialize;
	Game_Action.prototype.initialize = function(subject, forcing, frame) {
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

	// 戦闘モーションが終わったらその情報を外す
	var SpAc_refreshMotion = Sprite_Actor.prototype.refreshMotion;
	Sprite_Actor.prototype.refreshMotion = function() {
		this._actor._isInMotion = false;
	    SpAc_refreshMotion.call(this);
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
			// case 'waitForNewLine':
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

	// アクションごとには技名は表示しない
	Window_BattleLog.prototype.startAction = function(subject, action, targets) {
	    var item = action.item();
	    this.push('performActionStart', subject, action);
	    this.push('waitForMovement');
		this.push('performAction', subject, action);
		this.push('waitForEffect');
	    this.push('showAnimation', subject, targets.clone(), item.animationId);
	    // this.displayAction(subject, item);
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
	    if (action.isAttack()) {
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