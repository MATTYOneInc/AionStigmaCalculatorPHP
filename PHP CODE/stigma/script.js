$(document).ready(async function() {
	await Calc.reloadHash();
	Calc.versionPicker();
	Calc.classPicker();
	await Calc.setVersion(Calc.version);
	Calc.classSetLevel(Calc.level.toString(), false);
	Calc.setRace(Calc.race, false);
	Calc.reloadStigmas(Calc.className);

	isFirstLoad = false;

	$("#class-level").change(function() {
		Calc.classSetLevel($(this).val(), true);
	}).click(function(){ $(this).select() });
	
	$("#race_wrapper").click(function() {
		if (Calc.race == 'pc_light') {
			Calc.setRace('pc_dark', true);
		} else {
			Calc.setRace('pc_light', true);
		}
	});
	
	$(".lang-icon").click(function() {
		var res = /_([^_]+)$/.exec($(this).attr('id'));
		if (res && res[1]) {
			Calc.langChange(res[1]);
		}
	});
	
	$(".lang-icon").toggleClass('lang-incative', true);
	$("#lang_"+ Calc.lang).toggleClass('lang-incative', false);
	
	$(window).bind('hashchange', function(e) { Calc.reloadHash() });
	
	$("#stigma_link").keydown(function(){$(this).select();});
	$("#stigma_link").click(function(){$(this).select();return false;});
	
	$(".iface-string").html(function() {
		var res = /_([^_]+)$/.exec($(this).attr('id'));
		if (res && res[1]) {
			return getLang('interface', res[1]);
		}
		return '[wrong_string]';
	});
});

let isFirstLoad = true;
let stigmas = {};
let stigmaValues = {};

Calc = {
	version: Aion.VERSION,
	className:'priest',
	race:'pc_light',
	level:Aion.versionsData[Aion.VERSION].MAX_CHAR_LEVEL,
	freeStigmas:{},
	slots:[],
	norAllowed: 6,
	advAllowed: 6,
	norLevel:[20,20,30,40,50,55],
	advLevel:[45,45,50,52,55,58],
	autoReload:true,
	maxCharLevel: Aion.versionsData[Aion.VERSION].MAX_CHAR_LEVEL,
	SLOTS_NOR_MAX:6,
	SLOTS_ADV_MAX:6,
	MIN_CHAR_LEVEL: 20
}

Calc.setClass = function(cl) {
	if (cl == Calc.className)
		return;
		
	Calc.className = cl;
	Calc.classPicker();
	Calc.resetStigmas();
	Calc.reloadStigmas(cl);
	Calc.recalcCost();
}

Calc.setVersion = async function(v) {
	let isSameVersion = v == Calc.version;

	if (isSameVersion && !isFirstLoad)
		return;
	
	Calc.maxCharLevel = Aion.versionsData[v].MAX_CHAR_LEVEL;

	if (!isSameVersion) {
		Calc.version = v;
		Calc.versionPicker();
		Calc.classPicker();
	}

	let title = getLang('base', 'title', v);
	document.title = title;
	$('#title h1').html(title);
	$('#version_layer').html(v);
	$('#stigma_adv_3').toggleClass('col-span-2', v < 3);
	$('#stigma_adv_6').toggle(v >= 3);
	
	if (!isFirstLoad || !location.hash)
		await setStigmasData(v);

	await setStigmaValues(v);
	await setLang(Calc.lang, v);

	if (!isFirstLoad) {
		Calc.classSetLevel(Calc.level);
		Calc.reloadStigmas(Calc.className);	
	}
}

Calc.setRace = function(race, reload) {
	if (race != 'pc_light' && race != 'pc_dark')
		return;
	
	Calc.race = race;
	
	if (!isFirstLoad) {
		for (var i = 0; i < Calc.SLOTS_NOR_MAX + Calc.SLOTS_ADV_MAX; ++i) {
			if (Calc.slots[i]) {
				var name = Calc.slots[i].name;
				if (/_(light|dark)$/.exec(name)) {
					var stigma = stigmas[Calc.className][name];
					if (stigma.alt) {
						name = stigma.alt;
					} else {
						if (race == 'pc_light') {
							name = name.replace(/_(light|dark)$/, '_light');
						} else {
							name = name.replace(/_(light|dark)$/, '_dark');
						}
					}
					if (stigmas[Calc.className][name]) {
						Calc.slots[i].name = name;
						Calc.drawStigmaSlot(i+1);
					} else {
						Calc.useStigma(Calc.slots[i].name, -1, !reload);
					}
				}
			}
		}
	}
	
	if (race == 'pc_light') {
		$("#race_wrapper").toggleClass('race-asmodian', false);
	} else {
		$("#race_wrapper").toggleClass('race-asmodian', true);
	}
	if (reload)
		Calc.reloadStigmas(Calc.className);
}

Calc.langChange = function(lang) {
	document.location = '?lang='+lang+'#'+ Calc.getHash();
}

Calc.classSetLevel = function(lvl, reload) {
	if (lvl < Calc.MIN_CHAR_LEVEL) {
		lvl = Calc.MIN_CHAR_LEVEL;
	} else if (lvl > Calc.maxCharLevel || !Number.isInteger(parseInt(lvl, 10))) {
		lvl = Calc.maxCharLevel;
	}
	
	$("#class-level").val(lvl);
	$("#class-level").blur();
	Calc.level = parseInt(lvl, 10);
	
	$(".stigma-slot-inactive").toggleClass('stigma-slot-inactive', false);
	$(".stigma-slot-advance-inactive").toggleClass('stigma-slot-advance-inactive', false);

	for (var i=0; i < Calc.slots.length; ++i) {
		if (!stigmaValues[Calc.slots[i].name])
			Calc.removeStigma(i);
	}
	
	Calc.norAllowed = 0;
	for (var i=0; i < Calc.SLOTS_NOR_MAX; ++i) {
		if (Calc.norLevel[i] > Calc.level) {
			Calc.removeStigma(i);
			$("#stigma_nor_"+(i+1)).toggleClass('stigma-slot-inactive', true);
		} else 
		++Calc.norAllowed;
	}
	Calc.advAllowed = 0;
	for (var i=0; i < Calc.SLOTS_ADV_MAX; ++i) {
		var s = Calc.SLOTS_NOR_MAX + i;
		if (Calc.advLevel[i] > Calc.level) {
			Calc.removeStigma(s);
			$("#stigma_adv_"+(i+1)).toggleClass('stigma-slot-advance-inactive', true);
		} else 
		++Calc.advAllowed;
	}
	
	$('.stigma-slot').off();
	addInactiveSlotTooltip('stigma-slot-inactive');
	addInactiveSlotTooltip('stigma-slot-advance-inactive');
	
	for (var i=0; i < Calc.slots.length; ++i) {
		if (Calc.slots[i]) {
			var lvl = isFirstLoad ? Calc.slots[i].level : Calc.getMaxStigmaLevel(Calc.slots[i].name);
			if (! lvl)
				lvl = -1;
			Calc.useStigma(Calc.slots[i].name, lvl, !reload);
		}
	}

	if (reload)
		Calc.reloadStigmas(Calc.className);
}

function addInactiveSlotTooltip(htmlClassName) {
	$('.' + htmlClassName).mouseenter(function(e){
		let slotId = e.target.id.split('_');
		let reqLvl = slotId[1] == 'nor' ? Calc.norLevel[slotId[2] - 1] : Calc.advLevel[slotId[2] - 1];
		var html = '<span class="error-text">'+ getLang('base', 'reqlvl', reqLvl) + '</span><br>';
		$('#stigma_tooltip').html(html).show();
		UI.reposWindow('#stigma_tooltip', e);
	});
	$('.' + htmlClassName).mousemove(function(e){UI.reposWindow('#stigma_tooltip', e)});
	$('.' + htmlClassName).mouseleave(function(e){
		$('#stigma_tooltip').hide();
		UI.reposWindow('#stigma_tooltip', e);
	});
}

Calc.removeStigma = function(slot) {
	if (Calc.slots[slot]) {
		Calc.useStigma(Calc.slots[slot].name, -1, true);
	}
}

Calc.resetStigmas = function() {
	for (var i=0; i < Calc.slots.length; ++i) {
		Calc.slots[i] = '';
		Calc.drawStigmaSlot(i+1);
	}
	Calc.recalcCost();
}

Calc.getMaxStigmaLevel = function(stigmaName) {
	var stigma = stigmas[Calc.className][stigmaName];
	if (! stigma)
		return 0;
	var lvl = 0;
	for (var i=0; i < stigma.levels.length; ++i) {
		if (stigma.levels[i] > Calc.level)
			break;
		lvl = i+1
	}
	return lvl;
}

Calc.drawStigma = function(stigmaName) {
	var res = '';
	var stigma = stigmas[Calc.className][stigmaName];
	var aval = Calc.canInsert(stigmaName);
	if (Calc.hasStigma(stigmaName))
		aval = 0;
	
	res += '<div class="stigma-border">';
	var lvl = Calc.getMaxStigmaLevel(stigmaName);
	if (lvl < 1)
		lvl = 1;
	var icon = stigma.icon +'_g'+ lvl;
	if (stigma.icons && stigma.icons[lvl])
		icon = stigma.icons[lvl];
	res += '<div class="stigma-free" id="stigma_'+ stigmaName +'" style="background-image:url(../icons/skills/'+ icon + '.png)"><div class="stigma-free-hover"></div>';
	if (! aval) {
		if (Calc.hasStigma(stigmaName)) {
			res += '<div class="stigma-green"></div>';
		} else if (Calc.getMaxStigmaLevel(stigmaName) < 1) {
			res += '<div class="stigma-red"></div>';
		} else {
			res += '<div class="stigma-gray"></div>';
		}
	} 
	res += '</div></div>';
	return res;
}

Calc.drawStigmaSlot = function(num) {
	var name = '';
	var cl = '';
	var stigma;
	var level = 0;
	if (Calc.slots[num-1]) {
		stigma = stigmas[Calc.className][Calc.slots[num-1].name];
		level = Calc.slots[num-1].level;
	}
	if (num <= Calc.SLOTS_NOR_MAX) {
		name = 'stigma_nor_'+num;
		cl = 'stigma-slot-active';
	} else {
		name = 'stigma_adv_'+ (num-Calc.SLOTS_NOR_MAX);
		cl = 'stigma-slot-advance-active';
	}
	var res = '';

	if (stigma) {
		var lvl = Calc.slots[num-1].level;
		var icon = stigma.icon +'_g'+ lvl;
		if (stigma.icons && stigma.icons[lvl])
			icon = stigma.icons[lvl];
		
		res += '<div class="stigma-icon" style="background:url(../icons/skills/'+ icon +'.png)"></div>';
	
		res += '<div class="stigma-tools">';
		var top, left;
		var lvls = Calc.getMaxStigmaLevel(Calc.slots[num-1].name);
		var start = 0.5 + ((lvls-1)/2)/5;
		for (var i=0; i < lvls; ++i) {
			top = Math.round(30 + 40*Math.sin(Math.PI*(start - i / 5)));
			left = Math.round(30 + 40*Math.cos(Math.PI*(start - i / 5)));
			res += '<div class="stigma-level'+ (i+1 == level ? ' stigma-level-active': '') +'" id="level_'+ (i+1) +'" style="top:'+ top +'px;left:'+ left +'px"><table border="0" cellpadding="0" cellspacing="0"><tr><td>'+ stigma.levels[i] +'</td></tr></table></div>';
		}
		res += '</div>';
		
		$("#"+ name).html(res);
		$("#"+ name).toggleClass(cl, true);
	} else {
		$("#"+ name).toggleClass(cl, false);
	}
	
	$("#"+ name).html(res);
	
	$("#"+ name).find(".stigma-level").click(function(){
		var res = /(nor|adv)_(\d+)$/.exec($(this).parents(".stigma-slot").attr('id'));
		var slot;
		var level = 0;
		if (res && res[2])
			slot = parseInt(res[2]) + (res[1] == 'adv' ? Calc.SLOTS_NOR_MAX : 0);
		res = /level_(\d+)$/.exec($(this).attr('id'));
		if (res && res[1])
			level = res[1];
		Calc.useStigma(Calc.slots[slot-1].name, level);
	});

	$("#"+ name).find(".stigma-icon").click(function(e){
		if (e.ctrlKey) {
			Calc.resetStigmas();
			Calc.reloadStigmas(Calc.className);
			return;
		}
		var res = /(nor|adv)_(\d+)$/.exec($(this).parents(".stigma-slot").attr('id'));
		var slot;
		if (res && res[2])
			slot = parseInt(res[2]) + (res[1] == 'adv' ? Calc.SLOTS_NOR_MAX : 0);
		res = /level_(\d+)$/.exec($(this).attr('id'));
		Calc.useStigma(Calc.slots[slot-1].name, -1);
	});	
	
	$("#"+ name).find(".stigma-icon").mouseenter(function(e){
		var stigmaName = Calc.slots[num-1].name;
		if (stigmaName) {
			let lvl = stigmas[Calc.className][stigmaName].levels[level - 1];
			let quality = stigmas[Calc.className][stigmaName].quality;

			if (!stigmaName)
				return;

			var html = '<span class="' + quality + '-stigma-text">' + getLang('skillnames', stigmaName) + ' '+ arab2rome(level) + '</span> - ' + getLang('base', 'lvl') + ' ' + lvl;
			var desc = Calc.getSkillDesc(stigmaName, level);
			if (desc != stigmaName) {
				html += '<hr>';
				html += desc;
			}
			$('#stigma_tooltip').html(html).show();
			UI.reposWindow('#stigma_tooltip', e, {x:30,y:0});
		}
	});
	$("#"+ name).find(".stigma-icon").mousemove(function(e){e.pageX += 30;UI.reposWindow('#stigma_tooltip', e)});
	$("#"+ name).find(".stigma-icon").mouseleave(function(e){
		$('#stigma_tooltip').hide();
		UI.reposWindow('#stigma_tooltip', e);
	});
}

Calc.getFreeSlot = function(stigmaName) {
	if (!stigmas[Calc.className] || !stigmas[Calc.className][stigmaName])
		return false;
	var stigma = stigmas[Calc.className][stigmaName];

	var slot = Calc.hasStigma(stigmaName);
	if (slot) {
		return slot;
	}
	if (stigma.type == 1) {
		for (var i=0; i < Calc.norAllowed; ++i) {
			if (!Calc.slots[i] || Calc.slots[i].name == stigmaName)
				return 1+i;
		}
	}
	for (var i=0; i < Calc.advAllowed; ++i) {
		if (!Calc.slots[Calc.SLOTS_NOR_MAX+i] || Calc.slots[Calc.SLOTS_NOR_MAX+i].name == stigmaName)
			return 1+Calc.SLOTS_NOR_MAX+i;
	}
	return false;
}

Calc.useStigma = function(stigmaName, level, noRefresh, noCheck) {
	if (! stigmaName) {
		Calc.slots[slot-1] = '';
		Calc.drawStigmaSlot(slot);
		Calc.recalcCost();
		return;
	}
	var slot = Calc.getFreeSlot(stigmaName);
	if (level < 0) {
		let slotIndex = Calc.slots.findIndex(s => s.name == stigmaName);
		Calc.slots[slotIndex] = '';
		Calc.removeRecursive(stigmaName);
		if (slot)
			Calc.checkNormalInAdvanced();
		else
			slot = slotIndex + 1;
	} else if (slot && (noCheck || Calc.checkStigma(stigmaName))) {
		var stigma = stigmas[Calc.className][stigmaName];
		if (! level)
			level = stigma.levels.length;
		var ml = Calc.getMaxStigmaLevel(stigmaName);
		if (level > ml)
			level = ml;
		Calc.slots[slot-1] = {name : stigmaName, level : level};
	} else if (slot && Calc.canInsert(stigmaName)) {
		var st = Calc.getRequiredStigmas(stigmaName);
		for (var i in st) {
			var s = stigmas[Calc.className][i];
			if (s.type == 1)
				Calc.useStigma(i, 99, 1);
		}
		var adv = [];
		for (var i in st) {
			adv.push(i);
		}
		
		adv.sort(function(a,b) {
			var s1 = stigmas[Calc.className][a].levels[0];
			var s2 = stigmas[Calc.className][b].levels[0];
			return s1 > s2 ? 1 : s1 == s2 ? 0 : -1;
		});
		
		for (var i=0; i < adv.length; ++i) {
			var s = stigmas[Calc.className][adv[i]];
			if (s.type >= 2)
				Calc.useStigma(adv[i], 99, 1, 1);
		}
	}
	Calc.drawStigmaSlot(slot);
	if (!noRefresh)
		Calc.reloadStigmas(Calc.className);
	Calc.recalcCost();
}

Calc.checkNormalInAdvanced = function() {
	var st = [];
	for (var i = Calc.advAllowed-1; i >=0; --i) {
		if (! Calc.slots[Calc.SLOTS_NOR_MAX+i])
			continue;
		var sname = Calc.slots[Calc.SLOTS_NOR_MAX+i].name;
		if (sname) {
			var stigma = stigmas[Calc.className][sname];
			if (stigma.type == 1)
				st.push(Calc.SLOTS_NOR_MAX+i);
		}
	}
	
	if (st.length == 0)
		return;
		
	for (var i=0; i < Calc.norAllowed && st.length > 0; ++i) {
		if (!Calc.slots[i]) {
			var as = st.shift();
			Calc.slots[i] = {
				name : Calc.slots[as].name,
				level : Calc.slots[as].level
			};
			Calc.slots[as] = '';
			Calc.drawStigmaSlot(as+1);
			Calc.drawStigmaSlot(i+1);
		}
	}
	Calc.reloadStigmas(Calc.className);
}

Calc.removeRecursive = function(stigmaName) {
	for (var s in stigmas[Calc.className]) {
		var stigma = stigmas[Calc.className][s];
		if (! stigma.require)
			continue;
		for (var i = 0; i < stigma.require.length; ++i) {
			if ($.isArray(stigma.require[i])) {
				for (var j=0; j <= stigma.require[i].length; ++j) {
					if (stigma.require[i][j] == stigmaName) {
						Calc.useStigma(s, -1);
					}
				}
			} else {
				if (stigma.require[i] == stigmaName) {
					Calc.useStigma(s, -1);
				}
			}
		}
	}
}

/**
 * Checks if a stigma is set in a slot and return its
 * slot index if present, 0 otherwise.
 * @param {string} stigmaName 
 * @returns {number}
 */
Calc.hasStigma = function(stigmaName) {
	for (var i=0; i < Calc.slots.length; ++i) {
		if (Calc.slots[i] && Calc.slots[i].name == stigmaName) {
			return i+1;
		}
	}
	return 0;
}

Calc.recalcCost = function(stigmaName) {
	var shard = 0, abyss = 0;
	for (var i=0; i < Calc.slots.length; ++i) {
		if (Calc.slots[i]) {
			var stigma = stigmas[Calc.className][Calc.slots[i].name];
			if (stigma) {
				if (stigma.abyss)
					abyss += stigma.abyss[Calc.slots[i].level-1];
				shard += stigma.shards ? stigma.shards[Calc.slots[i].level-1] : 0;
			}
		}
	}
	$("#cost_shard").html(addCommas(shard));
	$("#cost_abyss").html(addCommas(abyss));
}

Calc.canInsert = function (stigmaName) {
	if (!Calc.getMaxStigmaLevel(stigmaName))
		return false;
	
	var free = {nor:0,adv:0};
	var req  = {nor:0,adv:0};
	
	for (var i=0; i < Calc.norAllowed; ++i) {
		if (!Calc.slots[i])
			++free.nor;
	}
	for (var i=0; i < Calc.advAllowed; ++i) {
		if (!Calc.slots[Calc.SLOTS_NOR_MAX+i])
			++free.adv;
	}
	
	var st = Calc.getRequiredStigmas(stigmaName);
	
	for (var i in st) {
		if (Calc.hasStigma(i))
			continue;
		
		var s = stigmas[Calc.className][i];
		if (s.type == 1) {
			++req.nor;
		} else {
			++req.adv;
		}
	}
	
	if ( (req.nor <= free.nor && req.adv <= free.adv)
			|| (req.adv <= free.adv && req.nor <= free.nor - req.adv + free.adv) ) {
		return true;
	}
	return false;
}

Calc.getRequiredStigmas = function (stigmaName) {
	var stigma = stigmas[Calc.className][stigmaName];
	var req = {};
	req[stigmaName] = 1;
	
	if (stigma.require) {
		for (var s in stigma.require) {
			var s2;
			if ($.isArray(stigma.require[s])) {
				var nn = stigma.require[s];
				for (var i=0; i < nn.length; ++i) {
					var subs = stigmas[Calc.className][nn[i]];
					if (subs.race && subs.race != Calc.race)
						continue;
					s2 = nn[i];
					break;
				}
			} else {
				s2 = stigma.require[s];
			}
			$.extend(req, Calc.getRequiredStigmas(s2));
		}
	}
	return req;
}

Calc.checkStigma = function (stigmaName) {
	var stigma = stigmas[Calc.className][stigmaName];
	if (!stigma)
		return false;
	if (!Calc.getMaxStigmaLevel(stigmaName))
		return false;
	if (!stigma.require) {
		return true;
	} else {
		var a = true;
		for (var s in stigma.require) {
			if ($.isArray(stigma.require[s])) {
				var subval = false;
				for (var subreq in stigma.require[s]) {
					subval = subval || Calc.hasStigma(stigma.require[s][subreq]);
				}
				a = a && subval;
			} else {
				a = a && Calc.hasStigma(stigma.require[s]);
			}
		}
		return a;
	}
}

Calc.classPicker = function() {
	var cllist = [];
	for (var name in Aion.classesData) {
		if (Aion.classesData[name].hidden)
			continue;

		let isValidClass = Aion.classesData[name].fromVersion <= Calc.version && Aion.classesData[name].versionType.includes(Aion.versionsData[Calc.version].type);

		if (name == Calc.className) {
			if (!isValidClass) {
				Calc.className = 'priest';
				name = 'priest';
				Calc.resetStigmas();
			}
			cllist.unshift({name: 'class-icon-'+ name, label : getLang('classes', name), value : name, order: Aion.classesData[name].ord})
		} else if (isValidClass) {
			cllist.push({name: 'class-icon-'+ name, label : getLang('classes', name), value : name, order: Aion.classesData[name].ord})
		}
	}
	
	$("#class-picker").empty().makeSelect({
		classRow : 'class-picker-row',
		classIcon : 'class-picker-icon',
		classLabel : 'class-picker-label',
		keepSort: 1,
		items : cllist
	});
	
	$("#class-picker input.select-input").change(function(){
		Calc.setClass($(this).attr('value'));
	});
}

Calc.versionPicker = function() {
	var vlist = [];
	for (var versionNb in Aion.versionsData) {
		let version = Aion.versionsData[versionNb];
		let vObj = {
			name: 'version-'+ version.type + '-' + versionNb.toString().replace('.', '-'), 
			label : versionNb + ' (' + version.label + ')', 
			value : versionNb,
			order: version.ord
		};
				
		if (versionNb == Calc.version) {
			vlist.unshift(vObj);
		} else {
			vlist.push(vObj);
		}
	}	
	
	$("#version-picker").empty().makeSelect({
		classRow : 'class-picker-row',
		classLabel : 'version-picker-label',
		keepSort: 1,
		items : vlist,
		showSpeed: 100,
		hideSpeed: 100
	});

	$("#select-version").html(getLang('base', 'version'));

	$("#version-picker input.select-input").change(function(){
		Calc.setVersion($(this).attr('value'));
	});
}

Calc.reloadStigmas = function(cl) {
	var allreq = {};
	Calc.freeStigmas = {};
	$('#stigma_tooltip').hide();
	
	for (var s in stigmas[cl]) {
		var stigma = stigmas[cl][s];
		Calc.freeStigmas[s] = stigma;
		
		if (stigma.type < 2)
		continue;

		if (Calc.getMaxStigmaLevel(s) < 1 && stigma.levels[0] > Calc.maxCharLevel) {
			allreq[s] = 1;
			continue;
		}

		for (var rs in stigma.require) {
			var a;
			if ($.isArray(stigma.require[rs]))
				a = stigma.require[rs];
			else
			a = [stigma.require[rs]];
			
			for (var r in a) {
				allreq[a[r]] = 1;
				delete Calc.freeStigmas[s];
			}
		}
	}
	
	var toplevel = [];
	for (var s in stigmas[cl]) {
		var stigma = stigmas[cl][s];
		
		if (stigma.type < 2)
		continue;
		if (stigma.race && stigma.race != Calc.race)
		continue;
		if (allreq[s])
		continue;
		toplevel.push(s);
	}
	
	var tree = '<table border="0" width="660" height="100%"><tr>';
	for (var i=0; i < toplevel.length; ++i) {
		tree += '<td width="50%">'+ subTree(toplevel[i],0,1) +'</td>';
	}
	tree += '</tr></table>';
	$("#stigma_tree_wrapper").html(tree);
	
	$(".tree-arrow-bottom-line").each(function(){
		var h = Math.max(54, $(this).parents(".tree-stigma-td").height()/2);
		$(this).css('height', h);
	});
	$(".tree-arrow-top-line").each(function(){
		var h = Math.max(54, $(this).parents(".tree-stigma-td").height()/2);
		$(this).css('height', h);
	});
	
	var res = '<div class="stigma-padding"></div>';
	
	var list = [];
	for (var s in Calc.freeStigmas) {
		list.push(s);
	}
	list = list.sort(function(a,b) {
		var v1 = stigmas[Calc.className][a].levels[0];
		var v2 = stigmas[Calc.className][b].levels[0];
		return v1 > v2 ? 1 : v1 < v2 ? -1 : 0;
	});
	for (var j = 0; j < list.length; ++j) {
		var stigma = Calc.freeStigmas[list[j]];
		if (!stigma.race || stigma.race == Calc.race) {
			if (! Calc.hasStigma(list[j]) && (Calc.getMaxStigmaLevel(list[j]) > 0 || stigma.levels[0] <= Calc.maxCharLevel))
				res += Calc.drawStigma(list[j]);
		}
	}
	$("#stigma_free_wrapper").html(res);
	
	$(".stigma-free").click(function(){
		var res = /^stigma_(.*)$/.exec($(this).attr('id'));
		if (res && res[1]) {
			Calc.useStigma(res[1]);
		}
	});
	
	$(".stigma-free").mouseenter(function(e){
		var html = '';
		var res = /^stigma_(.*)$/.exec($(this).attr('id'));
		if (res && res[1]) {
			var stigmaName = res[1];
			var level = Calc.getMaxStigmaLevel(stigmaName);
			if (! level)
				level = 1;
				
			let lvl = stigmas[Calc.className][stigmaName].levels[level - 1];	
			let quality = stigmas[Calc.className][stigmaName].quality;
					
			html += '<span class="' + quality + '-stigma-text">' + getLang('skillnames', stigmaName) + ' '+ arab2rome(level) + '</span> - ' + getLang('base', 'lvl') + ' ' + lvl;
			html += '<hr>' + Calc.getSkillDesc(stigmaName, level);
		}
		$('#stigma_tooltip').html(html).show();
		UI.reposWindow('#stigma_tooltip', e);
	});
	$(".stigma-free").mousemove(function(e){UI.reposWindow('#stigma_tooltip', e)});
	$(".stigma-free").mouseleave(function(e){
		$('#stigma_tooltip').hide();
		UI.reposWindow('#stigma_tooltip', e);
	});
	
	setLinkWithHash();
}

Calc.getSkillDesc = function(stigmaName, level) {
	function hms(sec, noval) {
		if (! /^[\d\.]+$/.exec(sec))
			return sec;
			
		var v = {hour:0,min:0,sec:0};
		while (sec >= 3600) {
			++v.hour;
			sec -= 3600;
		}
		while (sec >= 60) {
			++v.min;
			sec -= 60;
		}
		v.sec = sec;
		res = [];
		
		if (v.hour)
		res.push(v.hour + (noval ? '' : ' '+ getLang('base', 'hour')));
		if (v.min)
		res.push(v.min + (noval ? '' : ' '+ getLang('base', 'min')));
		if (v.sec || res.length == 0)
		res.push(v.sec + (noval ? '' : ' '+ getLang('base', 'sec')));
		
		return res.join(' ');
	}
	
	if (!stigmaName)
	return '';	
	
	var cnt = 1;
	var desc = '';
	while (stigmaValues[stigmaName + (cnt > 1 ? '_'+cnt : '') ]) {
		var sn = stigmaName + (cnt > 1 ? '_'+cnt : '');
		var min = 0;
		for (var  i in stigmaValues[sn]) {
			if (!min || i < min) {
				min = i
			}
		}
		if (min > level)
			break;
			var data = $.extend({}, stigmaValues[sn][min], stigmaValues[sn][level]);
			var d = getLang('skilldesc', sn).replace(/\n/g, '<br />');
			if (cnt > 1)
			desc += '<hr>';
			if (cnt > 1 || stigmaValues[sn+'_2'])
			desc += '<div class="cost-title">'+ getLang('base', 'stage', cnt) +'</div>';
			++cnt;
			if (d == sn) {
				d = getLang('base', 'nodesc');
		}
		desc += d.replace(/\[%(.*?)\]%?/g, function(){
			if (!stigmaValues[sn])
			return res;
			
			var id = arguments[1].toLowerCase();
			var res = data[id];
			
			if (/(remaintime|checktime|delayedtime|summontime)$/i.exec(id)) {
				res = hms(res);
			} else if (/(randomtime)$/i.exec(id)) {
				res = hms(res, 1);
			} else if (res && lang.bonusnames[res.toLowerCase()]) {
				res = getLang('bonusnames', res.toLowerCase());
			} else if (res && lang.other[res.toLowerCase()]) {
				res = getLang('other', res.toLowerCase());
			}
			if (! res)
			res = getLang('base', 'novalue');
				
			return res;
		});
		
		var costtable = '<table border="0">';
		var costcnt = 0;
		for (var i in {cost:1,casttime:1,cooltime:1,dist:1,target:1,area:1}) {
			if (i == 'cooltime' && cnt > 2)
				continue;
				var res = data[i];
				if (i == 'cost') {
					var ct = data.costtime;
				if (ct)
					res = res +' '+ getLang('base', 'every') +' '+ hms(ct);
			}
			if (i == 'casttime') {
				if (res < 0)
					res = getLang('base', 'instant');
				if (! res)
					res = 0;
			}
			
			if (i == 'target' && data.target) {
				res = getLang('base', data.target, data.nb_targets);
			}
			
			if (i == 'area' && data.target_radius_effect) {
				res = data.target_radius_effect + ' m';
			}
			
			if (i == 'dist' && data.first_target_valid_distance) {
				res = data.first_target_valid_distance + ' m';
			}
			
			if (res || i == 'casttime') {
				if (/time$/.exec(i)) {
					res = hms(res);
				}
				++costcnt;
				costtable += '<tr><td class="cost-title">'+ getLang('base', i) +'</td><td class="cost-value">'+ res +'</td></tr>';
			}
		}
		if (costcnt)
			costtable += '</table>';
		
		desc += '<hr>' + costtable;
		
		var hiddenEffectsTable = '<table border="0">';
		costcnt = 0;
		for (var i in {candispel:1,enmity:1,pvpdmgratio:1,pvpremaintimeratio:1,cancelrate:1,critprob:1,slow:1,bonus:1,dispelbuff:1,dispeldebuff:1,dispeldebuffphysical:1,dispeldebuffmental:1,canmove:1,canjumpshot:1}) {
			var res = data[i];
				
			if (i == 'candispel' && data.dispellvl) {
				res = getLang('base', "true");

				if (parseInt(data.dispellvl) > 1)
					res += ` (${data.dispellvl})`;
			}
			
			if (i == 'enmity' && data.enmity) {
				if (Array.isArray(data.enmity)) {
					data.enmity.forEach(b => {
						res = b.replace(/^(\d*)/g, function(x, val){
							return parseInt(val).toLocaleString();;
						});
						++costcnt;
						hiddenEffectsTable += '<tr><td class="cost-title">'+ getLang('base', i) +'</td><td class="cost-value">'+ res +'</td></tr>';
					});
				} else {
					res = parseInt(data.enmity).toLocaleString();
					++costcnt;
					hiddenEffectsTable += '<tr><td class="cost-title">'+ getLang('base', i) +'</td><td class="cost-value">'+ res +'</td></tr>';
				}
			
			} else if (i == 'dispelbuff' && data[i + '.dispelcount']) {
				res = getLang('base', i, data[i + '.dispelstrength'], data[i + '.dispelcount'], data[i + '.dispellvl']);
				++costcnt;
				hiddenEffectsTable += '<tr><td class="cost-title" colspan="2">'+ res +'</td></tr>';
			} else if (i.startsWith('dispeldebuff')) {
				if (data[i + '.dispelcount']) {
					let type = 'neg';
					if (i == 'dispeldebuffphysical') type = 'phy';
					if (i == 'dispeldebuffmental') type = 'mag';

					res = getLang('base', 'dispeldebuff', data[i + '.dispelstrength'], data[i + '.dispelcount'], getLang('base', type), data[i + '.dispellvl']);
					++costcnt;
					hiddenEffectsTable += '<tr><td class="cost-title" colspan="2">'+ res +'</td></tr>';
				}
			} else if (i == 'bonus' && data.accbonus) {
				data.accbonus.forEach(b => {
					res = b.replace(/\$(\w+)/g, function(x, name){
						if (lang.bonusnames[name.toLowerCase()])
							name = getLang('bonusnames', name.toLowerCase());
							
						return name;
					});
					++costcnt;
					hiddenEffectsTable += '<tr><td class="cost-title" colspan="2">'+ res +'</td></tr>';
				});
			} else if ((i == 'canmove' && data.canmove) || (i == 'canjumpshot' && data.canjumpshot)) {
				++costcnt;
				hiddenEffectsTable += '<tr><td class="cost-title" colspan="2">'+ getLang('base', i) +'</td></tr>';
			} else if (res) {
				++costcnt;
				hiddenEffectsTable += '<tr><td class="cost-title">'+ getLang('base', i) +'</td><td class="cost-value">'+ res +'</td></tr>';
			}
		}
		if (costcnt > 0)
			desc += '<hr>' + hiddenEffectsTable + '</table>';
	}
	
	var stigma = stigmas[Calc.className][stigmaName];
	desc += '<hr>';
	if (Calc.getMaxStigmaLevel(stigmaName) < 1) {
		desc += '<span class="error-text">'+ getLang('base', 'reqlvl', stigma.levels[0]) + '</span><br>';
	}
	
	var shardCorst = stigma.shards ? stigma.shards[level-1] : 0;
	desc += '<span class="cost-title"><table><tr><td><div class="cost-shard"></div></td><td>'+ addCommas(shardCorst) + '</td>';
	if (stigma.abyss && stigma.abyss[level-1]) {
		desc += '<td><div class="cost-abyss"></div></td><td>'+ addCommas(stigma.abyss[level-1]) +'</td>';
	}
	desc += '</tr></table></span>';
	
	desc = desc.replace(/%%/g, '%');
	desc = desc.replace(/\.\./g, '.');
	return desc;
}

function arab2rome(num) {
	if (num == 1) return 'I';
	if (num == 2) return 'II';
	if (num == 3) return 'III';
	if (num == 4) return 'IV';
	if (num == 5) return 'V';
	if (num == 6) return 'VI';
	if (num == 7) return 'VII';
	if (num == 8) return 'VIII';
	if (num == 9) return 'IX';
}

function subTree(name, pos, f) {
	var stigma = stigmas[Calc.className][name];
	var res = '';
	
	res += '<table border="0" width="100%"><tr><td width="100%">';
	var first = true;
	if (stigma.require) {
		res += '<td>';
		for (var st in stigma.require) {
			var nn = stigma.require[st];
			if ($.isArray(nn)) {
				for (var i=0; i < nn.length; ++i) {
					var subs = stigmas[Calc.className][nn[i]];
					if (subs.race && subs.race != Calc.race)
					continue;
					nn = nn[i];
					break;
				}
			}
			res += subTree(nn, first ? 0 : 1, stigma.require.length == 1);
			first = false;
		}
		res += '</td>';
	}
	res += '<td class="tree-stigma-td">';
	if (!f) {
		if (pos == 1) {
			res += '<div class="tree-wrap"><div class="tree-wrap-2"><div class="tree-arrow-bottom"></div>';
			res += '<div class="tree-arrow-bottom-line"></div></div></div>';
		} else {
			res += '<div class="tree-wrap"><div class="tree-wrap-2"><div class="tree-arrow-top"></div>';
			res += '<div class="tree-arrow-top-line"></div></div></div>';
		}
	} 
	if (stigma.require) {
		if (stigma.require.length == 1) {
			res += '<div class="tree-wrap"><div class="tree-arrow-in-single"></div></div>';
		} else {
			res += '<div class="tree-wrap"><div class="tree-arrow-in"></div></div>';
		}
	}
	res += Calc.drawStigma(name);
	res += '</td></tr></table>';
	return res;
}

Calc.encodeNumber = function(num) {
	var digits = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
	var l = num.toString(26).split('');
	var code = '';
	for (var i = 0; i < l.length; ++i) {
		if (i < l.length - 1)
		code += digits[parseInt(l[i],26)].toUpperCase();
		else
		code += digits[parseInt(l[i],26)];
	}
	return code;
}

Calc.decodeNumber = function(code) {
	var digits = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
	var res = '';
	for (var i = 0; i < code.length; ++i) {
		var p = $.inArray(code[i].toLowerCase(), digits);
		if (p < 0)
		return 0;
		res += p.toString(26);
	}
	return parseInt(res, 26);
}

Calc.decodeArray = function(data) {
	var nums = [];
	var code = '';
	for (var i=0; i < data.length; ++i) {
		code += data[i];
		if (data[i] == data[i].toLowerCase()) {
			nums.push(Calc.decodeNumber(code));
			code = '';
		}
	}
	return nums;
}

Calc.encodeArray = function(ar) {
	var str = '';
	for (var i=0; i < ar.length; ++i) {
		str += Calc.encodeNumber(ar[i]);
	}
	return str;
}

Calc.getHash = function() {
	var ar = [Calc.version * 10, Aion.classesData[Calc.className].ord-1, Calc.level, Calc.race == 'pc_light' ? 0 : 1];
	for (var i = 0; i < Calc.SLOTS_NOR_MAX + Calc.SLOTS_ADV_MAX; ++i) {
		if (Calc.slots[i]) {
			var stigma = stigmas[Calc.className][Calc.slots[i].name];
			ar.push(stigma.ord-1, Calc.slots[i].level-1);
		}
	}
	return Calc.encodeArray(ar);
}

Calc.loadHash = async function (data) {
	if (!Calc.autoReload)
		return;
		
	Calc.autoReload = false;
	var ar = Calc.decodeArray(data);
	Calc.version = parseFloat(ar[0] / 10).toFixed(1);
	
	for (var cl in Aion.classesData) {
		if (Aion.classesData[cl].ord == ar[1]+1) {
			let isValidType = Aion.classesData[cl].versionType.includes(Aion.versionsData[Calc.version].type);
			Calc.className = Aion.classesData[cl].fromVersion <= Calc.version && isValidType ? cl : 'priest';
		}
	}

	Calc.level = ar[2];
	Calc.race = ar[3] ? 'pc_dark' : 'pc_light';

	await setStigmasData(Calc.version);
	
	for (var i = 4; i < ar.length; i += 2) {
		for (var sn in stigmas[Calc.className]) {
			if (stigmas[Calc.className][sn].ord == ar[i]+1) {
				if (stigmas[Calc.className][sn].require) {
					while (Calc.slots.length < 6)
						Calc.slots.push("");
				}
				
				Calc.slots.push({
					level: ar[i+1]+1,
					name: sn
				});
			}
		}
	}
	Calc.autoReload = true;
}

Calc.reloadHash = async function() {
	if (!Calc.autoReload) {
		Calc.autoReload = true;
		return;
	}
	if (location.hash) {
		var a = location.hash.split('#');
		if (!a[0] && a.length > 0) {
			a.shift();
		}
		if (a[0])
			await Calc.loadHash(a[0]);
	}
}

async function setStigmaValues(version) {
	const getStigmaValues = await fetch(`../versions/${version}/vals.json`);

	if (getStigmaValues.status == 200) {
		stigmaValues = await getStigmaValues.json();
	}
}

async function setStigmasData(version) {
	const getStigmas = await fetch(`../versions/${version}/data.json`);

	if (getStigmas.status == 200) {
		stigmas = await getStigmas.json();
	}
}

async function setLang(langCode, version) {
	const getLang = await fetch(`../versions/${version}/lang_${langCode}.json`);

	if (getLang.status == 200) {
		lang = $.extend(lang, await getLang.json());
	} else {
		setLang('en', version);
	}
}

function setLinkWithHash() {
	var link = Calc.getHash();

	if (Calc.autoReload && location.hash.replace('#', '') != link) {
		Calc.autoReload = false;
		location.hash = link;
	}
	
	link = location.protocol +'//'+ location.hostname + (location.pathname ? location.pathname : '/') + (link ? '#'+ link : '');
	$("#stigma_link").attr('value', link);
}