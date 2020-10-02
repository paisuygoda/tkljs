//=============================================================================
// Change_Scope.js
//=============================================================================

/*:
 * @plugindesc スキルを「敵<=>味方」に変更可能になります。
 * @author 村人C
 *
 * @help
 *
 * 使い方
 * 戦闘時、ターゲットを選択時に「Shift」を押すことで
 * 敵<=>味方
 * に変更可能になります。
 *
 * 仕様
 * 使用者、敵○体ランダム、全体対象には、適用されません。
 * スキルID１の「攻撃」も対象の切り替えが可能になります。
 *
 *
 * readmeやスタッフロールの明記、使用報告は任意
 *
 */
  
 (function() {
	 // フラグ
	var _Game_Battler_initMembers_Change_Scope = Game_Battler.prototype.initMembers;
	Game_Battler.prototype.initMembers = function() {
		_Game_Battler_initMembers_Change_Scope.call(this);
		this._change_scope = false; // 初期化
	};
	// ターゲットの配列作成
	var _Game_Action_makeTargets_Change_Scope = Game_Action.prototype.makeTargets;
	Game_Action.prototype.makeTargets = function() {
		var rawTargets;
		if (this._change_scope) {
			var targets = [];
			if (!this._forcing && this.subject().isConfused()) {
				targets = [this.confusionTarget()]; // 変更なし
			} else if (this.isForOpponent()) {
				targets = this.targetsForFriends(); // 入れ替え
			} else if (this.isForFriend()) {
				targets = this.targetsForOpponents(); // 入れ替え
			}
			rawTargets = this.repeatTargets(targets);
		} else {
			rawTargets = _Game_Action_makeTargets_Change_Scope.call(this);
		}

		// 条件により効果対象から外す処理
		targets = [];
		var item = this.item();
		rawTargets.forEach(function(target){
			// 瀕死耐性がついているとき、割合&瀕死ダメージが当たらない
			if (!(target.isStateAffected(35) && item.damage.elementId === 12)
				// かくれる状態の時は当たらない TODO: あらわれるスキルIDのハードコーディング
				&& !(target.isStateAffected(32) && item.id != 20)) {
					targets.push(target);
				}
		});
		return targets;
	};
	// 選択判定
	var _Scene_Battle_update_Change_Scope = Scene_Battle.prototype.update;
	Scene_Battle.prototype.update = function() {
		if (this._actorWindow.visible && Input.isTriggered('shift')) { // 現在：味方
			BattleManager.actor()._change_scope = !BattleManager.actor()._change_scope;
			this._actorWindow.deactivate(); // 忘れるとエラー
			this._actorWindow.hide();
			this.selectEnemySelection(); // 切り替え
		}else if (this._enemyWindow.visible && Input.isTriggered('shift')) { // 現在：敵
			BattleManager.actor()._change_scope = !BattleManager.actor()._change_scope;
			this._enemyWindow.deactivate(); // 忘れるとエラー
			this._enemyWindow.hide();
			this.selectActorSelection(); // 切り替え
		}
		_Scene_Battle_update_Change_Scope.call(this);
	};
	

	var Ch_Sc_GaAc_initialize = Game_Action.prototype.initialize;
	Game_Action.prototype.initialize = function(subject, forcing) {
	    Ch_Sc_GaAc_initialize.call(this, subject, forcing);
	    this._change_scope = null;
	};
	
	// Game_Actionに個別にChange_Scope情報を渡す
	Scene_Battle.prototype.onEnemyOk = function() {
		var action = BattleManager.inputtingAction();
		if (BattleManager.actor()._change_scope) {
			BattleManager.actor()._change_scope = false;
			action._change_scope = true;
		}
		action.setTarget(this._enemyWindow.enemyIndex());
		this._enemyWindow.hide();
		this._skillWindow.hide();
		this._itemWindow.hide();
		this.selectNextCommand();
	};
	Scene_Battle.prototype.onActorOk = function() {
		var action = BattleManager.inputtingAction();
		if (BattleManager.actor()._change_scope) {
			BattleManager.actor()._change_scope = false;
			action._change_scope = true;
		}
		action.setTarget(this._actorWindow.index());
		this._actorWindow.hide();
		this._skillWindow.hide();
		this._itemWindow.hide();
		this.selectNextCommand();
	};
})();