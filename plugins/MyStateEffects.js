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

	// 石化・ゾンビ状態にはステート付与させない
	var MStEf_GaBa_isStateAddable = Game_Battler.prototype.isStateAddable;
	Game_Battler.prototype.isStateAddable = function(stateId) {
		return MStEf_GaBa_isStateAddable.call(this, stateId) && !this.isStateAffected(25) && !this.isStateAffected(24);
	};

	// 持続ターン数を決めてからステート付与(持続ターン決めでステートにかかっているかを参照するため)
	Game_Battler.prototype.addState = function(stateId) {
	    if (this.isStateAddable(stateId)) {
			this.resetStateCounts(stateId);
			
	        if (!this.isStateAffected(stateId)) {

				// デスは通常即死を耐性無視で付与し、アンデッドは全快させる
				if (stateId === 37) {
					if (target.isStateAffected(11)) this.setHp(this.mhp);
					else this.addNewState(1);
				}
				// 敵が石化/ゾンビ化したらそのステートではなく戦闘不能を耐性無視で付与
				else if (stateId === 24 & this.isEnemy()) this.addNewState(1);
				else this.addNewState(stateId);


				// ヘイスト/スロウ排他処理
				if (stateId === 18 && this.isStateAffected(19)) this.removeState(19);
				else if (stateId === 19 && this.isStateAffected(18)) this.removeState(18);

	            this.refresh();
	        }
	        this._result.pushAddedState(stateId);
	    }
	};

	Game_Battler.prototype.removeState = function(stateId) {
		if (this.isStateAffected(stateId)) {
			// ゾンビ解除時もhp1で回復
			if (stateId === this.deathStateId() || stateId === 25) {
				this.revive();
			}
			this.eraseState(stateId);
			this.refresh();
			this._result.pushRemovedState(stateId);
		}
	};

	Game_Party.prototype.reviveBattleMembers = function() {
		this.battleMembers().forEach(function(actor) {
			if (actor.isDown()) {
				actor.setHp(1);
			} 
			if (actor.isStateAffected(24)) actor.removeState(24);
		});
	};

	Game_Unit.prototype.isAllDead = function() {
		var fineMembers = this.filter(function(member) {
            return !(this.isAppeared() && (this.isDeathStateAffected() || this.isStateAffected(24) || this.isStateAffected(25)));
        });
		return fineMembers.length === 0;
	};

	Game_BattlerBase.prototype.isDown = function() {
		return this.isAppeared() && (this.isDeathStateAffected() || this.isStateAffected(25));
	};

	Game_Battler.prototype.refresh = function() {
		Game_BattlerBase.prototype.refresh.call(this);
		// HP0で死後ゾンビならゾンビにする
		if (this.hp === 0 && this.isStateAffected(36) && !this.isStateAffected(25) ) {
			this.removeState(this.deathStateId());
			this.addState(25);
		// HP0でもゾンビなら戦闘不能ステートは付与しない
		} else if (this.hp === 0 && !this.isStateAffected(25)) {
			this.addState(this.deathStateId());
		}else {
			this.removeState(this.deathStateId());
			this.removeState(25);
		}
	};

	Game_Battler.prototype.gainHp = function(value) {
		this._result.hpDamage = -value;
		this._result.hpAffected = true;
		// ゾンビの時、ダメージ表示はするが実際にダメージは受けない(回復させないため)
		if (!this.isStateAffected(25)) this.setHp(this.hp + value);
	};

	// 宣告カウント・内容設定追加
	Game_Action.prototype.itemEffectAddNormalState = function(target, effect) {
		var chance = effect.value1;
		if (!this.isCertainHit()) {
			chance *= target.stateRate(effect.dataId);
			chance *= this.lukEffectRate(target);
		}

		// 魅了の場合パーティーアタックでは付与されない
		if (effect.dataId === 9 && target.friendsUnit().aliveMembers().indexOf(this.subject()) >= 0) chance = 0;
		// アンデッドにデスは必中する
		else if (effect.dataId === 37 && target.isStateAffected(11)) chance = 1;
		// 宣告の場合宣告内容のステート耐性も見る(実際に発動する時は耐性無視のため)
		else if (effect.dataId === 14 && this.item()._oracleResist > 0) chance *= target.stateRate(this.item()._oracleResist);

		if (Math.random() < chance) {
			target.addState(effect.dataId);

			// 魅了の場合魅了対象を設定
			if (effect.dataId === 9) {
				target._charmTo = this.subject();
				BattleManager._logWindow.push('addItemNameText', '死ぬまで味方を殴りなさい');
			}

			// 宣告カウント・内容設定追加
			if (effect.dataId === 14) {
				if (this.subject().isActor()) var rate = 5 - this.subject()._jobLevel[17];
				else var rate = 5;
				target._oracleCount = this.item()._oracleCount * rate; // 予言士のジョブID違うかもわからん
				target._oracleEvent = this.item()._oracleEvent;
				target._oracleMat = this.subject().mat;
			}
			this.makeSuccess(target);
		}
	};

	Game_Battler.prototype.performCollapse = function() {
		// 魅了しているアクターを解除
		var sub = this;
		this.opponentsUnit().aliveMembers().forEach(function(target) {
			if (target._charmTo === sub) {
				target._charmTo = null;
				target.removeState(9);
			}
		});
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
			if (this.isStateAffected(14) && this._stateStartTurn[14] % 10 == BattleManager._turnCount % 10){
				if (this._oracleCount-- === 0 ) {
					BattleManager._logWindow.showNormalAnimation([this], $dataSkills[this._oracleEvent].animationId);
					BattleManager._specialSkill = this._oracleEvent;
					BattleManager._specialTargets = [this];
					BattleManager._phase = 'specialDamage';
					this.removeState(14);
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

			this._oracleCountSprite.setup(battler);
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
		
		//宣告で使う
		this._oracleCountSprite = new Sprite_OracleCount();
		this._oracleCountSprite.y = -60;
    	this.addChild(this._oracleCountSprite);
	};
	var MStEf_SpAc_updateFrame = Sprite_Actor.prototype.updateFrame;
	Sprite_Actor.prototype.updateFrame = function() {
		MStEf_SpAc_updateFrame.call(this);
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
			this._mainSprite._colorTone = [100,-60,-60, 0];
        } else {
            this._mainSprite._colorTone = [0,0,0,0];
        }
	 }
	 
	// 混乱で向かい合う
	var MStEf_SpAc_updateTargetPosition = Sprite_Actor.prototype.updateTargetPosition;
	Sprite_Actor.prototype.updateTargetPosition = function() {
		if (this._actor.isStateAffected(8) || this._actor.isStateAffected(9)) {
			this.startMove(-96, 0, 12);
		} else {
			MStEf_SpAc_updateTargetPosition.call(this);
		}
	};
	var MStEf_SpAc_updateMotion = Sprite_Actor.prototype.updateMotion;
	Sprite_Actor.prototype.updateMotion = function() {
		MStEf_SpAc_updateMotion.call(this);
		this.scale.x = 1;
		if (this._actor.isStateAffected(8) || this._actor.isStateAffected(9)) this.scale.x *= -1;
	};
	var MStEf_SpEn_update = Sprite_Enemy.prototype.update;
	Sprite_Enemy.prototype.update = function() {
		MStEf_SpEn_update.call(this);
		this.scale.x = 1;
		if (this._enemy && this._enemy.isStateAffected(8)) this.scale.x *= -1;
		this._oracleCountSprite.y = this.countOffsetY();
	};

	// 宣告カウントSprite紐づけ
	Sprite_Actor.prototype.countOffsetY = function() {
		return -50;
	}
	var MStEf_SpEn_initMembers = Sprite_Enemy.prototype.initMembers;
	Sprite_Enemy.prototype.initMembers = function() {
		MStEf_SpEn_initMembers.call(this);
		this._oracleCountSprite = new Sprite_OracleCount();
    	this.addChild(this._oracleCountSprite);
	};
	var MStEf_SpEn_setBattler = Sprite_Enemy.prototype.setBattler;
	Sprite_Enemy.prototype.setBattler = function(battler) {
		MStEf_SpEn_setBattler.call(this, battler);
		this._oracleCountSprite.setup(battler);
	};
	Sprite_Enemy.prototype.countOffsetY = function() {
		return -this._frame.height;
	}

	// 宣告カウントSprite
	function Sprite_OracleCount() {
		this.initialize.apply(this, arguments);
	}
	Sprite_OracleCount.prototype = Object.create(Sprite.prototype);
	Sprite_OracleCount.prototype.constructor = Sprite_OracleCount;
	Sprite_OracleCount.prototype.initialize = function() {
		Sprite.prototype.initialize.call(this);
		this._countBitmap = ImageManager.loadSystem('Damage');
	};
	Sprite_OracleCount.prototype.setup = function(battler) {
		this._battler = battler;
		var w = this.digitWidth();
		var h = this.digitHeight();
		for (var i = 0; i < 2; i++) {
			var sprite = this.createChildSprite();
			sprite.setFrame(9 * w, 4 * h, w, h);
			sprite.x = (i - 1 / 2) * w;
			sprite.dy = -i;
		}
		this.scale.x = 0.5;
		this.scale.y = 0.5;
	};
	Sprite_OracleCount.prototype.createChildSprite = function() {
		var sprite = new Sprite();
		sprite.bitmap = this._countBitmap;
		sprite.anchor.x = 0.5;
		sprite.anchor.y = 1;
		sprite.ry = sprite.y;
		this.addChild(sprite);
		return sprite;
	};
	Sprite_OracleCount.prototype.digitWidth = function() {
		return this._countBitmap ? this._countBitmap.width / 10 : 0;
	};
	Sprite_OracleCount.prototype.digitHeight = function() {
		return this._countBitmap ? this._countBitmap.height / 5 : 0;
	};
	Sprite_OracleCount.prototype.update = function() {
		Sprite.prototype.update.call(this);
		if (this._battler) {
			if (this._battler.isStateAffected(14)) {
				var count = this._battler._oracleCount % 100;
				this.updateChild(this.children[0], Math.floor(count / 10) );
				this.updateChild(this.children[1], count % 10 );
			} else {
				this.updateChild(this.children[0], -1 );
				this.updateChild(this.children[1], -1 );
			}
		}
	};
	Sprite_OracleCount.prototype.updateChild = function(child, digit) {
		var w = this.digitWidth();
		var h = this.digitHeight();
		if (digit < 0) child.setFrame(9 * w, 4 * h, w, h);
		else {
			child.setFrame(digit * w, 0 * h, w, h);
		}
	};

})();