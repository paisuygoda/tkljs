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
	// アンデッドなどのパッシブステートはクリアされない
	Game_BattlerBase.prototype.clearStates = function() {
		// リセット時
		if (this._states) {
			// パッシブステート記憶
			var isUndead = this._states.indexOf(11) >= 0;
			// 行動不能耐性記憶
			var isResistStun = this._states.indexOf(26) >= 0;
			// 瀕死耐性記憶
			var isBoss = this._states.indexOf(35) >= 0;

			// clearState
			this._states = [];
			this._stateTurns = {};
			this._stateStartTurn = {};
			this._blinks = 0;

			// パッシブステート復帰
			if (isUndead) this._states.push(11);
			// 行動不能耐性復帰
			if (isResistStun) this._states.push(26);
			// 瀕死耐性復帰
			if (isBoss) this._states.push(35);

		// 初期化時
		} else {
			this._states = [];
			this._stateTurns = {};
			this._stateStartTurn = {};
			this._blinks = 0;
		}
	};

	// リレイズ要求
	Game_BattlerBase.prototype.die = function() {
		if (this.isStateAffected(33)) {
			BattleManager._specialSkills.push({
				skillId		:	16, // # リレイズのスキルIDに書き換え
				targets 	:	[this],
				origin 		:	'rerise'
			});
		}
		this._hp = 0;
		this.clearStates();
		this.clearBuffs();
	};

	// ステートを付与するとき起点ターンも登録する
	Game_BattlerBase.prototype.resetStateCounts = function(stateId) {
		var state = $dataStates[stateId];
		var stunStates = [6, 17, 28];
		var duration = 1;
		// 持続ターン数決定
		if (this.isStateAffected(26) && stunStates.indexOf(stateId) >= 0) {
			duration = 5;
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

	// 石化状態にはステート付与させない
	// ゾンビなら死んでても付与する
	var MStEf_GaBa_isStateAddable = Game_Battler.prototype.isStateAddable;
	Game_Battler.prototype.isStateAddable = function(stateId) {
		if (stateId === 25) {
			return !this.isStateResist(stateId) && !this._result.isStateRemoved(stateId) && !this.isStateAffected(24);
		}
		else return MStEf_GaBa_isStateAddable.call(this, stateId) && !this.isStateAffected(24);
	};

	// 持続ターン数を決めてからステート付与(持続ターン決めでステートにかかっているかを参照するため)
	Game_Battler.prototype.addState = function(stateId) {
	    if (this.isStateAddable(stateId)) {
			this.resetStateCounts(stateId);
			
	        if (!this.isStateAffected(stateId)) {

				// デスは戦闘不能を耐性無視で付与し、アンデッドは全快させる
				if (stateId === 37) {
					if (this.isStateAffected(11)) {
						this.setHp(this.mhp);
						this.performReanimate();
					}
					else {
						this.addNewState(1);
						this._result.pushAddedState(1);
					}
				}
				// 即死は戦闘不能を耐性無視で付与
				else if (stateId === 38) {
					this.addNewState(1);
					this._result.pushAddedState(1);
				}
				// 敵が石化/ゾンビ化したらそのステートではなく戦闘不能を耐性無視で付与
				else if ((stateId === 24 || stateId === 25) & this.isEnemy()) {
					this.addNewState(1);
					this._result.pushAddedState(1);
				}
				// 味方が石化したら一部のステート削除
				else if (stateId === 24) {
					this.addNewState(stateId);
					var nonStoneStates = [4,5,6,7,8,9,15,16,17,18,19,20,21,22,23,27,28,29,30,31,34];
					var actor = this;
					nonStoneStates.forEach(function(tempstate){actor.removeState(tempstate);});
				}
				// ストップor凍結した場合分身削除
				else if (stateId === 17 || stateId === 30) {
					this.addNewState(stateId);
					this.removeState(27);
				}
				// 生きたままゾンビになったら死亡処理を挟む
				else if (stateId === 25) {
					this._hp = 0;
					this.clearStates();
					this.clearBuffs();
					this.addNewState(stateId);
				}
				// アンデッドがゾンビ攻撃受けても効果なし
				else if (stateId === 25 && this.isStateAffected(11));
				// ゾンビがアンデッド化したらゾンビ回復→アンデッド付与する。ただしこの処理は起きない想定
				else if (this.isStateAffected(25) && stateId === 11) {
					this.removeState(25);
					this.addNewState(stateId);
				}
				else {
					this.addNewState(stateId);}

				// ヘイスト/スロウ排他処理
				if (stateId === 18 && this.isStateAffected(19)) this.removeState(19);
				else if (stateId === 19 && this.isStateAffected(18)) this.removeState(18);

				this.refresh();
			
			// カエル・小人は重ねがけで解除
			} else if (stateId === 12 || stateId === 13) this.removeState(stateId);
			
			// 分身の場合2枚追加(MAX3枚)
			if (stateId === 27) {
				this._blinks = Math.min(this._blinks + 2, 3);
			}
	        this._result.pushAddedState(stateId);
	    }
	};

	// # 本当は死亡SEじゃないのが欲しい
	Game_Actor.prototype.performReanimate = function() {
		if ($gameParty.inBattle()) {
			SoundManager.playActorCollapse();
		}
	};
	Game_Enemy.prototype.performReanimate = function() {
		this.requestEffect('reanimate');
		SoundManager.playEnemyCollapse();
	};

	// アンデッド復活エフェクト追加
	Sprite_Enemy.prototype.startEffect = function(effectType) {
		this._effectType = effectType;
		switch (this._effectType) {
		case 'appear':
			this.startAppear();
			break;
		case 'disappear':
			this.startDisappear();
			break;
		case 'whiten':
			this.startWhiten();
			break;
		case 'blink':
			this.startBlink();
			break;
		case 'collapse':
			this.startCollapse();
			break;
		case 'bossCollapse':
			this.startBossCollapse();
			break;
		case 'instantCollapse':
			this.startInstantCollapse();
			break;
		case 'reanimate':
			this.startReanimate();
			break;
		}
		this.revertToNormal();
	};
	Sprite_Enemy.prototype.startReanimate = function() {
		this._effectDuration = 64;
		BattleManager._waitAnim = 64;
	};
	Sprite_Enemy.prototype.updateEffect = function() {
		this.setupEffect();
		if (this._effectDuration > 0) {
			this._effectDuration--;
			switch (this._effectType) {
			case 'whiten':
				this.updateWhiten();
				break;
			case 'blink':
				this.updateBlink();
				break;
			case 'appear':
				this.updateAppear();
				break;
			case 'disappear':
				this.updateDisappear();
				break;
			case 'collapse':
				this.updateCollapse();
				break;
			case 'bossCollapse':
				this.updateBossCollapse();
				break;
			case 'instantCollapse':
				this.updateInstantCollapse();
				break;
			case 'reanimate':
				this.updateReanimate();
				break;
			}
			if (this._effectDuration === 0) {
				this._effectType = null;
			}
		}
	};
	Sprite_Enemy.prototype.updateReanimate = function() {
		if (this._effectDuration > 48) {
			this.blendMode = Graphics.BLEND_MULTIPLY;
			this.setBlendColor([90, 0, 90, 128]);
			this.opacity *= (this._effectDuration - 48) / (this._effectDuration - 47);
		} else if (this._effectDuration > 32) {
			this.blendMode = Graphics.BLEND_NORMAL;
			this.opacity = 0;
		} else {
			var rate = this._effectDuration / 32;
			this.opacity = (1 - rate) * 255;
			this.setBlendColor([90, 0, 90, 255 * rate]);
		}
	};

	// エフェクトが中断された時の戻し対象にfilterを追加
	var MStEf_SpEn_revertToNormal = Sprite_Enemy.prototype.revertToNormal;
	Sprite_Enemy.prototype.revertToNormal = function() {
		MStEf_SpEn_revertToNormal.call(this);
		this.filters = [];
	};

	Game_Battler.prototype.removeState = function(stateId) {
		// 死亡アンデッドに蘇生をかけても何も起きない
		if (this.isStateAffected(stateId) &&  this.isStateAffected(11));
		else if (this.isStateAffected(stateId)) {
			// ゾンビ解除時もhp1で回復
			if (stateId === this.deathStateId() || stateId === 25) {
				this.revive();
			// 分身解除の場合枚数を0にする
			} else if (stateId === 27) this._blinks = 0;
			this.eraseState(stateId);
			this.refresh();
			this._result.pushRemovedState(stateId);
		
		// 生存アンデッドがレイズorゾンビ回復効果を受けると即死
		} else if (this.isStateAffected(11) && (stateId === this.deathStateId() || stateId === 25)) {
			this.addState(this.deathStateId());
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
		var fineMembers = this.members().filter(function(member) {
            return !(member.isAppeared() && (member.isDeathStateAffected() || member.isStateAffected(24) || member.isStateAffected(25)));
        });
		return fineMembers.length === 0;
	};

	Game_Party.prototype.isAllDead = function() {
    if (Game_Unit.prototype.isAllDead.call(this)) {
        return !this.isEmpty();
    } else {
        return false;
    }
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
		// アンデッドの時、HPがあれば自動で戦闘不能解除する処理を外す（常時蘇生効果を受けてしまって即死するのを防ぐ）
		} else if (this.hp != 0 && !this.isStateAffected(11)) {
			this.removeState(this.deathStateId());
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
				BattleManager._logWindow.push('clear');
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
			if (this.activating(4, 20)){
				var value = Math.floor(this.mhp * -this._poisonProgress++ / 20);
				value = Math.min(value, -1) * this.elementRate(10);
				if (value !== 0) {
					this.result().clear();
					this.gainHp(value);
				}
			}
			// 宣告
			if (this.activating(14, 10)){
				if (--this._oracleCount === 0 ) {
					BattleManager._specialSkills.push({
						skillId		:	this._oracleEvent,
						targets 	:	[this],
						origin 		:	'oracle' // 宣告
					});
					this.removeState(14);
				}
			}
			// リジェネ
			if (this.activating(20, 20)){
				var value = Math.floor(this.mhp / 10);
				value = Math.max(value, 1);
				if (value !== 0) {
					this.gainHp(value);
				}
			}
			// オールド
			if (this.activating(29, 10)){
				if (this.blv > 1) this.blv--;
			}
			// 精神波
			if (this.activating(34, 20)){
				var value = Math.floor(this.mmp / 20);
				value = Math.max(value, 1);
				if (value !== 0) {
					this.gainMp(value);
				}
			}
	    }
	};
	Game_Battler.prototype.activating = function(stateId, interval) {
		if (this.isPassiveStateAffected(stateId)) {
			return BattleManager._turnCount % interval === 0;
		} else if (this.isStateAffected(stateId)) {
			return BattleManager._turnCount % interval === this._stateStartTurn[stateId] % interval;
		}
	}

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

		// 分身部分
		this._blinkSprite = new Sprite_Base();
		this._blinkSprite.visible = false;
		this._blinkSprite.blinkPosition = 0;
		this.addChild(this._blinkSprite);
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
			if (this._battler.isStateAffected(8) || this._battler.isStateAffected(9)) this.scale.x = -1;
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
		21 : 0x0080FF, //リフレク
		29 : 0x804000  //老化
	};
	Game_BattlerBase.prototype.glowStates = function() {
		return this._states.concat(this.passiveStatesRaw()).filter(function(stateId) {
			return [15, 16, 17, 18, 19, 21, 29].contains(stateId);
		});
	};
	var MStEf_SpAc_initMembers = Sprite_Actor.prototype.initMembers;
	Sprite_Actor.prototype.initMembers = function() {
		MStEf_SpAc_initMembers.call(this);
		this._glowIndex = 0;
		this._glowFrame = 0;
		this._glowColor = 0x000000;
		this._levitateOffset = 0;
		this._levitateUpward = true;
		// 1フレーム1ピクセルでは速すぎる動きの隔Xフレーム判断用
		this._clock = 0;
		
		//宣告で使う
		this._oracleCountSprite = new Sprite_OracleCount();
		this._oracleCountSprite.y = -60;
    	this.addChild(this._oracleCountSprite);
	};
	Sprite_Actor.prototype.updateFrame = function() {
		Sprite_Battler.prototype.updateFrame.call(this);
		var bitmap = this._mainSprite.bitmap;
		if (bitmap) {
			var motionIndex = this._motion ? this._motion.index : 0;
			var pattern = this._pattern < 3 ? this._pattern : 1;
			var cw = bitmap.width / 9;
			var ch = bitmap.height / 6;
			var cx = Math.floor(motionIndex / 6) * 3 + pattern;
			var cy = motionIndex % 6;
			this._mainSprite.setFrame(cx * cw, cy * ch, cw, ch);
		}

		// 輪郭線エフェクトフィルタ
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

		// 分身描画
		if (this._actor._blinks > 0) {
			this._blinkSprite.blinkPosition += 1;
			this._blinkSprite.blinkPosition %= 3;
			if (this._blinkSprite.blinkPosition < this._actor._blinks) {
				this._blinkSprite.setFrame(cx * cw, cy * ch, cw, ch);
				this._blinkSprite.anchor.x = 0.2 - this._blinkSprite.blinkPosition * 0.3;
    			this._blinkSprite.anchor.y = 1;
				this._blinkSprite.visible = true;
			} else this._blinkSprite.visible = false;
		} else {
			this._blinkSprite.visible = false;
		}
	};

	// 全身の色が変わる系、これは排他
    Sprite_Actor.prototype.alterSpriteByState = function() {
		if (!this._actor) return;
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
		
		// 小人処理
		if (this._actor.isStateAffected(13)) {
			this.scale.x = 0.3;
			this.scale.y = 0.3;
        } else {
			this.scale.x = 1;
			this.scale.y = 1;
		}
	};

    Sprite_Actor.prototype.refreshMotion = function() {
	
		// 色変え処理を先に呼ぶ
		this.alterSpriteByState();

        var actor = this._actor;
		var motionGuard = Sprite_Actor.MOTIONS['guard'];
		if (actor) {
			actor._isInMotion = false;
			if ((this._motion === motionGuard) && !BattleManager.isInputting()) {
					return;
			}
			// かばう移動量リセット
			actor._substitutePosition = 0;
			var stateMotion = actor.stateMotionIndex();
			if (actor.isInputting() || actor.isActing()) {
				this.startMotion('walk');
			} else if (stateMotion === 3) {
				this.startMotion('dead');
			} else if (stateMotion === 2) {
				this.startMotion('sleep');
			} else if (actor.isChanting()) {
				this.startMotion('chant');
			} else if (actor.isGuard() || actor.isGuardWaiting()) {
				this.startMotion('guard');
			} else if (stateMotion === 1) {
				this.startMotion('abnormal');
			// ゾンビなら瀕死モーションはとらない
			} else if (actor.isDying() && !actor.isStateAffected(25)) {
				this.startMotion('dying');
			} else if (actor.isUndecided()) {
				this.startMotion('walk');
			} else {
				this.startMotion('wait');
			}
		}
	 }

	// レビテト時の浮遊モーション
	Sprite_Actor.prototype.updatePosition = function() {
		if(!this._actor.isStateAffected(22)) {
			this._levitateOffset = 0;
			this._levitateUpward = true;
		} else if (this._clock % 5 === 0) {
			if (this._levitateUpward) {
				this._levitateOffset++;
				if (this._levitateOffset > 9) this._levitateUpward = false;
			} else {
				this._levitateOffset--;
				if (this._levitateOffset === 0) this._levitateUpward = true;
			}
		}

		// かばう時の移動量設定
		var substituteX;
		var substituteY;
		if (this._actor._substitutePosition != 0) {
			substituteX = 20 * this._actor._substitutePosition - 40;
			substituteY = 56 * this._actor._substitutePosition;
		} else {
			substituteX = 0;
			substituteY = 0;
		}

		// 直接攻撃分の移動距離も追加
		this.x = this._homeX + this._offsetX + substituteX + this._attackX;
		this.y = this._homeY + this._offsetY + substituteY + this._attackY - this.getAttackAltitude() - this._levitateOffset;

		if (this.isVisibleAfterimage()) {
            this.updateAfterimages();
        } else if (this._afterimageLocus.length > 0) {
            this._afterimageLocus = [];
        }
	};
	
	// レビテト時の浮遊モーションの影
	Sprite_Actor.prototype.updateShadow = function() {
		/*
		this._shadowSprite.visible = !!this._actor;
		this._shadowSprite.y = -2 + this._levitateOffset;
		*/
		// よく動かす都合で影がないほうが描画しやすいので消す
		this._shadowSprite.visible = false;
	};

	// Enemyの小人処理
	Sprite_Enemy.prototype.update = function() {
		Sprite_Battler.prototype.update.call(this);
		if (this._enemy) {
			this.updateEffect();
			this.updateStateSprite();

			// 輪郭線エフェクトフィルタ
			if (this._glowFrame === 0) {
				if (this._battler.glowStates().length > 0) {
					this._glowFrame = 1;
					this._glowIndex = this._glowIndex + 1 >= this._enemy.glowStates().length ? 0 : this._glowIndex + 1;
					this._glowColor = colorDict[this._enemy.glowStates()[this._glowIndex]];
				}
			} else if (++this._glowFrame === 120) this._glowFrame = 0; 
			var blightness = (this._glowFrame > 60 ? 120 - this._glowFrame : this._glowFrame) / 30 ;
			var glowFilter = new PIXI.filters.GlowFilter(6, blightness, blightness, this._glowColor);
			this.filters = [glowFilter];

			if (this._enemy.isStateAffected(13)) {
				this.scale.x = 0.3;
				this.scale.y = 0.3;
			} else {
				this.scale.x = 1;
				this.scale.y = 1;
			}

			if (this._enemy._blinks > 0) {
				this._blinkSprite.blinkPosition += 1;
				this._blinkSprite.blinkPosition %= 3;
				if (this._blinkSprite.blinkPosition < this._enemy._blinks) {
					this._blinkSprite.visible = true;
					this._blinkSprite.anchor.x = 0.65 + this._blinkSprite.blinkPosition * 0.15;
					this._blinkSprite.anchor.y = 1;
				} else this._blinkSprite.visible = false;
			} else {
				this._blinkSprite.visible = false;
			}
		}
	};
	 
	var MStEf_SpAc_updateTargetPosition = Sprite_Actor.prototype.updateTargetPosition;
	Sprite_Actor.prototype.updateTargetPosition = function() {
		//戦線離脱の時画面外に出る
		if (this._actor.isStateAffected(32)) {
			this.startMove(300, 0, 30);
		// 混乱or魅了で向かい合う
		} else if (this._actor.isStateAffected(8) || this._actor.isStateAffected(9)) {
			this.startMove(-75, 0, 12);
		} else {
			MStEf_SpAc_updateTargetPosition.call(this);
		}
	};
	var MStEf_SpAc_updateMotion = Sprite_Actor.prototype.updateMotion;
	Sprite_Actor.prototype.updateMotion = function() {
		MStEf_SpAc_updateMotion.call(this);
		if (this._actor.isStateAffected(8) || this._actor.isStateAffected(9)) this.scale.x *= -1;
	};
	var MStEf_SpEn_update = Sprite_Enemy.prototype.update;
	Sprite_Enemy.prototype.update = function() {
		MStEf_SpEn_update.call(this);
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
		this._glowIndex = 0;
		this._glowFrame = 0;
		this._glowColor = 0x000000;
		this._oracleCountSprite = new Sprite_OracleCount();
    	this.addChild(this._oracleCountSprite);
		this._blinkSprite = new Sprite_Base();
		this._blinkSprite.visible = false;
		this._blinkSprite.blinkPosition = 0;
    	this.addChild(this._blinkSprite);
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

	// カエル状態の時Spriteをカエルに変更
	Game_Player.prototype.refresh = function() {
		var actor = $gameParty.leader();
		var characterName = actor ? actor.characterName() : '';
		var characterIndex = actor ? actor.characterIndex() : 0;
		this._isFrog = actor.isStateAffected(12) ? true : false;
		this.setImage(characterName, characterIndex);
		this._followers.refresh();
	};
	Sprite_Character.prototype.updateBitmap = function() {
		if (this.isImageChanged()) {
			this._tilesetId = $gameMap.tilesetId();
			this._tileId = this._character.tileId();
			if (this._character._isFrog){
				this._characterName = 'Frog';
				this._characterIndex = 0;
			} else {
				this._characterName = this._character.characterName();
				this._characterIndex = this._character.characterIndex();
			}
			if (this._tileId > 0) {
				this.setTileBitmap();
			} else {
				this.setCharacterBitmap();
			}
		}
	};
	Window_Base.prototype.drawActorFace = function(actor, x, y, width, height) {
		if (actor && actor.isStateAffected(12)) this.drawFace('Frog', 0, x, y, width, height);
		else this.drawFace(actor.faceName(), actor.faceIndex(), x, y, width, height);
	};
	var MyStEf_SpBa_initMembers = Sprite_Battler.prototype.initMembers;
	Sprite_Battler.prototype.initMembers = function() {
		MyStEf_SpBa_initMembers.call(this);
		this._isFrog = false;
	};
	Sprite_Actor.prototype.updateBitmap = function() {
		Sprite_Battler.prototype.updateBitmap.call(this);
		var name = this._actor.battlerName();
		if (this._isFrog !== this._actor.isStateAffected(12)) {
			if (this._actor.isStateAffected(12)) this._mainSprite.bitmap = ImageManager.loadSvActor('Frog');
			else this._mainSprite.bitmap = ImageManager.loadSvActor(name);
			this._isFrog = this._actor.isStateAffected(12);
		} else if (this._battlerName !== name) {
			this._battlerName = name;
			this._mainSprite.bitmap = ImageManager.loadSvActor(name);
		}
		// 分身にbitmapをコピー
		this._blinkSprite.bitmap = this._mainSprite.bitmap;
	};
	Sprite_Enemy.prototype.updateBitmap = function() {
		Sprite_Battler.prototype.updateBitmap.call(this);
		var name = this._enemy.battlerName();
		var hue = this._enemy.battlerHue();
		if (this._isFrog !== this._enemy.isStateAffected(12)) {
			if (this._enemy.isStateAffected(12)) this.loadBitmap('Frog', hue);
			else this.loadBitmap(name, hue);
			this._isFrog = this._enemy.isStateAffected(12);
		} else if (this._battlerName !== name || this._battlerHue !== hue) {
			this._battlerName = name;
			this._battlerHue = hue;
			this.loadBitmap(name, hue);
			this.initVisibility();
		}
		// 分身にbitmapをコピー
		this._blinkSprite.bitmap = this.bitmap;
	};

	// 小人の時回避率2倍(盾とかは関係ない)
	Game_Action.prototype.itemEva = function(target) {
		var eva = 0;
		if (this.isPhysical()) {
			// target分身時、分身を一枚減らして回避率100%にする
			if (target.isStateAffected(27)) {
				if (--target._blinks === 0) target.removeState(27);
				eva = 1;
			} else if (target.isStateAffected(31)) {
				eva = 1;
			}else eva = target.eva;
		} else {
			if (target.isStateAffected(31)) target.removeState(31);
			if (this.isMagical()) {
				eva = target.mev;
			}
		}
		if (target.isStateAffected(13)) eva *= 2;
		
		return eva;
	};

	// ゾンビの時HPの文字は赤色だが瀕死モーションはとらない
	Window_Base.prototype.hpColor = function(actor) {
		if (actor.hp === 0) {
			return this.deathColor();
		} else if (actor.isDying()) {
			return this.crisisColor();
		} else {
			return this.normalColor();
		}
	};
	//Sprite_Actor.prototype.refreshMotionの処理はL641に書いた

	Sprite_Actor.prototype.updateMotionCount = function() {
		if (this._motion && ++this._motionCount >= this.motionSpeed()) {
			if (this._motion.loop) {
				// 動けないステートの時は止まる
				if (this._actor.isStateAffected(17) || this._actor.isStateAffected(24) || this._actor.isStateAffected(30)) {
					this._pattern = 3;
				} else {
					this._pattern = (this._pattern + 1) % 4;
				}
			} else if (this._pattern < 2) {
				this._pattern++;
			} else {
				this.refreshMotion();
			}
			this._motionCount = 0;
		}
	};

})();