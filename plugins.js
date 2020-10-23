// Generated by RPG Maker.
// Do not edit this file directly.
var $plugins =
[
{"name":"MyMiscPlugins","status":true,"description":"細かなプラグイン集","parameters":{}},
{"name":"MyPointTarget","status":true,"description":"選択中のBattlerはハイライトせず指さす","parameters":{}},
{"name":"MyChangePopupDamageOrder","status":true,"description":"モーション・アクションとダメージ表示のフェーズを別に管理","parameters":{}},
{"name":"MyCounter","status":true,"description":"カウンターをFF仕様に変更","parameters":{}},
{"name":"MyStateEffects","status":true,"description":"ステート処理プラグイン","parameters":{}},
{"name":"MyDamageFormula","status":true,"description":"細かなプラグイン集","parameters":{}},
{"name":"MySubstitute","status":true,"description":"かばう発動条件や、かばう時のアニメーションをFF仕様にする","parameters":{}},
{"name":"MyEnemyNameWindow","status":true,"description":"敵の名前表示窓追加","parameters":{}},
{"name":"MyAbilityLevel","status":true,"description":"アビリティレベルによって使えるスキルが変わる処理","parameters":{}},
{"name":"MySpecialSkill","status":true,"description":"盗むシステム","parameters":{}},
{"name":"Change_Scope","status":true,"description":"スキルを「敵<=>味方」に変更可能になります。","parameters":{}},
{"name":"Community_Basic","status":true,"description":"基本的なパラメーターを設定するプラグインです。","parameters":{"cacheLimit":"20","screenWidth":"816","screenHeight":"624","changeWindowWidthTo":"","changeWindowHeightTo":"","renderingMode":"auto","alwaysDash":"on"}},
{"name":"EnemyBook","status":true,"description":"モンスター図鑑です。敵キャラの詳細なステータスを表示します。","parameters":{"Unknown Data":"？？？？？？"}},
{"name":"-------------------------","status":false,"description":"--------------------","parameters":{}},
{"name":"YEP_CoreEngine","status":true,"description":"v1.31 Needed for the majority of Yanfly Engine Scripts. Also\r\ncontains bug fixes found inherently in RPG Maker.","parameters":{"---Screen---":"","Screen Width":"816","Screen Height":"624","Scale Battlebacks":"true","Scale Title":"true","Scale Game Over":"true","Open Console":"false","Reposition Battlers":"true","GameFont Load Timer":"0","Update Real Scale":"false","Collection Clear":"true","---Gold---":"","Gold Max":"99999999","Gold Font Size":"26","Gold Icon":"314","Gold Overlap":"A lotta","---Items---":"","Default Max":"99","Quantity Text Size":"20","---Parameters---":"","Max Level":"99","Actor MaxHP":"9999","Actor MaxMP":"9999","Actor Parameter":"999","Enemy MaxHP":"999999","Enemy MaxMP":"99999","Enemy Parameter":"999","---Battle---":"","Animation Rate":"4","Flash Target":"false","Show Events Transition":"true","Show Events Snapshot":"true","---Map Optimization---":"","Refresh Update HP":"true","Refresh Update MP":"true","Refresh Update TP":"false","---Font---":"","Chinese Font":"SimHei, Heiti TC, sans-serif","Korean Font":"Dotum, AppleGothic, sans-serif","Default Font":"GameFont, Verdana, Arial, Courier New","Font Size":"28","Text Align":"left","---Windows---":"","Digit Grouping":"true","Line Height":"36","Icon Width":"32","Icon Height":"32","Face Width":"144","Face Height":"144","Window Padding":"18","Text Padding":"6","Window Opacity":"192","Gauge Outline":"true","Gauge Height":"18","Menu TP Bar":"false","---Window Colors---":"","Color: Normal":"0","Color: System":"16","Color: Crisis":"17","Color: Death":"18","Color: Gauge Back":"19","Color: HP Gauge 1":"20","Color: HP Gauge 2":"21","Color: MP Gauge 1":"22","Color: MP Gauge 2":"23","Color: MP Cost":"23","Color: Power Up":"24","Color: Power Down":"25","Color: TP Gauge 1":"28","Color: TP Gauge 2":"29","Color: TP Cost Color":"29"}},
{"name":"YEP_BattleEngineCore","status":false,"description":"v1.50 Have more control over the flow of the battle system\nwith this plugin and alter various aspects to your liking.","parameters":{"---General---":"","Action Speed":"agi","Default System":"dtb","---Escape---":"","Escape Ratio":"0.5 * $gameParty.agility() / $gameTroop.agility()","Fail Escape Boost":"0.10","---Animation---":"","Animation Base Delay":"0","Animation Next Delay":"0","Certain Hit Animation":"0","Physical Animation":"52","Magical Animation":"51","Enemy Attack Animation":"39","Reflect Animation":"42","Motion Waiting":"false","---Frontview---":"","Front Position X":"Graphics.boxWidth / 8 + Graphics.boxWidth / 4 * index","Front Position Y":"Graphics.boxHeight - 180","Front Actor Sprite":"false","Front Sprite Priority":"1","---Sideview---":"","Home Position X":"screenWidth - 16 - (maxSize + 2) * 32 + index * 32","Home Position Y":"screenHeight - statusHeight - maxSize * 48 + (index+1) * 48 - 32","Side Sprite Priority":"1","---Sprites---":"","Default X Anchor":"0.50","Default Y Anchor":"1.00","Step Distance":"48","Flinch Distance":"12","Show Shadows":"true","---Damage Popups---":"","Popup Duration":"128","Newest Popup Bottom":"true","Popup Overlap Rate":"0.8","Critical Popup":"255, 0, 0, 160","Critical Duration":"60","---Tick-Settings---":"","Timed States":"false","Timed Buffs":"false","Turn Time":"100","AI Self Turns":"true","---Window Settings---":"","Lower Windows":"true","Window Rows":"4","Command Window Rows":"4","Command Alignment":"center","Start Actor Command":"true","Current Max":"false","---Selection Help---":"","Mouse Over":"true","Select Help Window":"true","User Help Text":"User","Ally Help Text":"Ally","Allies Help Text":"Allies","Enemy Help Text":"Enemy","Enemies Help Text":"Enemies","All Help Text":"All %1","Random Help Text":"%2 Random %1","---Enemy Select---":"","Visual Enemy Select":"true","Show Enemy Name":"true","Show Select Box":"false","Enemy Font Size":"20","Enemy Auto Select":"this.furthestRight()","---Actor Select---":"","Visual Actor Select":"true","---Battle Log---":"","Show Emerge Text":"false","Show Pre-Emptive Text":"true","Show Surprise Text":"true","Optimize Speed":"true","Show Action Text":"false","Show State Text":"false","Show Buff Text":"false","Show Counter Text":"true","Show Reflect Text":"true","Show Substitute Text":"true","Show Fail Text":"false","Show Critical Text":"false","Show Miss Text":"false","Show Evasion Text":"false","Show HP Text":"false","Show MP Text":"false","Show TP Text":"false"}},
{"name":"MPP_ActiveTimeBattle","status":true,"description":"【ver.2.13】戦闘システムをアクティブタイムバトルに変更します。","parameters":{"=== Base ===":"【基本設定】","ATB Mode Default _v2":"wait","ATB Speed Base":"5","AT Increment":"0","ATB Speed Default":"3","Mode Slow Fast Rate":"1.5","Mode Slow Rate":"0.5","Stop Time On Action":"true","Instant Stop On Command":"15","=== Option ===":"【オプション画面】","ATB Mode Name _v2":"戦闘モード","ATB Mode Status _v2":"[\"active\",\"slow\",\"wait\",\"stop\"]","ATB Mode Texts _v2":"{\"active\":\"アクティブ\",\"slow\":\"スロー\",\"wait\":\"ウェイト\",\"stop\":\"ストップ\"}","ATB Speed Name":"戦闘速度","ATB Speed Status":"1,2,3,4,5","=== ATB Fast ===":"【加速ボタン関連】","ATB Fast Eneble?":"true","ATB Fast Rate":"2.0","Fast Cancel By Input":"false","Fast Log Eneble?":"true","=== Battle ===":"【戦闘関連】","Change Mode in Battle _v2":"false","Reset AT Die?":"true","Need Escape At":"0","Escape AT Cost":"0","Escape Anime?":"true","Input Step Forward?":"false","Active SE _v2":"{\"Name\":\"Decision1\",\"Volume\":\"90\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Force Target Select?":"false","=== Window ===":"【ウィンドウ】","Help Window Pos":"1","Help Window Row":"1","Status Window Pos":"2","Skill Window HP Draw?":"false","=== AT Gauge ===":"【ATゲージ】","AT Gauge Name":"","AT Gauge Width":"100","AT Gauge Height":"12","AT Charge Color1":"192,192,192","AT Charge Color2":"255,255,255","AT Max Color1":"192,192,192","AT Max Color2":"255,255,192","Chanting View?":"true","AT Chanting Color1":"128,32,0","AT Chanting Color2":"255,64,0","Escaping Change?":"true","AT Escaping Color1":"192,192,192","AT Escaping Color2":"192,192,255"}},
{"name":"MPP_TwoHandWeapon","status":true,"description":"【ver.1.0】両手持ち武器を設定できます。","parameters":{}},
{"name":"FTKR_ExBattleCommand","status":true,"description":"v2.0.1 アクターのバトルコマンドの表示を変更する","parameters":{"--パーティーコマンド--":"","Party Command List":"escape","Party Commands":"{\"fight\":\"{\\\"enabled\\\":\\\"\\\",\\\"ext\\\":\\\"\\\",\\\"skillId\\\":\\\"\\\"}\",\"escape\":\"{\\\"enabled\\\":\\\"BattleManager.canEscape()\\\",\\\"ext\\\":\\\"\\\",\\\"skillId\\\":\\\"\\\"}\",\"customs\":\"[]\"}","--コマンドアイコン--":"","Show Command Icon":"false","--コマンド説明文--":"","Show Command Description":"false","atcode":"","TRAIT_ACTOR_COMMAND":"200"}},
{"name":"SimpleMsgSideView","status":true,"description":"サイドビューバトルで技/アイテムの名前のみ表示します。","parameters":{"displayAttack":"0","position":"1"}},
{"name":"-------------------------","status":false,"description":"--------------------","parameters":{}},
{"name":"YEP_EquipCore","status":true,"description":"v1.18 Allows for the equipment system to be more flexible to\nallow for unique equipment slots per class.","parameters":{"---General---":"","Text Align":"left","Finish Command":"終了","Remove Text":"はずす","Remove Icon":"16","Empty Text":" ","Empty Icon":"16","---Rules---":"","Non-Removable Types":"10","Non-Optimized Types":"5"}},
{"name":"YEP_SkillEquipCore","status":true,"description":"v1.18 Allows for the SkillEquipment system to be more flexible to\nallow for unique SkillEquipment slots per class.","parameters":{"---General---":"","Text Align":"center","Finish Command":"終了","Remove Text":"Remove","Remove Icon":"16","Empty Text":" ","Empty Icon":"0","---Rules---":"","Ability Item Slot":"6"}},
{"name":"YEP_JobPoints","status":true,"description":"v1.10 This plugin by itself doesn't do much, but it enables\nactors to acquire JP (job points) used for other plugins.","parameters":{"---General---":"","JP Text":"ＡＢＰ","JP Icon":"188","Max JP":"0","JP Per Action":"0","JP Per Level":"0","JP Per Enemy":"0","Show Results":"true","JP Gained in Battle":"%1 %2","Ability Gain Text 1":"なんか読まないのでコードに直書きで","Ability Gain Text 2":"上に同じ","Alive Actors":"true","---Menu---":"","Show In Menu":"true","Menu Format":"%1\\c[16]%2","---Victory Aftermath---":"","Enable Aftermath":"true","Aftermath Text":"JP Earned","Aftermath Format":"+%1\\c[4]%2\\c[0]%3","Aftermath JP Earned":"JP Earned in Battle"}},
{"name":"dsJobChange","status":true,"description":"ジョブチェンジシステム ver1.11.5","parameters":{"Menu Command Enable":"true","Command Name":"ジョブ","Effect Animation Id":"52","Optimize Equip Enable":"true","Optimize Equip Text":"アビリティ画面に移動します","Keep Exp":"true"}},
{"name":"YEP_MainMenuManager","status":true,"description":"v1.03 This plugin allows you to manage the various aspects\nof your main menu.","parameters":{"---General---":"","Hide Actor Window":"false","Hide Gold Window":"false","Blurry Background":"true","---Command---":"","Command Alignment":"left","Command Position":"right","Command Columns":"1","Command Rows":"11","Command Width":"240","---Menu Items---":"","---Menu 1---":"","Menu 1 Name":"","Menu 1 Symbol":"","Menu 1 Show":"","Menu 1 Enabled":"","Menu 1 Ext":"","Menu 1 Main Bind":"","Menu 1 Actor Bind":"","---Menu 2---":"","Menu 2 Name":"'ジョブ'","Menu 2 Symbol":"jobChange","Menu 2 Show":"true","Menu 2 Enabled":"$gameSwitches.value(100)","Menu 2 Ext":"","Menu 2 Main Bind":"this.commandPersonal.bind(this)","Menu 2 Actor Bind":"SceneManager.push(dsJobChange.Scene_JobChange)","---Menu 3---":"","Menu 3 Name":"","Menu 3 Symbol":"","Menu 3 Show":"","Menu 3 Enabled":"","Menu 3 Ext":"","Menu 3 Main Bind":"","Menu 3 Actor Bind":"","---Menu 4---":"","Menu 4 Name":"'アビリティ'","Menu 4 Symbol":"SkillEquip","Menu 4 Show":"true","Menu 4 Enabled":"$gameSwitches.value(100)","Menu 4 Ext":"","Menu 4 Main Bind":"this.commandPersonal.bind(this)","Menu 4 Actor Bind":"SceneManager.push(Scene_SkillEquip)","---Menu 5---":"","Menu 5 Name":"","Menu 5 Symbol":"","Menu 5 Show":"","Menu 5 Enabled":"","Menu 5 Ext":"","Menu 5 Main Bind":"","Menu 5 Actor Bind":"","---Menu 6---":"","Menu 6 Name":"","Menu 6 Symbol":"","Menu 6 Show":"","Menu 6 Enabled":"","Menu 6 Ext":"","Menu 6 Main Bind":"","Menu 6 Actor Bind":"","---Menu 7---":"","Menu 7 Name":"","Menu 7 Symbol":"","Menu 7 Show":"","Menu 7 Enabled":"","Menu 7 Ext":"","Menu 7 Main Bind":"","Menu 7 Actor Bind":"","---Menu 8---":"","Menu 8 Name":"","Menu 8 Symbol":"","Menu 8 Show":"","Menu 8 Enabled":"","Menu 8 Ext":"","Menu 8 Main Bind":"","Menu 8 Actor Bind":"","---Menu 9---":"","Menu 9 Name":"","Menu 9 Symbol":"","Menu 9 Show":"","Menu 9 Enabled":"","Menu 9 Ext":"","Menu 9 Main Bind":"","Menu 9 Actor Bind":"","---Menu 10---":"","Menu 10 Name":"TextManager.item","Menu 10 Symbol":"item","Menu 10 Show":"this.needsCommand('item')","Menu 10 Enabled":"this.areMainCommandsEnabled()","Menu 10 Ext":"","Menu 10 Main Bind":"this.commandItem.bind(this)","Menu 10 Actor Bind":"","---Menu 11---":"","Menu 11 Name":"","Menu 11 Symbol":"","Menu 11 Show":"","Menu 11 Enabled":"","Menu 11 Ext":"","Menu 11 Main Bind":"","Menu 11 Actor Bind":"","---Menu 12---":"","Menu 12 Name":"","Menu 12 Symbol":"","Menu 12 Show":"","Menu 12 Enabled":"","Menu 12 Ext":"","Menu 12 Main Bind":"","Menu 12 Actor Bind":"","---Menu 13---":"","Menu 13 Name":"","Menu 13 Symbol":"","Menu 13 Show":"","Menu 13 Enabled":"","Menu 13 Ext":"","Menu 13 Main Bind":"","Menu 13 Actor Bind":"","---Menu 14---":"","Menu 14 Name":"","Menu 14 Symbol":"","Menu 14 Show":"","Menu 14 Enabled":"","Menu 14 Ext":"","Menu 14 Main Bind":"","Menu 14 Actor Bind":"","---Menu 15---":"","Menu 15 Name":"TextManager.skill","Menu 15 Symbol":"skill","Menu 15 Show":"this.needsCommand('skill')","Menu 15 Enabled":"this.areMainCommandsEnabled()","Menu 15 Ext":"","Menu 15 Main Bind":"this.commandPersonal.bind(this)","Menu 15 Actor Bind":"SceneManager.push(Scene_Skill)","---Menu 16---":"","Menu 16 Name":"","Menu 16 Symbol":"","Menu 16 Show":"","Menu 16 Enabled":"","Menu 16 Ext":"","Menu 16 Main Bind":"","Menu 16 Actor Bind":"","---Menu 17---":"","Menu 17 Name":"","Menu 17 Symbol":"","Menu 17 Show":"","Menu 17 Enabled":"","Menu 17 Ext":"","Menu 17 Main Bind":"","Menu 17 Actor Bind":"","---Menu 18---":"","Menu 18 Name":"","Menu 18 Symbol":"","Menu 18 Show":"","Menu 18 Enabled":"","Menu 18 Ext":"","Menu 18 Main Bind":"","Menu 18 Actor Bind":"","---Menu 19---":"","Menu 19 Name":"","Menu 19 Symbol":"","Menu 19 Show":"","Menu 19 Enabled":"","Menu 19 Ext":"","Menu 19 Main Bind":"","Menu 19 Actor Bind":"","---Menu 20---":"","Menu 20 Name":"TextManager.equip","Menu 20 Symbol":"equip","Menu 20 Show":"this.needsCommand('equip')","Menu 20 Enabled":"this.areMainCommandsEnabled()","Menu 20 Ext":"","Menu 20 Main Bind":"this.commandPersonal.bind(this)","Menu 20 Actor Bind":"SceneManager.push(Scene_Equip)","---Menu 21---":"","Menu 21 Name":"","Menu 21 Symbol":"","Menu 21 Show":"","Menu 21 Enabled":"","Menu 21 Ext":"","Menu 21 Main Bind":"","Menu 21 Actor Bind":"","---Menu 22---":"","Menu 22 Name":"","Menu 22 Symbol":"","Menu 22 Show":"","Menu 22 Enabled":"","Menu 22 Ext":"","Menu 22 Main Bind":"","Menu 22 Actor Bind":"","---Menu 23---":"","Menu 23 Name":"","Menu 23 Symbol":"","Menu 23 Show":"","Menu 23 Enabled":"","Menu 23 Ext":"","Menu 23 Main Bind":"","Menu 23 Actor Bind":"","---Menu 24---":"","Menu 24 Name":"","Menu 24 Symbol":"","Menu 24 Show":"","Menu 24 Enabled":"","Menu 24 Ext":"","Menu 24 Main Bind":"","Menu 24 Actor Bind":"","---Menu 25---":"","Menu 25 Name":"Yanfly.Param.CCCCmdName","Menu 25 Symbol":"class","Menu 25 Show":"Imported.YEP_ClassChangeCore && $gameSystem.isShowClass()","Menu 25 Enabled":"$gameSystem.isEnableClass() && this.areMainCommandsEnabled()","Menu 25 Ext":"","Menu 25 Main Bind":"this.commandPersonal.bind(this)","Menu 25 Actor Bind":"SceneManager.push(Scene_Class)","---Menu 26---":"","Menu 26 Name":"","Menu 26 Symbol":"","Menu 26 Show":"","Menu 26 Enabled":"","Menu 26 Ext":"","Menu 26 Main Bind":"","Menu 26 Actor Bind":"","---Menu 27---":"","Menu 27 Name":"","Menu 27 Symbol":"","Menu 27 Show":"","Menu 27 Enabled":"","Menu 27 Ext":"","Menu 27 Main Bind":"","Menu 27 Actor Bind":"","---Menu 28---":"","Menu 28 Name":"","Menu 28 Symbol":"","Menu 28 Show":"","Menu 28 Enabled":"","Menu 28 Ext":"","Menu 28 Main Bind":"","Menu 28 Actor Bind":"","---Menu 29---":"","Menu 29 Name":"","Menu 29 Symbol":"","Menu 29 Show":"","Menu 29 Enabled":"","Menu 29 Ext":"","Menu 29 Main Bind":"","Menu 29 Actor Bind":"","---Menu 30---":"","Menu 30 Name":"","Menu 30 Symbol":"","Menu 30 Show":"","Menu 30 Enabled":"","Menu 30 Ext":"","Menu 30 Main Bind":"","Menu 30 Actor Bind":"","---Menu 31---":"","Menu 31 Name":"","Menu 31 Symbol":"","Menu 31 Show":"","Menu 31 Enabled":"","Menu 31 Ext":"","Menu 31 Main Bind":"","Menu 31 Actor Bind":"","---Menu 32---":"","Menu 32 Name":"","Menu 32 Symbol":"","Menu 32 Show":"","Menu 32 Enabled":"","Menu 32 Ext":"","Menu 32 Main Bind":"","Menu 32 Actor Bind":"","---Menu 33---":"","Menu 33 Name":"","Menu 33 Symbol":"","Menu 33 Show":"","Menu 33 Enabled":"","Menu 33 Ext":"","Menu 33 Main Bind":"","Menu 33 Actor Bind":"","---Menu 34---":"","Menu 34 Name":"","Menu 34 Symbol":"","Menu 34 Show":"","Menu 34 Enabled":"","Menu 34 Ext":"","Menu 34 Main Bind":"","Menu 34 Actor Bind":"","---Menu 35---":"","Menu 35 Name":"","Menu 35 Symbol":"","Menu 35 Show":"","Menu 35 Enabled":"","Menu 35 Ext":"","Menu 35 Main Bind":"","Menu 35 Actor Bind":"","---Menu 36---":"","Menu 36 Name":"","Menu 36 Symbol":"","Menu 36 Show":"","Menu 36 Enabled":"","Menu 36 Ext":"","Menu 36 Main Bind":"","Menu 36 Actor Bind":"","---Menu 37---":"","Menu 37 Name":"","Menu 37 Symbol":"","Menu 37 Show":"","Menu 37 Enabled":"","Menu 37 Ext":"","Menu 37 Main Bind":"","Menu 37 Actor Bind":"","---Menu 38---":"","Menu 38 Name":"","Menu 38 Symbol":"","Menu 38 Show":"","Menu 38 Enabled":"","Menu 38 Ext":"","Menu 38 Main Bind":"","Menu 38 Actor Bind":"","---Menu 39---":"","Menu 39 Name":"","Menu 39 Symbol":"","Menu 39 Show":"","Menu 39 Enabled":"","Menu 39 Ext":"","Menu 39 Main Bind":"","Menu 39 Actor Bind":"","---Menu 40---":"","Menu 40 Name":"","Menu 40 Symbol":"","Menu 40 Show":"","Menu 40 Enabled":"","Menu 40 Ext":"","Menu 40 Main Bind":"","Menu 40 Actor Bind":"","---Menu 41---":"","Menu 41 Name":"","Menu 41 Symbol":"","Menu 41 Show":"","Menu 41 Enabled":"","Menu 41 Ext":"","Menu 41 Main Bind":"","Menu 41 Actor Bind":"","---Menu 42---":"","Menu 42 Name":"","Menu 42 Symbol":"","Menu 42 Show":"","Menu 42 Enabled":"","Menu 42 Ext":"","Menu 42 Main Bind":"","Menu 42 Actor Bind":"","---Menu 43---":"","Menu 43 Name":"","Menu 43 Symbol":"","Menu 43 Show":"","Menu 43 Enabled":"","Menu 43 Ext":"","Menu 43 Main Bind":"","Menu 43 Actor Bind":"","---Menu 44---":"","Menu 44 Name":"","Menu 44 Symbol":"","Menu 44 Show":"","Menu 44 Enabled":"","Menu 44 Ext":"","Menu 44 Main Bind":"","Menu 44 Actor Bind":"","---Menu 45---":"","Menu 45 Name":"","Menu 45 Symbol":"","Menu 45 Show":"","Menu 45 Enabled":"","Menu 45 Ext":"","Menu 45 Main Bind":"","Menu 45 Actor Bind":"","---Menu 46---":"","Menu 46 Name":"","Menu 46 Symbol":"","Menu 46 Show":"","Menu 46 Enabled":"","Menu 46 Ext":"","Menu 46 Main Bind":"","Menu 46 Actor Bind":"","---Menu 47---":"","Menu 47 Name":"","Menu 47 Symbol":"","Menu 47 Show":"","Menu 47 Enabled":"","Menu 47 Ext":"","Menu 47 Main Bind":"","Menu 47 Actor Bind":"","---Menu 48---":"","Menu 48 Name":"","Menu 48 Symbol":"","Menu 48 Show":"","Menu 48 Enabled":"","Menu 48 Ext":"","Menu 48 Main Bind":"","Menu 48 Actor Bind":"","---Menu 49---":"","Menu 49 Name":"","Menu 49 Symbol":"","Menu 49 Show":"","Menu 49 Enabled":"","Menu 49 Ext":"","Menu 49 Main Bind":"","Menu 49 Actor Bind":"","---Menu 50---":"","Menu 50 Name":"TextManager.status","Menu 50 Symbol":"status","Menu 50 Show":"this.needsCommand('status')","Menu 50 Enabled":"this.areMainCommandsEnabled()","Menu 50 Ext":"","Menu 50 Main Bind":"this.commandPersonal.bind(this)","Menu 50 Actor Bind":"SceneManager.push(Scene_Status)","---Menu 51---":"","Menu 51 Name":"","Menu 51 Symbol":"","Menu 51 Show":"","Menu 51 Enabled":"","Menu 51 Ext":"","Menu 51 Main Bind":"","Menu 51 Actor Bind":"","---Menu 52---":"","Menu 52 Name":"","Menu 52 Symbol":"","Menu 52 Show":"","Menu 52 Enabled":"","Menu 52 Ext":"","Menu 52 Main Bind":"","Menu 52 Actor Bind":"","---Menu 53---":"","Menu 53 Name":"","Menu 53 Symbol":"","Menu 53 Show":"","Menu 53 Enabled":"","Menu 53 Ext":"","Menu 53 Main Bind":"","Menu 53 Actor Bind":"","---Menu 54---":"","Menu 54 Name":"","Menu 54 Symbol":"","Menu 54 Show":"","Menu 54 Enabled":"","Menu 54 Ext":"","Menu 54 Main Bind":"","Menu 54 Actor Bind":"","---Menu 55---":"","Menu 55 Name":"TextManager.formation","Menu 55 Symbol":"formation","Menu 55 Show":"this.needsCommand('formation')","Menu 55 Enabled":"this.isFormationEnabled()","Menu 55 Ext":"","Menu 55 Main Bind":"this.commandFormation.bind(this)","Menu 55 Actor Bind":"","---Menu 56---":"","Menu 56 Name":"","Menu 56 Symbol":"","Menu 56 Show":"","Menu 56 Enabled":"","Menu 56 Ext":"","Menu 56 Main Bind":"","Menu 56 Actor Bind":"","---Menu 57---":"","Menu 57 Name":"","Menu 57 Symbol":"","Menu 57 Show":"","Menu 57 Enabled":"","Menu 57 Ext":"","Menu 57 Main Bind":"","Menu 57 Actor Bind":"","---Menu 58---":"","Menu 58 Name":"","Menu 58 Symbol":"","Menu 58 Show":"","Menu 58 Enabled":"","Menu 58 Ext":"","Menu 58 Main Bind":"","Menu 58 Actor Bind":"","---Menu 59---":"","Menu 59 Name":"","Menu 59 Symbol":"","Menu 59 Show":"","Menu 59 Enabled":"","Menu 59 Ext":"","Menu 59 Main Bind":"","Menu 59 Actor Bind":"","---Menu 60---":"","Menu 60 Name":"","Menu 60 Symbol":"","Menu 60 Show":"","Menu 60 Enabled":"","Menu 60 Ext":"","Menu 60 Main Bind":"","Menu 60 Actor Bind":"","---Menu 61---":"","Menu 61 Name":"","Menu 61 Symbol":"","Menu 61 Show":"","Menu 61 Enabled":"","Menu 61 Ext":"","Menu 61 Main Bind":"","Menu 61 Actor Bind":"","---Menu 62---":"","Menu 62 Name":"","Menu 62 Symbol":"","Menu 62 Show":"","Menu 62 Enabled":"","Menu 62 Ext":"","Menu 62 Main Bind":"","Menu 62 Actor Bind":"","---Menu 63---":"","Menu 63 Name":"","Menu 63 Symbol":"","Menu 63 Show":"","Menu 63 Enabled":"","Menu 63 Ext":"","Menu 63 Main Bind":"","Menu 63 Actor Bind":"","---Menu 64---":"","Menu 64 Name":"","Menu 64 Symbol":"","Menu 64 Show":"","Menu 64 Enabled":"","Menu 64 Ext":"","Menu 64 Main Bind":"","Menu 64 Actor Bind":"","---Menu 65---":"","Menu 65 Name":"","Menu 65 Symbol":"","Menu 65 Show":"","Menu 65 Enabled":"","Menu 65 Ext":"","Menu 65 Main Bind":"","Menu 65 Actor Bind":"","---Menu 66---":"","Menu 66 Name":"","Menu 66 Symbol":"","Menu 66 Show":"","Menu 66 Enabled":"","Menu 66 Ext":"","Menu 66 Main Bind":"","Menu 66 Actor Bind":"","---Menu 67---":"","Menu 67 Name":"","Menu 67 Symbol":"","Menu 67 Show":"","Menu 67 Enabled":"","Menu 67 Ext":"","Menu 67 Main Bind":"","Menu 67 Actor Bind":"","---Menu 68---":"","Menu 68 Name":"","Menu 68 Symbol":"","Menu 68 Show":"","Menu 68 Enabled":"","Menu 68 Ext":"","Menu 68 Main Bind":"","Menu 68 Actor Bind":"","---Menu 69---":"","Menu 69 Name":"","Menu 69 Symbol":"","Menu 69 Show":"","Menu 69 Enabled":"","Menu 69 Ext":"","Menu 69 Main Bind":"","Menu 69 Actor Bind":"","---Menu 70---":"","Menu 70 Name":"","Menu 70 Symbol":"","Menu 70 Show":"","Menu 70 Enabled":"","Menu 70 Ext":"","Menu 70 Main Bind":"","Menu 70 Actor Bind":"","---Menu 71---":"","Menu 71 Name":"","Menu 71 Symbol":"","Menu 71 Show":"","Menu 71 Enabled":"","Menu 71 Ext":"","Menu 71 Main Bind":"","Menu 71 Actor Bind":"","---Menu 72---":"","Menu 72 Name":"","Menu 72 Symbol":"","Menu 72 Show":"","Menu 72 Enabled":"","Menu 72 Ext":"","Menu 72 Main Bind":"","Menu 72 Actor Bind":"","---Menu 73---":"","Menu 73 Name":"","Menu 73 Symbol":"","Menu 73 Show":"","Menu 73 Enabled":"","Menu 73 Ext":"","Menu 73 Main Bind":"","Menu 73 Actor Bind":"","---Menu 74---":"","Menu 74 Name":"","Menu 74 Symbol":"","Menu 74 Show":"","Menu 74 Enabled":"","Menu 74 Ext":"","Menu 74 Main Bind":"","Menu 74 Actor Bind":"","---Menu 75---":"","Menu 75 Name":"","Menu 75 Symbol":"","Menu 75 Show":"","Menu 75 Enabled":"","Menu 75 Ext":"","Menu 75 Main Bind":"","Menu 75 Actor Bind":"","---Menu 76---":"","Menu 76 Name":"","Menu 76 Symbol":"","Menu 76 Show":"","Menu 76 Enabled":"","Menu 76 Ext":"","Menu 76 Main Bind":"","Menu 76 Actor Bind":"","---Menu 77---":"","Menu 77 Name":"","Menu 77 Symbol":"","Menu 77 Show":"","Menu 77 Enabled":"","Menu 77 Ext":"","Menu 77 Main Bind":"","Menu 77 Actor Bind":"","---Menu 78---":"","Menu 78 Name":"","Menu 78 Symbol":"","Menu 78 Show":"","Menu 78 Enabled":"","Menu 78 Ext":"","Menu 78 Main Bind":"","Menu 78 Actor Bind":"","---Menu 79---":"","Menu 79 Name":"","Menu 79 Symbol":"","Menu 79 Show":"","Menu 79 Enabled":"","Menu 79 Ext":"","Menu 79 Main Bind":"","Menu 79 Actor Bind":"","---Menu 80---":"","Menu 80 Name":"","Menu 80 Symbol":"","Menu 80 Show":"","Menu 80 Enabled":"","Menu 80 Ext":"","Menu 80 Main Bind":"","Menu 80 Actor Bind":"","---Menu 81---":"","Menu 81 Name":"'Common Event 1'","Menu 81 Symbol":"common event","Menu 81 Show":"false","Menu 81 Enabled":"true","Menu 81 Ext":"1","Menu 81 Main Bind":"this.callCommonEvent.bind(this)","Menu 81 Actor Bind":"","---Menu 82---":"","Menu 82 Name":"'Common Event 2'","Menu 82 Symbol":"common event","Menu 82 Show":"false","Menu 82 Enabled":"true","Menu 82 Ext":"2","Menu 82 Main Bind":"this.callCommonEvent.bind(this)","Menu 82 Actor Bind":"","---Menu 83---":"","Menu 83 Name":"'Common Event 3'","Menu 83 Symbol":"common event","Menu 83 Show":"false","Menu 83 Enabled":"true","Menu 83 Ext":"3","Menu 83 Main Bind":"this.callCommonEvent.bind(this)","Menu 83 Actor Bind":"","---Menu 84---":"","Menu 84 Name":"","Menu 84 Symbol":"","Menu 84 Show":"","Menu 84 Enabled":"","Menu 84 Ext":"","Menu 84 Main Bind":"","Menu 84 Actor Bind":"","---Menu 85---":"","Menu 85 Name":"","Menu 85 Symbol":"","Menu 85 Show":"","Menu 85 Enabled":"","Menu 85 Ext":"","Menu 85 Main Bind":"","Menu 85 Actor Bind":"","---Menu 86---":"","Menu 86 Name":"","Menu 86 Symbol":"","Menu 86 Show":"","Menu 86 Enabled":"","Menu 86 Ext":"","Menu 86 Main Bind":"","Menu 86 Actor Bind":"","---Menu 87---":"","Menu 87 Name":"","Menu 87 Symbol":"","Menu 87 Show":"","Menu 87 Enabled":"","Menu 87 Ext":"","Menu 87 Main Bind":"","Menu 87 Actor Bind":"","---Menu 88---":"","Menu 88 Name":"","Menu 88 Symbol":"","Menu 88 Show":"","Menu 88 Enabled":"","Menu 88 Ext":"","Menu 88 Main Bind":"","Menu 88 Actor Bind":"","---Menu 89---":"","Menu 89 Name":"","Menu 89 Symbol":"","Menu 89 Show":"","Menu 89 Enabled":"","Menu 89 Ext":"","Menu 89 Main Bind":"","Menu 89 Actor Bind":"","---Menu 90---":"","Menu 90 Name":"TextManager.options","Menu 90 Symbol":"options","Menu 90 Show":"this.needsCommand('options')","Menu 90 Enabled":"this.isOptionsEnabled()","Menu 90 Ext":"","Menu 90 Main Bind":"this.commandOptions.bind(this)","Menu 90 Actor Bind":"","---Menu 91---":"","Menu 91 Name":"","Menu 91 Symbol":"","Menu 91 Show":"","Menu 91 Enabled":"","Menu 91 Ext":"","Menu 91 Main Bind":"","Menu 91 Actor Bind":"","---Menu 92---":"","Menu 92 Name":"","Menu 92 Symbol":"","Menu 92 Show":"","Menu 92 Enabled":"","Menu 92 Ext":"","Menu 92 Main Bind":"","Menu 92 Actor Bind":"","---Menu 93---":"","Menu 93 Name":"","Menu 93 Symbol":"","Menu 93 Show":"","Menu 93 Enabled":"","Menu 93 Ext":"","Menu 93 Main Bind":"","Menu 93 Actor Bind":"","---Menu 94---":"","Menu 94 Name":"","Menu 94 Symbol":"","Menu 94 Show":"","Menu 94 Enabled":"","Menu 94 Ext":"","Menu 94 Main Bind":"","Menu 94 Actor Bind":"","---Menu 95---":"","Menu 95 Name":"TextManager.save","Menu 95 Symbol":"save","Menu 95 Show":"this.needsCommand('save')","Menu 95 Enabled":"this.isSaveEnabled()","Menu 95 Ext":"","Menu 95 Main Bind":"this.commandSave.bind(this)","Menu 95 Actor Bind":"","---Menu 96---":"","Menu 96 Name":"","Menu 96 Symbol":"","Menu 96 Show":"","Menu 96 Enabled":"","Menu 96 Ext":"","Menu 96 Main Bind":"","Menu 96 Actor Bind":"","---Menu 97---":"","Menu 97 Name":"","Menu 97 Symbol":"","Menu 97 Show":"","Menu 97 Enabled":"","Menu 97 Ext":"","Menu 97 Main Bind":"","Menu 97 Actor Bind":"","---Menu 98---":"","Menu 98 Name":"","Menu 98 Symbol":"","Menu 98 Show":"","Menu 98 Enabled":"","Menu 98 Ext":"","Menu 98 Main Bind":"","Menu 98 Actor Bind":"","---Menu 99---":"","Menu 99 Name":"'Debug'","Menu 99 Symbol":"debug","Menu 99 Show":"$gameTemp.isPlaytest()","Menu 99 Enabled":"true","Menu 99 Ext":"","Menu 99 Main Bind":"this.commandDebug.bind(this)","Menu 99 Actor Bind":"","---Menu 100---":"","Menu 100 Name":"TextManager.gameEnd","Menu 100 Symbol":"gameEnd","Menu 100 Show":"true","Menu 100 Enabled":"this.isGameEndEnabled()","Menu 100 Ext":"","Menu 100 Main Bind":"this.commandGameEnd.bind(this)","Menu 100 Actor Bind":""}},
{"name":"YEP_AutoPassiveStates","status":true,"description":"v1.17 This plugin allows for some states to function as\npassives for actors, enemies, skills, and equips.","parameters":{"---Basic---":"","Actor Passives":"0","Enemy Passives":"0","Global Passives":"0","---List---":"...Requires RPG Maker MV 1.5.0+...","Actor Passives List":"[]","Enemy Passives List":"[]","Global Passives List":"[]"}},
{"name":"MPP_VanishState","status":true,"description":"【ver.1.0】戦闘中、バトラーを半透明化させる特徴が作成できます。","parameters":{}},
{"name":"KMS_FlexibleScope","status":true,"description":"[v0.2.0] スキル、アイテムに単体 / 全体切り替え機能を追加します。","parameters":{"Switch for-all button":"shift","Damage rate for-all":"0.5","MP cost rate for-all":"1"}},
{"name":"DirectlyAttackEffect","status":true,"description":"直接攻撃演出プラグイン","parameters":{"フレーム数":"12","高度":"10","アクターに適用":"true","敵キャラに適用":"true","残像不使用":"false","常時残像使用":"false","アクター残像スイッチID":"0","敵キャラ残像スイッチID":"0"}},
{"name":"WeaponSkill","status":true,"description":"武器ごとに通常攻撃のスキルIDを変更します。","parameters":{}},
{"name":"CommandEquip","status":true,"description":"Equip Battle Command v1.1.1","parameters":{"Unchangeable Types":""}}
];
