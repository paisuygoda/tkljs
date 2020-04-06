/*:
 * @plugindesc 選択中のBattlerはハイライトせず指さす
 * @author paisuygoda
 */

(function() {

	Sprite_Battler.prototype.initialize = function(battler) {
    Sprite_Base.prototype.initialize.call(this);
    this.initMembers();
    this.setBattler(battler);
    this.createPointSlot(battler);
    this.pointed = false;
	};

	Sprite_Battler.prototype.createPointSlot = function(battler) {
	    this._pointSlot = new Sprite_Point();
	    this._pointSlot.bitmap = new Bitmap(32, 32);
	    this.addChild(this._pointSlot);
	};

	Sprite_Battler.prototype.updateSelectionEffect = function() {
	    var target = this._pointSlot;
	    if (this._battler.isSelected() && !this.pointed) {
	    	this._pointSlot.anchor.x = -0.4 * this.width / this._pointSlot.width;
			this._pointSlot.anchor.y = 0.5 * this.height / this._pointSlot.height;
			// アクターが小人の時ポインタまで小さくなってしまうので拡大フラグを持つ
			var isLittle = this._battler.isStateAffected(13);
	    	if (this._battler.isActor()) {
				this._pointSlot.anchor.x = -1.0;
				this._pointSlot.anchor.y = 1.3;
	    		target.pointMe(-1, isLittle);
	    	}
	    	else {
		    	this._pointSlot.anchor.x = this._battler.cursorX * this.width / this._pointSlot.width;
    			this._pointSlot.anchor.y = this._battler.cursorY * this.height / this._pointSlot.height;
	    		target.pointMe(1, isLittle);
	    	}
	    	this.pointed = true;
	    }
	    else if (!this._battler.isSelected()) {
	        this.pointed = false;
	        target.bitmap.clear();
	    }
	};

	function Sprite_Point() {
	    this.initialize.apply(this, arguments);
	}
	Sprite_Point.prototype = Object.create(Sprite_Base.prototype);
	Sprite_Point.prototype.constructor = Sprite_Point;
	Sprite_Point.prototype.pointMe = function(reverseRate, isLittle) {
	    var bitmap = ImageManager.loadSystem('IconSet');
	    var iconIndex = 91;
	    var pw = 32;
	    var ph = 32;
	    var sx = iconIndex % 16 * pw;
	    var sy = Math.floor(iconIndex / 16) * ph;
		this.bitmap.blt(bitmap, sx, sy, pw, ph, this.x, this.y);
		if (isLittle) rate = 3.333;
		else rate = 1;
		this.scale.x = rate * reverseRate;
		this.scale.y = rate;
	};

})();