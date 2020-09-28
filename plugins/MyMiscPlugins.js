/*:
 * @plugindesc 細かなプラグイン集
 * @author paisuygoda
 * @help 本体js編集用
 */

(function() {

    // エンカウント率調整 n-(n+10)歩でエンカウント
    Game_Player.prototype.makeEncounterCount = function() {
    var n = $gameMap.encounterStep();
    this._encounterCount = Math.randomInt(10) + n;
    };


    // 戦闘開始時メッセージ省略
    BattleManager.displayStartMessages = function() {
	};


	// 戦闘終了後メッセージ表示短縮
	BattleManager.displayExp = function() {
	    var exp = this._rewards.exp;
	    if (exp > 0) {
	        var text = TextManager.obtainExp.format(exp, TextManager.exp);
	        $gameMessage.add('\\.\\>' + text);
	    }
	};
	BattleManager.displayGold = function() {
	    var gold = this._rewards.gold;
	    if (gold > 0) {
	        $gameMessage.add('\\>' + TextManager.obtainGold.format(gold));
	    }
	};
	BattleManager.displayDropItems = function() {
	    var items = this._rewards.items;
	    if (items.length > 0) {
	        $gameMessage.newPage();
	        items.forEach(function(item) {
	            $gameMessage.add('\\>' + TextManager.obtainItem.format(item.name));
	        });
	    }
	};


	// パーティーコマンドからたたかうを削除
	Window_PartyCommand.prototype.makeCommandList = function() {
	    this.addCommand(TextManager.escape, 'escape', BattleManager.processEscape());
	};


	// アビリティは防具に数えない
	Window_ItemList.prototype.includes = function(item) {
	    switch (this._category) {
	    case 'item':
	        return DataManager.isItem(item) && item.itypeId === 1;
	    case 'weapon':
	        return DataManager.isWeapon(item);
	    case 'armor':
	        return DataManager.isArmor(item) && item.etypeId != 6;
	    case 'keyItem':
	        return DataManager.isItem(item) && item.itypeId === 2;
	    default:
	        return false;
	    }
	};


	// 敵にもレベル導入
	Game_Enemy.prototype.setup = function(enemyId, x, y) {
	    this._enemyId = enemyId;
	    this._screenX = x;
	    this._screenY = y;
	    this._level = $dataEnemies[enemyId].level;
	    this.cursorX = $dataEnemies[enemyId].cursorX;
	    this.cursorY = $dataEnemies[enemyId].cursorY;
	    this.recoverAll();
	};

	/*
	// 敵の行動時光る
	Sprite_Enemy.prototype.startWhiten = function() {
		this._effectDuration = 24;
	};
	Sprite_Enemy.prototype.updateWhiten = function() {
		if (this._effectDuration > 8) {
			if (this._effectDuration % 8 > 4) this.setBlendColor([255, 255, 255, 255]);
			else this.setBlendColor([0, 0, 0, 255]);
		} else {
				this.setBlendColor([0, 0, 0, 0]);
		}
	};
	*/
	// 敵の行動時光る
	Sprite_Enemy.prototype.startWhiten = function() {
		this._effectDuration = 30;
	};
	Sprite_Enemy.prototype.updateWhiten = function() {
		if (this._effectDuration > 10 && this._effectDuration % 10 > 5) {
			this.setBlendColor([255, 255, 255, 255]);
			var glowFilter = new PIXI.filters.GlowFilter(4, 4, 4, 0x000000);
			this.filters = [glowFilter];
		}
		else {
			this.setBlendColor([0, 0, 0, 0]);
			this.filters = [];
		}
	};

	//スキルのダメージ表示設定読み込み
	var _loaded_DamagePopUp_Setting = false;
	var DaMaSkill_isDatabaseLoaded = DataManager.isDatabaseLoaded;
	DataManager.isDatabaseLoaded = function() {
	if (!DaMaSkill_isDatabaseLoaded.call(this)) return false;
	if (!_loaded_DamagePopUp_Setting) {
		this.processNotetagsDamagePopUp($dataSkills);
		_loaded_DamagePopUp_Setting = true;
	}
		return true;
	};
	DataManager.processNotetagsDamagePopUp = function(group) {
		var noteCounter = /<(?:DamageNotPopUp)>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj.counterType = 0;

			obj._damagePopUp = true;
			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteCounter)) {
					obj._damagePopUp = false;
				}
			}
		}
	};
	// 瀕死攻撃などではダメージ表示しない
	BattleManager.invokeNormalAction = function(subject, target) {
		this._action.apply(target);
		if (!$dataSkills[this._action._item._itemId]._damagePopUp) {
			target.clearDamagePopup();
			target.clearResult();
		}
		this._logWindow.displayActionResults(subject, target);
	};

	// 宣告の読み込み
	var _loaded_Oracle_Setting = false;
	var DaMa_isDatabaseLoaded = DataManager.isDatabaseLoaded;
	DataManager.isDatabaseLoaded = function() {
	if (!DaMa_isDatabaseLoaded.call(this)) return false;
	if (!_loaded_Oracle_Setting) {
		this.processNotetagsOracle($dataSkills);
		_loaded_Oracle_Setting = true;
	}
		return true;
	};
	DataManager.processNotetagsOracle = function(group) {
		var noteOracle = /<(?:OracleSkill):[ ](\d+)>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj._oracleSkill = false;

			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteOracle)) {
					obj._oracleSkill = parseInt(RegExp.$1);
				}
			}
		}
	};
	
	// 味方をもう少し右端へ寄せる
	Sprite_Actor.prototype.setActorHome = function(index) {
		this.setHome(650 + index * 20, 250 + index * 56);
	};

	
	// Sprite_Actorに1フレーム1ピクセルでは速すぎる動きの隔Xフレーム判断用にclockを仕込む
	Sprite_Actor.prototype.update = function() {
		Sprite_Battler.prototype.update.call(this);
		this.updateShadow();
		this.updateClock();
		if (this._actor) {
			this.updateMotion();
		}
	};
	Sprite_Actor.prototype.updateClock = function() {
		if (++this._clock === 60) this._clock = 0;
	};

	// 敵にダメージ与えた時の点滅をなくす
	Game_Enemy.prototype.performDamage = function() {
		Game_Battler.prototype.performDamage.call(this);
		SoundManager.playEnemyDamage();
		// this.requestEffect('blink');
	};

	// 戦闘不能者対象の技が生存者に当たった場合、デフォルトでは戦闘不能者にターゲットをずらすが
	// そのまま生存者に当てるよう変更(アンデッドに蘇生技を当てるため)
	Game_Action.prototype.targetsForFriends = function() {
		var targets = [];
		var unit = this.friendsUnit();
		if (this.isForUser()) {
			return [this.subject()];
		} else if (this.isForDeadFriend()) {
			if (this.isForOne()) {
				//targets.push(unit.smoothDeadTarget(this._targetIndex));
				targets.push(unit.members()[this._targetIndex]);
			} else {
				targets = unit.deadMembers();
			}
		} else if (this.isForOne()) {
			if (this._targetIndex < 0) {
				targets.push(unit.randomTarget());
			} else {
				targets.push(unit.smoothTarget(this._targetIndex));
			}
		} else {
			targets = unit.aliveMembers();
		}
		return targets;
	};

	// 接地技リスト
	var surfaceSkills = [9];

	// targetへのアニメーション表示は行いつつダメージ計算は行わない場合ここに書く
	Game_Action.prototype.testApply = function(target) {
		// レビテト者が接地技を食らったらアニメーションは表示しつつそれを無効にする(接地技は手書きで指定、一部地属性技はレビテト回避されると不自然なため)
		if (target.isStateAffected(22) && surfaceSkills.contains(this._item._itemId)) return false;
		return (
				// 戦闘不能者対象の技が生存者にもあたる（アンデッドに蘇生技を当てるため）
				(this.isForDeadFriend() === target.isDead() || this.isForDeadFriend()) &&
				($gameParty.inBattle() || this.isForOpponent() ||
				(this.isHpRecover() && target.hp < target.mhp) ||
				(this.isMpRecover() && target.mp < target.mmp) ||
				(this.hasItemAnyValidEffects(target))));
	};

	// 敵消滅を早く
	Sprite_Enemy.prototype.startCollapse = function() {
		this._effectDuration = 16;
		this._appeared = false;
	};
	// 敵消滅時、黒くなる
	Sprite_Enemy.prototype.updateCollapse = function() {
		this.blendMode = Graphics.BLEND_ADD;
		this.setBlendColor([90, 0, 90, 128]);
		this.opacity *= this._effectDuration / (this._effectDuration + 1);
	};

})();