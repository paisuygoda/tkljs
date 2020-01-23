/*:
 * @plugindesc ステート処理プラグイン
 * @author paisuygoda
 * @help 
 * 現行のATBシステムでは毒などの時間経過ステートがアクターの速度と連携してしまい
 * 速いほど時間経過ステートには不利になってしまう
 * 時間経過の計算をBattleManagerが持つ絶対時間と連携させ
 * アクターの素早さにデメリットが生まれないようにする
 */

(function() {

	// ステート持続時間設定読み込み
	var _loaded_State_Setting = false;
	var DaMa_isDatabaseLoaded = DataManager.isDatabaseLoaded;
	DataManager.isDatabaseLoaded = function() {
	if (!DaMa_isDatabaseLoaded.call(this)) return false;
	if (!_loaded_State_Setting) {
		this.processNotetagsStateDurations($dataSkills);
		this.processNotetagsStateOracle($dataSkills);
		_loaded_State_Setting = true;
	}
		return true;
	};
	DataManager.processNotetagsStateDurations = function(group) {
		var noteDuration = /<(?:Duration):[ ](\d+)>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj.duration = 0;

			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteDuration)) {
					obj.duration = parseInt(RegExp.$1);
				}
			}
		}
	};
	DataManager.processNotetagsStateOracle = function(group) {
		var noteCount = /<(?:OracleCount):[ ](\d+)>/i;
		var noteEvent = /<(?:OracleEvent):[ ](\d+)>/i;
		var noteResist = /<(?:OracleResist):[ ](\d+)>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj._oracleCount = 0;
			obj._oracleEvent = 1;
			obj._oracleResist = 0;

			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteCount)) {
					obj._oracleCount = parseInt(RegExp.$1);
				} else if (line.match(noteEvent)) {
					obj._oracleEvent = parseInt(RegExp.$1);
				} else if (line.match(noteResist)) {
					obj._oracleResist = parseInt(RegExp.$1);
				}
			}
		}
	};

	// game_battler初期化時にステートの起点ターンarrayを作る
	Game_BattlerBase.prototype.clearStates = function() {
	    this._states = [];
	    this._stateTurns = {};
	    this._stateStartTurn = {};
	};

	// ステートを付与するとき起点ターンも登録する
	Game_BattlerBase.prototype.resetStateCounts = function(stateId) {
		var state = $dataStates[stateId];
		var stunStates = [6, 17, 28];
		var duration = 1;
		// 持続ターン数決定
		if (this.isStateAffected(26) && stunStates.indexOf(stateId) >= 0) {
			duration = 30;
		} else if (BattleManager._effectDuration > 0) {
			duration = BattleManager._effectDuration;
		} else {
			duration = Math.max(state.minTurns, 1);
		}

		// ターン数更新是非決定
		if (this.isStateAffected(stateId) && this._stateTurns[stateId] < duration) {
			this._stateTurns[stateId] = duration;
		} else if (!this.isStateAffected(stateId)) {
			this._stateTurns[stateId] = duration;
			if($gameParty.inBattle()) this._stateStartTurn[stateId] = BattleManager._turnCount;
			else this._stateStartTurn[stateId] = 0;
		}

		// 毒の累積ターンも新規ならリセット
		if (stateId === 4 && !this.isStateAffected(stateId)) {
			this._poisonProgress = 1;
		}
	};

	// 持続ターン数を決めてからステート付与(持続ターン決めでステートにかかっているかを参照するため)
	Game_Battler.prototype.addState = function(stateId) {
	    if (this.isStateAddable(stateId)) {
	        this.resetStateCounts(stateId);
	        if (!this.isStateAffected(stateId)) {
				this.addNewState(stateId);

				// ヘイスト/スロウ排他処理
				if (stateId === 18 && this.isStateAffected(19)) this.removeState(19);
				else if (stateId === 19 && this.isStateAffected(18)) this.removeState(18);

	            this.refresh();
	        }
	        this._result.pushAddedState(stateId);
	    }
	};

	// 宣告カウント・内容設定追加
	Game_Action.prototype.itemEffectAddNormalState = function(target, effect) {
		var chance = effect.value1;
		if (!this.isCertainHit()) {
			chance *= target.stateRate(effect.dataId);
			chance *= this.lukEffectRate(target);
		}

		// 宣告の場合宣告内容のステート耐性も見る(実際に発動する時は耐性無視のため)
		if (effect.dataId === 14) chance *= target.stateRate(this.item()._oracleResist);

		if (Math.random() < chance) {
			target.addState(effect.dataId);

			// 宣告カウント・内容設定追加
			if (effect.dataId === 14) {
				target._oracleCount = this.item()._oracleCount * (5 - this.subject()._jobLevel[17]); // 予言士のジョブID違うかもわからん
				target._oracleEvent = this.item()._oracleEvent;
				target._oracleMat = this.subject().mat;
			}
			this.makeSuccess(target);
		}
	};

	// 一定時間ごとに効果が出るタイプの処理
	Game_Battler.prototype.regenerateAll = function() {
	    if (this.isAlive()) {
	    	// スリップダメージ
	    	if (this.isStateAffected(23)){
		        this.setHp(this.hp - 1);
			}
			// 毒
			if (this.isStateAffected(4) && this._stateStartTurn[4] % 20 == BattleManager._turnCount % 20){
				var value = Math.floor(this.mhp * -this._poisonProgress++ / 20);
				value = Math.min(value, -1) * this.elementRate(10);
				if (value !== 0) {
					this.result().clear();
					this.gainHp(value);
				}
			}
			// 宣告
			if (this.isStateAffected(14) && this._stateStartTurn[10] % 20 == BattleManager._turnCount % 20){
				if (--this._oracleCount === 0 ) {
					var oracleSkill = $dataSkills[this._oracleEvent];

					if (oracleSkill.damage.type > 0) {
						try {
							var a = {};
							a.mat = this._oracleMat;
							var b = this;
							var v = $gameVariables._data;
							var sign = ([3, 4].contains(oracleSkill.damage.type) ? -1 : 1);
							var baseValue = Math.max(eval(oracleSkill.damage.formula), 0);
							if (isNaN(baseValue)) baseValue = 0;
							basevalue *= ((Math.random() * 2 * variance) + 100 - variance) / 100 * sign;
						} catch (e) {
							baseValue = 0;
						}
						value = baseValue * this.elementRate(oracleSkill.damage.elementId);
						
						if (baseValue < 0) {
							value *= this.rec;
						} else {
							// 魔法攻撃のみ想定
							value *= this.mdr;
						}
						value /= (value > 0 && this.isGuard() ? 2 * this.grd : 1);
						value = Math.round(value);
						this.result().clear();
						this.gainHp(-value);
					}
					oracleSkill.effects.forEach(function(effect) {
						Game_Action.prototype.applyItemEffect(this, effect);
					}, this);
				}
			}
			// リジェネ
			if (this.isStateAffected(20) && this._stateStartTurn[20] % 20 == BattleManager._turnCount % 20){
				var value = Math.floor(this.mhp / 10);
				value = Math.max(value, 1);
				if (value !== 0) {
					this.gainHp(value);
				}
			}
			// オールド
			if (this.isStateAffected(29) && this._stateStartTurn[29] % 10 == BattleManager._turnCount % 10){
				this.blv--;
			}
			// 精神波
			if (this.isStateAffected(34) && this._stateStartTurn[34] % 20 == BattleManager._turnCount % 20){
				var value = Math.floor(this.mmp / 20);
				value = Math.max(value, 1);
				if (value !== 0) {
					this.gainHp(value);
				}
			}
	    }
	};

	// 重ね掛けのためアニメーション分(6つ)追加
	Sprite_Actor.prototype.createStateSprite = function() {
		this._poisonStateSprite = new Sprite_PoisonStateOverlay();
		this.addChild(this._poisonStateSprite);
		this._blindStateSprite = new Sprite_BlindStateOverlay();
		this.addChild(this._blindStateSprite);
		this._silentStateSprite = new Sprite_SlientStateOverlay();
		this.addChild(this._silentStateSprite);
		this._confuseStateSprite = new Sprite_ConfuseStateOverlay();
		this.addChild(this._confuseStateSprite);
		this._charmStateSprite = new Sprite_CharmStateOverlay();
		this.addChild(this._charmStateSprite);
		this._sleepStateSprite = new Sprite_SleepStateOverlay();
		this.addChild(this._sleepStateSprite);
		this._paralyzeStateSprite = new Sprite_ParalyzeStateOverlay();
		this.addChild(this._paralyzeStateSprite);
	};
	Sprite_Actor.prototype.setBattler = function(battler) {
		Sprite_Battler.prototype.setBattler.call(this, battler);
		var changed = (battler !== this._actor);
		if (changed) {
			this._actor = battler;
			if (battler) {
				this.setActorHome(battler.index());
			}
			this.startEntryMotion();
			this._poisonStateSprite.setup(battler);
			this._blindStateSprite.setup(battler);
			this._silentStateSprite.setup(battler);
			this._confuseStateSprite.setup(battler);
			this._charmStateSprite.setup(battler);
			this._sleepStateSprite.setup(battler);
			this._paralyzeStateSprite.setup(battler);
		}
	};

	// ステートは動的に判断せず担当分のみ見る
	Sprite_StateOverlay.prototype.updatePattern = function() {
		this._pattern++;
		this._pattern %= 8;
		if (this._battler) {
			this._overlayIndex = this.statePattern();
		}
	};
	Sprite_StateOverlay.prototype.statePattern = function() {
		return 0;
	}
	function Sprite_PoisonStateOverlay() {
		this.initialize.apply(this, arguments);
	}
	Sprite_PoisonStateOverlay.prototype = Object.create(Sprite_StateOverlay.prototype);
	Sprite_PoisonStateOverlay.prototype.constructor = Sprite_PoisonStateOverlay;
	Sprite_PoisonStateOverlay.prototype.statePattern = function() {
		return this._battler.isStateAffected(4) ? 1 : 0;
	}
	function Sprite_BlindStateOverlay() {
		this.initialize.apply(this, arguments);
	}
	Sprite_BlindStateOverlay.prototype = Object.create(Sprite_StateOverlay.prototype);
	Sprite_BlindStateOverlay.prototype.constructor = Sprite_BlindStateOverlay;
	Sprite_BlindStateOverlay.prototype.statePattern = function() {
		return this._battler.isStateAffected(5) ? 2 : 0;
	}
	function Sprite_SlientStateOverlay() {
		this.initialize.apply(this, arguments);
	}
	Sprite_SlientStateOverlay.prototype = Object.create(Sprite_StateOverlay.prototype);
	Sprite_SlientStateOverlay.prototype.constructor = Sprite_SlientStateOverlay;
	Sprite_SlientStateOverlay.prototype.statePattern = function() {
		return this._battler.isStateAffected(6) ? 3 : 0;
	}
	function Sprite_ConfuseStateOverlay() {
		this.initialize.apply(this, arguments);
	}
	Sprite_ConfuseStateOverlay.prototype = Object.create(Sprite_StateOverlay.prototype);
	Sprite_ConfuseStateOverlay.prototype.constructor = Sprite_ConfuseStateOverlay;
	Sprite_ConfuseStateOverlay.prototype.statePattern = function() {
		return this._battler.isStateAffected(8) ? 5 : 0;
	}
	function Sprite_CharmStateOverlay() {
		this.initialize.apply(this, arguments);
	}
	Sprite_CharmStateOverlay.prototype = Object.create(Sprite_StateOverlay.prototype);
	Sprite_CharmStateOverlay.prototype.constructor = Sprite_CharmStateOverlay;
	Sprite_CharmStateOverlay.prototype.statePattern = function() {
		return this._battler.isStateAffected(9) ? 6 : 0;
	}
	function Sprite_SleepStateOverlay() {
		this.initialize.apply(this, arguments);
	}
	Sprite_SleepStateOverlay.prototype = Object.create(Sprite_StateOverlay.prototype);
	Sprite_SleepStateOverlay.prototype.constructor = Sprite_SleepStateOverlay;
	Sprite_SleepStateOverlay.prototype.statePattern = function() {
		return this._battler.isStateAffected(10) ? 7 : 0;
	}
	function Sprite_ParalyzeStateOverlay() {
		this.initialize.apply(this, arguments);
	}
	Sprite_ParalyzeStateOverlay.prototype = Object.create(Sprite_StateOverlay.prototype);
	Sprite_ParalyzeStateOverlay.prototype.constructor = Sprite_ParalyzeStateOverlay;
	Sprite_ParalyzeStateOverlay.prototype.statePattern = function() {
		return this._battler.isStateAffected(28) ? 8 : 0;
	}

	// 輪郭エフェクト
	var colorDict = {
		15 : 0x01DF01, //シェル
		16 : 0xFFFF00, //プロテス
		17 : 0xFF00FF, //ストップ
		18 : 0xFF4000, //ヘイスト
		19 : 0xFFFFFF, //スロウ
		21 : 0x0080FF  //リフレク
	};
	Game_BattlerBase.prototype.glowStates = function() {
		return this._states.filter(function(stateId) {
			return [15, 16, 17, 18, 19, 21].contains(stateId);
		});
	};
	var MStEf_SpAc_initMembers = Sprite_Actor.prototype.initMembers;
	Sprite_Actor.prototype.initMembers = function() {
		MStEf_SpAc_initMembers.call(this);
		this._glowIndex = 0;
		this._glowFrame = 0;
		this._glowColor = 0x000000;
	};
	var MStEf_SpAc_updateFrame = Sprite_Actor.prototype.updateFrame;
	Sprite_Actor.prototype.updateFrame = function() {
		MStEf_SpAc_updateFrame.call(this);
		console.log(this._battler._states);
		console.log(this._battler.glowStates());
		if (this._glowFrame === 0) {
			if (this._battler.glowStates().length > 0) {
				this._glowFrame = 1;
				this._glowIndex = this._glowIndex + 1 >= this._battler.glowStates().length ? 0 : this._glowIndex + 1;
				this._glowColor = colorDict[this._battler.glowStates()[this._glowIndex]];
			}
		} else if (++this._glowFrame === 120) this._glowFrame = 0; 
		var blightness = (this._glowFrame > 60 ? 120 - this._glowFrame : this._glowFrame) / 30 ;
		var glowFilter = new PIXI.filters.GlowFilter(6, blightness, blightness, this._glowColor);
		this._mainSprite.filters = [glowFilter];
	};

	// 全身の色が変わる系、これは排他
	var MStEf_Sprite_Actor_prototype_refreshMotion = Sprite_Actor.prototype.refreshMotion;
    Sprite_Actor.prototype.refreshMotion = function() {
        MStEf_Sprite_Actor_prototype_refreshMotion.call(this);
        // 石化
        if (this._actor.isStateAffected(24)) {
			this._mainSprite._colorTone = [0,0,0,255];
		// ゾンビ
		} else if (this._actor.isStateAffected(25)) {
			this._mainSprite._colorTone = [-150,-100,-180,90];
		// 凍結
		} else if (this._actor.isStateAffected(30)) {
			this._mainSprite._colorTone = [0,50,255,0];
		// バーサク
		} else if (this._actor.isStateAffected(7)) {
			this._mainSprite._colorTone = [150,-30,-30,0];
        } else {
            this._mainSprite._colorTone = [0,0,0,0];
        }
	 }
	 
	// 混乱で向かい合う
	MStEf_SpAc_updateTargetPosition = Sprite_Actor.prototype.updateTargetPosition;
	Sprite_Actor.prototype.updateTargetPosition = function() {
		if (this._actor.isStateAffected(8)) {
			this.startMove(-96, 0, 12);
		} else {
			MStEf_SpAc_updateTargetPosition.call(this);
		}
	};

})();