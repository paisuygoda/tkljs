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
	            this.refresh();
	        }
	        this._result.pushAddedState(stateId);
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
					this.gainHp(value);
				}
			}
			// 宣告
			if (this.isStateAffected(14) && this._stateStartTurn[10] % 20 == BattleManager._turnCount % 20){
				var value = Math.floor(this.mhp * this.hrg);
				value = Math.max(value, -this.maxSlipDamage());
				if (value !== 0) {
					this.gainHp(value);
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

})();