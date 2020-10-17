/*:
 * @plugindesc アビリティレベルによって使えるスキルが変わる処理
 * @author paisuygoda
 * @help タグでスキルとアビリティ防具のそれぞれにスキルレベルを設定する
 */

(function() {

	// 要求アビリティレベル読み込み
	var _loaded_AbilityLevel_Setting = false;
	var MyAbLe_DaMa_isDatabaseLoaded = DataManager.isDatabaseLoaded;
	DataManager.isDatabaseLoaded = function() {
	if (!MyAbLe_DaMa_isDatabaseLoaded.call(this)) return false;
	if (!_loaded_AbilityLevel_Setting) {
		this.processNotetagsAbilityLevel($dataSkills);
		_loaded_AbilityLevel_Setting = true;
	}
		return true;
	};

	DataManager.processNotetagsAbilityLevel = function(group) {
		// 要求アビリティレベル(記述がなければ0)
		var noteAbLevelCondition = /<(?:RequireAbilityLevel):[ ](\d+)>/i;
		// ジャンプなどの二段階コマンドか否か(記述がなければfalse)
		var noteSerialSkillCondition = /<(?:SerialSkill)>/i;
		// 二段階目か否か(記述がなければfalse)
		var noteSubSkillCondition = /<(?:SubSkill)>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj.abilityLevel = 0;
			obj.isSerialSkill = false;
			obj.isSubSkill = false;

			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteAbLevelCondition)) {
					obj.abilityLevel = parseInt(RegExp.$1);
				} else if (line.match(noteSerialSkillCondition)) {
					obj.isSerialSkill = true;
				} if (line.match(noteSubSkillCondition)) {
					obj.isSubSkill = true;
				}
			}
		}
	};

	MyAbLe_WiSkLi_initialize = Window_SkillList.prototype.initialize;
    Window_SkillList.prototype.initialize = function(x, y, width, height) {
		MyAbLe_WiSkLi_initialize.call(this, arguments);
		this._skillLevel = 3;
	};
	
	Window_SkillList.prototype.setStypeId = function(stypeId) {
		if (stypeId < 15) {
			if (this._stypeId !== stypeId) {
				this._stypeId = stypeId;
				this._skillLevel = 3;
				this.refresh();
				this.resetScroll();
			}
		} else {
			var newStypeId = this.convertSkillType(stypeId);
			if (stypeId % 2 == 1) var newAbilityLevel = 1;
			else var newAbilityLevel = 2;
			if (this._stypeId !== newStypeId || this._skillLevel !== newAbilityLevel) {
				this._stypeId = newStypeId;
				this._skillLevel = newAbilityLevel;
				this.refresh();
				this.resetScroll();
			}
		}
	};

	Window_SkillList.prototype.includes = function(item) {
		return item && item.stypeId === this._stypeId && item.abilityLevel < this._skillLevel;
	};

	Window_SkillList.prototype.convertSkillType = function(stypeId) {
		if (stypeId < 17) return 1;
		else if (stypeId < 19) return 2;
		else if (stypeId < 21) return 3;
		else if (stypeId < 23) return 6;
		else if (stypeId < 25) return 10;
		else if (stypeId < 27) return 13;
		else if (stypeId < 29) return 4;
		else if (stypeId < 31) return 11;
		else if (stypeId < 33) return 14;
		else if (stypeId < 34) return 9;
		// ありえん
		else {
			console.log("invalid skillTypeId: " + stypeId);
			console.trace();
		}
	};

})();