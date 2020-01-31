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


	// 物理攻撃のみかばう
	BattleManager.checkSubstitute = function(target) {
	    return target.isDying() && this._action.isPhysical();
	};


	// HP高い順にかばう
	Game_Unit.prototype.substituteBattler = function() {
	    var members = this.members().sort(function(a, b) {
	        var p1 = a.hp / a.mhp;
	        var p2 = b.hp / b.mhp;
	        if (p1 !== p2) {
	            return p2 - p1;
	        }
	        return a - b;
	    });
	    for (var i = 0; i < members.length; i++) {
	        if (members[i].isSubstitute()) {
	            return members[i];
	        }
	    }
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
		var noteCounter = /<(?:DamagePopUp):[ ](\d+)>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj.counterType = 0;

			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteCounter)) {
					if (parseInt(RegExp.$1) == '0') obj._damagePopUp = false;
					else obj._damagePopUp = true;
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

	// 属性耐性は累計でなく一番有利な耐性のみを取る
	// 吸収>無効>半減>弱点
	Game_BattlerBase.prototype.elementRate = function(elementId) {
		// ついでに凍結解除
		if (this.isStateAffected(30) && elementId === 1) this.removeState(30);
		return this.traitsWithId(Game_BattlerBase.TRAIT_ELEMENT_RATE, elementId).reduce(function(r, trait) {
			if (trait.value === 0) return -1;
			if (trait.value === 0.01) return Math.min(r, 0);
			else return Math.min(r, trait.value);
		}, 1);
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
	
	// 味方をもう少し左端へ寄せる
	Sprite_Actor.prototype.setActorHome = function(index) {
		this.setHome(650 + index * 20, 250 + index * 56);
	};

})();