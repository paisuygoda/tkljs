/*:
 * @plugindesc カウンターをFF仕様に変更
 * @author paisuygoda
 * @help カウンターのデフォルト仕様：
 * 相手の物理攻撃にのみ反応。相手の行動をキャンセルし、その相手にこちらの通常攻撃をかける。
 * 
 * このプラグインの仕様:
 * アクターの場合…アビリティに対応する属性の攻撃に反応。相手の行動は阻害せず、その後相手にこちらの通常攻撃をかける。
 * エネミーの場合…メモ欄で条件を指定。カウンター内容もメモ欄に従う。
 */

(function() {

	// カウンター設定読み込み
	var _loaded_Counter_Setting = false;
	var DaMa_isDatabaseLoaded = DataManager.isDatabaseLoaded;
	DataManager.isDatabaseLoaded = function() {
	if (!DaMa_isDatabaseLoaded.call(this)) return false;
	if (!_loaded_Counter_Setting) {
		this.processNotetagsEnemyCounter($dataEnemies);
		this.processNotetagsActorCounter($dataArmors);
		_loaded_Counter_Setting = true;
	}
		return true;
	};

	DataManager.processNotetagsEnemyCounter = function(group) {
		// HPの設定と属性の設定と効果タイプの設定と分ける
		var noteHPCondition = /<(?:CounterHPCondition):[ ](\d+)>/i;
		// Hit Condition 0:物理 1:魔法 2:必中以外 3:必中 4:全部
		var noteHitCondition = /<(?:CounterHitCondition):[ ](\d+)>/i;
		var noteAttributeCondition = /<(?:CounterAttributeCondition):[ ](\d+)>/i;
		var noteSkillTypeCondition = /<(?:CounterSkillTypeCondition):[ ](\d+)>/i;
		var noteAction = /<(?:CounterAction):[ ](\d+)>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj.counters = [];
			var hpCondition = 0;
			var hitCondition = 0;
			var attributeCondition = 0;
			var skillTypeCondition = 0;

			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteHPCondition)) {
					hpCondition = parseInt(RegExp.$1);
				} else if (line.match(noteHitCondition)) {
					hitCondition = parseInt(RegExp.$1);
				} else if (line.match(noteAttributeCondition)) {
					attributeCondition = parseInt(RegExp.$1);
				} else if (line.match(noteSkillTypeCondition)) {
					skillTypeCondition = parseInt(RegExp.$1);
				} else if (line.match(noteAction)) {
					obj.counters.push({
						hp 		: 	hpCondition,
						hit 	: 	hitCondition,
						att 	: 	attributeCondition,
						skill 	: 	skillTypeCondition,
						action 	: 	parseInt(RegExp.$1)
					});

					hpCondition = 0;
					hitCondition = 0;
					attributeCondition = 0;
					skillTypeCondition = 0;
				}
			}
		}
	};

	DataManager.processNotetagsActorCounter = function(group) {
		var noteCounter1 = /<(?:Counter1)>/i;
		var noteCounter2 = /<(?:Counter2)>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj.counterType = 0;

			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteCounter1)) {
					obj.counterType = 1;
				} else if (line.match(noteCounter2)) {
					obj.counterType = 2;
				}
			}
		}
	};

	// アビリティ装備変更時にアクターにカウンター設定反映
	// YEP_SkillEquipCore abrefresh()に実装

	// カウンター用のアクター属性付与
	var GaBa_initMembers = Game_Battler.prototype.initMembers;
	Game_Battler.prototype.initMembers = function() {
	    GaBa_initMembers.call(this);
	    this._isForCounter = false;
	};

	// counterTypeでカウンター設定呼び出し
	Game_Actor.prototype.counters = function() {
		if (this._counterType !== 0) {
			return [{
					hp 		: 	0,
					hit 	: 	this._counterType,
					att 	: 	0,
					skill 	: 	0,
					action 	: 	1
				}];
		} else {
		    return [];
		}
	};
	Game_Enemy.prototype.counters = function() {
	    return this.enemy().counters;
	};

	// 反撃は相手の攻撃をキャンセルしない、反撃処理は必ず行う（実際に動くかは反撃処理の中で決める）
	BattleManager.invokeAction = function(subject, target) {
	    this._logWindow.push('pushBaseLine');
		this.invokeCounterAttack(subject, target);
	    if (Math.random() < this._action.itemMrf(target)) {
	        this.invokeMagicReflection(subject, target);
	    } else {
			this._effectDuration = this._action.item().duration;
	        this.invokeNormalAction(subject, target);
	    }
	    subject.setLastTarget(target);
	    this._logWindow.push('popBaseLine');
	    this.refreshStatus();
	};

	// カウンター対象の参考
	Game_Action.prototype.itemCnt = function(target) {
		if (this.isPhysical() && target.canMove()) {
			return target.cnt;
		} else {
			return 0;
		}
	};

	// カウンター処理　クイックでない、対象が行動可能、
	// カウンターにはカウンターしない、パーティーアタックにはカウンターしない
	BattleManager.counterHappenGeneral = function(subject, target) {
		return !this._action._counter && !this._quick && target.canMove() &&
				(target.isActor() ? subject.isEnemy() : true);
	};

	// また、ちゃんと攻撃者にカウンターを返すこと
	// かばった場合のtargetがかばわれた側になっている
	BattleManager.invokeCounterAttack = function(subject, target) {
		if (this.counterHappenGeneral(subject, target)) {
			var action = this._action;
			target.counters().some(function(counter) {
					if ((counter.hit === 0 && action.isPhysical())
						|| (counter.hit === 1 && action.isMagical())
						|| (counter.hit === 2 && !action.isCertainHit())
						|| (counter.hit === 3 && action.isCertainHit())
						|| (counter.hit === 4)) var hit = true;
					else var hit = false;

			        if ((counter.hp === 0 || counter.hp === target.hp)
			        	&& hit
			        	&& (counter.att === 0 || counter.att === action.item().damage.elementId)
			        	&& (counter.skill === 0 || counter.skill === action.item().stypeId)) {
				        
				        var counterAction = new Game_Action(target);
				    	counterAction.setSkill(counter.action);
						counterAction._targetIndex = subject.index();
						counterAction._forcing = true;
						
						var counterActor = JsonEx.makeDeepCopy(target);
						counterActor.clearActions();
						counterActor._actions.push(counterAction);
						counterActor._isForCounter = target;
						this._actionBattlers.unshift(counterActor);
				    	return true;
				    }
			    }, this);
		}
	};

	// カウンター用アクターは飛ばさない
	BattleManager.getNextSubject = function() {
	    for (;;) {
	        var battler = this._actionBattlers.shift();
	        if (!battler) {
	            return null;
	        }
	        if ((battler.isBattleMember() || battler._isForCounter) && battler.isAlive()) {
	            return battler;
	        }
	    }
	};

	// リフレク発動時の処理
	BattleManager.invokeMagicReflection = function(subject, target) {
		this._action._reflectionTarget = target;
		this._logWindow.displayReflection(target);
		var reflecTarget = this.applyReflecSubstitute(target);
		this._action.apply(reflecTarget);
		if ($dataSkills[this._action._item._itemId]._damagePopUp) {
			this._logWindow.displayActionResults(subject, reflecTarget);
		}
	};

	// リフレク反射先の選定
	BattleManager.applyReflecSubstitute = function(target) {
		var substitute = target.opponentsUnit().randomTarget();
		if (substitute) return substitute;
		return target;
	};

})();