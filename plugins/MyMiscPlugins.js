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
	    this.rat = $dataEnemies[enemyId].rate;
	    this.mrt = $dataEnemies[enemyId].mrate;
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
		this.processNotetagsHalfEvasion($dataSkills);
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
	// 相手の回避率半減で計算する特徴を作成
	DataManager.processNotetagsHalfEvasion = function(group) {
		var noteHalfEva = /<(?:HalfEvasion)>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj._halfEva = false;
			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteHalfEva)) {
					obj._halfEva = true;
				}
			}
		}
	};
	// 瀕死攻撃などではダメージ表示しない
	BattleManager.invokeNormalAction = function(subject, target) {
		this._action.apply(target);
		if (!$dataSkills[this._action._item._itemId]._damagePopUp) {
			// 死亡描画だけは行う
			if (target.result().addedStateObjects().indexOf($dataStates[1]) >= 0){
				target.performCollapse();
			}
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
		} else if (this.isForRandom()) {
			for (var i = 0; i < this.numTargets(); i++) {
				targets.push(unit.randomTarget());
			}
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

	Game_Action.prototype.isGuard = function() {
		return this.item() === $dataSkills[this.subject().guardSkillId()]
				// 防御だけでなく守りでも防御アクションを表示
				|| this.item() === $dataSkills[25]
				|| this.subject().isStateAffected(39);
	};	
	Game_BattlerBase.prototype.isGuard = function() {
		return this.canMove() && (this.specialFlag(Game_BattlerBase.FLAG_ID_GUARD)
		// 防御だけでなく守りでも防御モーションを表示
		|| this.isStateAffected(39));
	};

	// 行動を決定したとき、既に入っているアクション内容は消さない
	// ジャンプ→着地などの二段階スキルのため
	Game_Battler.prototype.makeActions = function() {
		if (this.canMove()) {
			var actionTimes = this.makeActionTimes();
			for (var i = 0; i < actionTimes; i++) {
				this._actions.push(new Game_Action(this));
			}
		}
	};

	// endActionはthis._subjectではなく引数に入ったsubjectを入れる
	// subSkillの文脈ではどうしてもupdateturnで次アクションを選び始める前（この処理が走る前）にthis._subjectがnullであってほしいため
	BattleManager.endAction = function() {
		this._logWindow.endAction(this._resettingSubject);
		this._phase = 'turn';
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

	// ダメージを受けたらステート解除するのは物理技のときに限る
	//　暗にGame_Battler.prototype.onDamage を一切呼ばなくなっている
	Game_Action.prototype.executeHpDamage = function(target, value) {
		if (this.isDrain()) {
			value = Math.min(target.hp, value);
		}
		this.makeSuccess(target);
		target.gainHp(-value);
		if (value > 0 && this.isPhysical()) {
			target.removeStatesByDamage();
		}
		this.gainDrainedHp(value);
	};

	// 計算ごとにresultを消去する処理を削除。どうせひとまとまりの計算ごとには消去されるのと、subjectのダメージ量を保持しておかないと描画に影響が出るため
	Game_Action.prototype.apply = function(target) {
		var result = target.result();
		// this.subject().clearResult();
		// result.clear();
		result.used = this.testApply(target);
		result.missed = (result.used && Math.random() >= this.itemHit(target));
		result.evaded = (!result.missed && Math.random() < this.itemEva(target));
		result.physical = this.isPhysical();
		result.drain = this.isDrain();
		if (result.isHit()) {
			if (this.item().damage.type > 0) {
				result.critical = (Math.random() < this.itemCri(target));
				var value = this.makeDamageValue(target, result.critical);
				this.executeDamage(target, value);
			}
			this.item().effects.forEach(function(effect) {
				this.applyItemEffect(target, effect);
			}, this);
			this.applyItemUserEffect(target);
			
			// ダメージ処理時にぬすむ判定も行う
			this.applySteal(target);
		}
	};

	// ものまね対象スキルか、なければ戦うを返す
	Game_Action.prototype.traceSkill = function(skillId) {
		if (skillId) this.setSkill(skillId);
		else this.setAttack();
	};

	// Helpは基本一行
	Window_Help.prototype.initialize = function(numLines) {
		var width = Graphics.boxWidth;
		var height = this.fittingHeight(numLines || 1);
		Window_Base.prototype.initialize.call(this, 0, 0, width, height);
		this._text = '';
	};

	// スキル画面レイアウト変更
	Window_SkillType.prototype.windowWidth = function() {
		return 165 + this.standardPadding() * 2;
	};
	Window_SkillType.prototype.windowHeight = function() {
		return Graphics.boxHeight - this.fittingHeight(1);
	};
	Scene_Skill.prototype.createStatusWindow = function() {
		var wx = this._skillTypeWindow.width;
		var wy = this._helpWindow.height;
		var ww = Graphics.boxWidth - wx;
		var wh = this._skillTypeWindow.fittingHeight(4);
		this._statusWindow = new Window_SkillStatus(wx, wy, ww, wh);
		this._statusWindow.reserveFaceImages();
		this.addWindow(this._statusWindow);
	};
	Scene_Skill.prototype.createItemWindow = function() {
		var wx = this._statusWindow.x;
		var wy = this._statusWindow.y + this._statusWindow.height;
		var ww = Graphics.boxWidth - wx;
		var wh = Graphics.boxHeight - wy;
		this._itemWindow = new Window_SkillList(wx, wy, ww, wh);
		this._itemWindow.setHelpWindow(this._helpWindow);
		this._itemWindow.setHandler('ok',     this.onItemOk.bind(this));
		this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
		this._skillTypeWindow.setSkillWindow(this._itemWindow);
		this.addWindow(this._itemWindow);
	};
	
	// jsonロード時に勝手に追加
	MiMi_DaMa_isDatabaseLoaded = DataManager.isDatabaseLoaded;
	DataManager.isDatabaseLoaded = function() {
		if (MiMi_DaMa_isDatabaseLoaded.call(this)) {
			// $dataSystem.terms.paramsの11番目(i = 10)の値に魔法回避率の名前を設定
			$dataSystem.terms.params.push("魔法回避率");
			return true;
		}
		return false;
	};

	// paramからxparamにアクセス
	Game_BattlerBase.prototype.param = function(paramId) {
		if (paramId > 7) return this.xparam(paramId - 8) * 100;
		var value = this.paramBase(paramId) + this.paramPlus(paramId);
		value *= this.paramRate(paramId) * this.paramBuffRate(paramId);
		// 攻撃/防御/魔法防御は装備の値のみで計算する
		if ([2, 3, 5].contains(paramId)) {
			if (value > 1) value--;
			else return 0;
		}
		var maxValue = this.paramMax(paramId);
		var minValue = this.paramMin(paramId);
		return Math.round(value.clamp(minValue, maxValue));
	};

	// 全滅時は全滅シーンには行かず最新のチェックポイントへ飛ばすだけ
	BattleManager.updateBattleEnd = function() {
		if (this.isBattleTest()) {
			AudioManager.stopBgm();
			SceneManager.exit();
		} else if (!this._escaped && $gameParty.isAllDead()) {
			if (this._canLose) {
				$gameParty.reviveBattleMembers();
				SceneManager.pop();
			} else {
				if ($gamePlayer._resumeMapId != null) $gamePlayer.reserveTransfer($dataSystem._resumeMapId, $dataSystem._resumeX, $dataSystem._resumeY);
				else $gamePlayer.reserveTransfer($dataSystem.startMapId, $dataSystem.startX, $dataSystem.startY);
				$gameParty.reviveBattleMembers();
				$gameSwitches.setValue(1,true);
				SceneManager.pop();
			}
		} else {
			SceneManager.pop();
		}
		this._phase = null;
	};

	// 全滅時復活用チェックポイントをメンバーに登録
	MyMi_GaCh_initMembers = Game_Character.prototype.initMembers;
	Game_Character.prototype.initMembers = function() {
		MyMi_GaCh_initMembers.call(this);
		this._resumeMapId = null;
		this._resumeX = null;
		this._resumeY = null;
	};

	// svActorの画像はあらかじめ読み込む
	Scene_Boot.loadSystemImages = function() {
		ImageManager.reserveSvActor('bertz_blackmagi');
		ImageManager.reserveSvActor('bertz_bluemagi');
		ImageManager.reserveSvActor('bertz_dancer');
		ImageManager.reserveSvActor('bertz_darkknight');
		ImageManager.reserveSvActor('bertz_dragonknight');
		ImageManager.reserveSvActor('bertz_gradiator');
		ImageManager.reserveSvActor('bertz_hunter');
		ImageManager.reserveSvActor('bertz_knight');
		ImageManager.reserveSvActor('bertz_machinary');
		ImageManager.reserveSvActor('bertz_monk');
		ImageManager.reserveSvActor('bertz_monomane');
		ImageManager.reserveSvActor('bertz_gradiator');
		ImageManager.reserveSvActor('bertz_ninja');
		ImageManager.reserveSvActor('bertz_oracle');
		ImageManager.reserveSvActor('bertz_pharmacist');
		ImageManager.reserveSvActor('bertz_pirates');
		ImageManager.reserveSvActor('bertz_samurai');
		ImageManager.reserveSvActor('bertz_summoner');
		ImageManager.reserveSvActor('bertz_suppin');
		ImageManager.reserveSvActor('bertz_swordmagi');
		ImageManager.reserveSvActor('bertz_thief');
		ImageManager.reserveSvActor('bertz_timemagi');
		ImageManager.reserveSvActor('bertz_whitemagi');

		
		ImageManager.reserveSvActor('faris_blackmagi');
		ImageManager.reserveSvActor('faris_bluemagi');
		ImageManager.reserveSvActor('faris_dancer');
		ImageManager.reserveSvActor('faris_darkknight');
		ImageManager.reserveSvActor('faris_dragonknight');
		ImageManager.reserveSvActor('faris_gradiator');
		ImageManager.reserveSvActor('faris_hunter');
		ImageManager.reserveSvActor('faris_knight');
		ImageManager.reserveSvActor('faris_machinary');
		ImageManager.reserveSvActor('faris_monk');
		ImageManager.reserveSvActor('faris_monomane');
		ImageManager.reserveSvActor('faris_gradiator');
		ImageManager.reserveSvActor('faris_ninja');
		ImageManager.reserveSvActor('faris_oracle');
		ImageManager.reserveSvActor('faris_pharmacist');
		ImageManager.reserveSvActor('faris_pirates');
		ImageManager.reserveSvActor('faris_samurai');
		ImageManager.reserveSvActor('faris_summoner');
		ImageManager.reserveSvActor('faris_suppin');
		ImageManager.reserveSvActor('faris_swordmagi');
		ImageManager.reserveSvActor('faris_thief');
		ImageManager.reserveSvActor('faris_timemagi');
		ImageManager.reserveSvActor('faris_whitemagi');

		
		ImageManager.reserveSvActor('garaf_blackmagi');
		ImageManager.reserveSvActor('garaf_bluemagi');
		ImageManager.reserveSvActor('garaf_dancer');
		ImageManager.reserveSvActor('garaf_darkknight');
		ImageManager.reserveSvActor('garaf_dragonknight');
		ImageManager.reserveSvActor('garaf_gradiator');
		ImageManager.reserveSvActor('garaf_hunter');
		ImageManager.reserveSvActor('garaf_knight');
		ImageManager.reserveSvActor('garaf_machinary');
		ImageManager.reserveSvActor('garaf_monk');
		ImageManager.reserveSvActor('garaf_monomane');
		ImageManager.reserveSvActor('garaf_gradiator');
		ImageManager.reserveSvActor('garaf_ninja');
		ImageManager.reserveSvActor('garaf_oracle');
		ImageManager.reserveSvActor('garaf_pharmacist');
		ImageManager.reserveSvActor('garaf_pirates');
		ImageManager.reserveSvActor('garaf_samurai');
		ImageManager.reserveSvActor('garaf_summoner');
		ImageManager.reserveSvActor('garaf_suppin');
		ImageManager.reserveSvActor('garaf_swordmagi');
		ImageManager.reserveSvActor('garaf_thief');
		ImageManager.reserveSvActor('garaf_timemagi');
		ImageManager.reserveSvActor('garaf_whitemagi');

		
		ImageManager.reserveSvActor('lena_blackmagi');
		ImageManager.reserveSvActor('lena_bluemagi');
		ImageManager.reserveSvActor('lena_dancer');
		ImageManager.reserveSvActor('lena_darkknight');
		ImageManager.reserveSvActor('lena_dragonknight');
		ImageManager.reserveSvActor('lena_gradiator');
		ImageManager.reserveSvActor('lena_hunter');
		ImageManager.reserveSvActor('lena_knight');
		ImageManager.reserveSvActor('lena_machinary');
		ImageManager.reserveSvActor('lena_monk');
		ImageManager.reserveSvActor('lena_monomane');
		ImageManager.reserveSvActor('lena_gradiator');
		ImageManager.reserveSvActor('lena_ninja');
		ImageManager.reserveSvActor('lena_oracle');
		ImageManager.reserveSvActor('lena_pharmacist');
		ImageManager.reserveSvActor('lena_pirates');
		ImageManager.reserveSvActor('lena_samurai');
		ImageManager.reserveSvActor('lena_summoner');
		ImageManager.reserveSvActor('lena_suppin');
		ImageManager.reserveSvActor('lena_swordmagi');
		ImageManager.reserveSvActor('lena_thief');
		ImageManager.reserveSvActor('lena_timemagi');
		ImageManager.reserveSvActor('lena_whitemagi');
	};

})();