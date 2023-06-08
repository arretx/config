#------------------------------------------------------------------------
# Compiled template generated by the Template Toolkit version 2.21
#------------------------------------------------------------------------

Template::Document->new({
    METADATA => {
        'name' => 'html/SqueezeJS/Base.js',
        'modtime' => '1249312473',
    },
    BLOCK => sub {
        my $context = shift || die "template sub called without context\n";
        my $stash   = $context->stash;
        my $output  = '';
        my $_tt_error;
        
        eval { BLOCK: {
    $output .=  "Ext.BLANK_IMAGE_URL = '/html/images/spacer.gif';\n\n// hack to fake IE8 into IE7 mode - let's consider them the same\nExt.isIE7 = Ext.isIE7 || Ext.isIE8;\n\nvar SqueezeJS = {\n	Strings : new Array(),\n	string : function(s){ return this.Strings[s]; },\n\n	contributorRoles : new Array('artist', 'composer', 'conductor', 'band', 'albumartist', 'trackartist'),\n\n	Controller : null\n};\n\n_init();\n\n// Initialize SqueezeJS.Controller\n// Look whether there's already a Controller running in a parent frame.\n// If one does exist, only create a proxy SqueezeJS.Controller hooking to it,\n// otherwise create new Controller.\nfunction _init() {\n	var p = (window == window.parent ? null : window.parent);\n	while (p) {\n\n		try {\n			if (p.SqueezeJS && p.SqueezeJS.Controller) {\n				// proxy to parent Controller\n				SqueezeJS.Controller = p.SqueezeJS.Controller;\n				return;\n			}\n		}\n		catch(e) {\n			break;\n		}\n\n		if (p == p.parent)\n			break;\n\n		p = p.parent;\n	}\n\n	// no parent Controller found - create our new, own instance\n	SqueezeJS.Controller = new Ext.util.Observable();\n	Ext.apply(SqueezeJS.Controller, {\n		observers : null,\n		showBrieflyCache : '',\n\n		init : function(o){\n			Ext.apply(this, o);\n\n			Ext.applyIf(this, {\n				'_server': ''\n			})\n\n			this._initPlayerStatus();\n\n			this.player = -1;\n			this.events = this.events || {};\n			this.addEvents({\n				'playerselected'   : true,\n				'serverstatus'     : true,\n				'playlistchange'   : true,\n				'buttonupdate'     : true,\n				'playerstatechange': true,\n				'playtimeupdate'   : true,\n				'showbriefly'      : true,\n				'scannerupdate'    : true\n			})\n\n			// return immediately if a window doesn't need default observers\n			if (this.noObserver)\n				return;\n\n			this.addObserver({\n				name : 'playerstatus',\n				timeout : 5000,\n				fn : function(self){\n\n					if (this.player && this.player != -1) {\n\n						this.playerRequest({\n							params: [ \"status\", \"-\", 1, \"tags:uB\" ],\n\n							// set timer\n							callback: function(){\n								self.timer.delay(self.timeout);\n							},\n\n							success: function(response){\n								if (response && response.responseText) {\n									response = Ext.util.JSON.decode(response.responseText);\n\n									// only continue if we got a result and player\n									if (response.result && response.result.player_connected) {\n										this.fireEvent('buttonupdate', response.result);\n\n										if (response.result.time)\n											this.playerStatus.playtime = parseInt(response.result.time);\n\n										if (response.result.duration)\n											this.playerStatus.duration = parseInt(response.result.duration);\n\n										// check whether we need to update our song info & playlist\n										if (this._needUpdate(response.result)){\n											this.getStatus();\n											self.timer.delay(self.timeout);\n										}\n\n										// display information if the player needs a firmware upgrade\n										if (response.player_needs_upgrade && !response.player_is_upgrading) {\n											this.fireEvent('playlistchange');\n										}\n									}\n\n									this.showBriefly(response.result);\n\n									if ( response.result && (this.playerStatus.rescan != response.result.rescan) ) {\n										this.playerStatus.rescan = response.result.rescan;\n										this.fireEvent('scannerupdate', response.result);\n\n										var updater = this.observers.get('serverstatus');\n										if (updater)\n											updater.timer.delay(750);\n									}\n								}\n							},\n\n							scope: this\n						})\n					}\n\n					else {\n						self.timer.delay(self.timeout);\n					}\n\n				}\n			});\n\n			this.addObserver({\n				name : 'serverstatus',\n				timeout : 10000,\n				fn : function(self){\n\n					this.request({\n						params: [ '', [ \"serverstatus\", 0, 999 ] ],\n\n						// set timer\n						callback: function(){\n							self.timer.delay(this.player && !this.playerStatus.rescan ? 30000 : self.timeout);\n						},\n\n						success: function(response){\n							this.selectPlayer(this._parseCurrentPlayerInfo(response));\n\n							response = Ext.util.JSON.decode(response.responseText);\n							if (response && response.result) {\n								this.fireEvent('serverstatus', response.result);\n\n								if (response.result.rescan || this.playerStatus.rescan || this.playerStatus.rescan != response.result.rescan) {\n									this.playerStatus.rescan = response.result.rescan;\n									this.fireEvent('scannerupdate', response.result);\n								}\n\n								if (response.result.lastscanfailed) {\n									this.showBriefly(response.result.lastscanfailed);\n								}\n							}\n						},\n\n						scope: this\n					})\n\n				}\n			});\n\n			this.addObserver({\n				name : 'playtimeticker',\n				timeout : 950,\n				fn : function(self){\n					if (this.playerStatus.mode == 'play' && this.playerStatus.duration > 0\n						&& this.playerStatus.playtime >= this.playerStatus.duration-1\n						&& this.playerStatus.playtime <= this.playerStatus.duration + 2)\n						this.getStatus();\n\n					// force 0 for current time when stopped\n					if (this.playerStatus.mode == 'stop')\n						this.playerStatus.playtime = 0;\n\n					this.fireEvent('playtimeupdate', {\n						current: this.playerStatus.playtime,\n						duration: this.playerStatus.duration,\n						remaining: this.playerStatus.duration ? parseInt(this.playerStatus.playtime) - this.playerStatus.duration : 0\n					})\n\n					// only increment interim value if playing and not scanning (FWD/RWD)\n					if (this.playerStatus.mode == 'play' && this.playerStatus.rate == 1)\n						this.playerStatus.playtime++;\n\n					self.timer.delay(self.timeout);\n				}\n			});\n\n			this.on({\n				playerselected: {\n					fn: function(playerobj){\n						if (!(playerobj && playerobj.playerid))\n							playerobj = {\n								playerid : ''\n							}\n\n						// remember the selected player\n						if (playerobj.playerid)\n							SqueezeJS.setCookie('Squeezebox-player', playerobj.playerid);\n\n						this.player = playerobj.playerid;\n\n						// legacy global variables for compatibility\n						playerid = playerobj.playerid;\n						player = encodeURIComponent(playerobj.playerid);\n\n						this.getStatus();\n					}\n				}\n			});\n		},\n\n		_initPlayerStatus : function(){\n			this.playerStatus = {\n				power: null,\n				mode: null,\n				rate: 0,\n				current_title: null,\n				title: null,\n				track: null,\n				playlist_tracks: 0,\n				index: null,\n				duration: null,\n				playtime: 0,\n				timestamp: null,\n				dontUpdate: false,\n				player: null,\n				rescan: 0,\n				canSeek: false\n			}\n			this.playerStatus['playlist repeat'] = 0;\n		},\n\n		addObserver : function(config){\n			if (!this.observers)\n				this.observers = new Ext.util.MixedCollection();\n\n			config.timer = new Ext.util.DelayedTask(config.fn, this, [ config ]);\n			config.timer.delay(0);\n			this.observers.add(config.name, config);\n		},\n\n		updateObserver : function(name, config) {\n			var o = this.observers.get(name);\n\n			if (o) {\n				Ext.apply(o, config);\n			}\n		},\n\n		updateAll : function(){\n			if (this.observers){\n				this.playerStatus.power = null;\n				this.observers.each(function(observer){\n					observer.timer.delay(0);\n				});\n			}\n		},\n\n		// different kind of requests to the server\n		request : function(config){\n			// shortcut for .request('http://...') calls\n			if (typeof config == 'string')\n				config = {\n					url: config,\n					method: 'GET'\n				};\n\n			if (config.showBriefly)\n				this.showBriefly(config.showBriefly);\n\n			Ext.Ajax.request({\n				url: this.getBaseUrl() + (config.url || '/jsonrpc.js'),\n				method: config.method ? config.method : 'POST',\n				params: config.url ? null : Ext.util.JSON.encode({\n					id: 1,\n					method: \"slim.request\",\n					params: config.params\n				}),\n				timeout: config.timeout || 5000,\n				callback: config.callback,\n				success: config.success,\n				failure: config.failure,\n				scope: config.scope || this\n			});\n		},\n\n		playerRequest : function(config){\n			if (this.getPlayer()) {\n				config.params = [\n					this.player,\n					config.params\n				];\n				this.request(config);\n			}\n		},\n\n		togglePause : function(dontUpdate) {\n			if (this.isPaused()) {\n				this.playerControl(['play'], dontUpdate);\n			} else {\n				this.playerControl(['pause'], dontUpdate);\n			}\n		},\n\n		// custom playerRequest which requires a controller update\n		// ussually used in player controls\n		playerControl : function(action, dontUpdate){\n			this.playerRequest({\n				success: function(response){\n					this.playerStatus.dontUpdate = dontUpdate;\n					this.getStatus();\n\n					if (response && response.responseText) {\n						response = Ext.util.JSON.decode(response.responseText);\n						if (response && response.result && response.result.text) {\n							this.showBriefly(response.result.text);\n						}\n					}\n				},\n				params: action\n			});\n		},\n\n		urlRequest : function(myUrl, updateStatus, showBriefly) {\n			this.request({\n				url: myUrl,\n				method: 'GET',\n				callback: function(){\n					// try updating the player control in this or the parent document\n					if (updateStatus)\n						this.getStatus();\n				},\n				showBriefly: showBriefly\n			});\n		},\n\n		playlistRequest : function(param, reload) {\n			this.urlRequest('/status_header.html?' + param + 'ajaxRequest=1&force=1', true);\n			if (reload)\n				this.getStatus();\n		},\n\n		getStatus : function(){\n			if (this.player) {\n				this.playerRequest({\n					params: [ \"status\", \"-\", 1, \"tags:cgAABbehldiqtyrSSuoKLNJ\" ],\n					failure: this._updateStatus,\n					success: this._updateStatus,\n					scope: this\n				});\n			}\n		},\n\n		_updateStatus : function(response) {\n			if (!(response && response.responseText))\n				return;\n\n			response = Ext.util.JSON.decode(response.responseText);\n\n			// only continue if we got a result and player\n			if (!(response.result && response.result.player_connected))\n				return;\n\n			response = response.result;\n\n			var playlistchange = this._needUpdate(response) && Ext.get('playList');\n\n			this.playerStatus = {\n				// if power is undefined, set it to on for http clients\n				power:     (response.power == null) || response.power,\n				mode:      response.mode,\n				rate:      response.rate,\n				current_title: response.current_title,\n				title:     response.playlist_tracks > 0 ? response.playlist_loop[0].title : '',\n				track:     response.playlist_tracks > 0 ? response.playlist_loop[0].url : '',\n				playlist_tracks: response.playlist_tracks,\n				index:     response.playlist_cur_index,\n				duration:  parseInt(response.duration) || 0,\n				canSeek:   response.can_seek ? true : false,\n				playtime:  parseInt(response.time),\n				repeat:    parseInt(response['playlist repeat']) || 0,\n				timestamp: response.playlist_timestamp\n			};\n\n			if ((response.power != null) && !response.power) {\n				this.playerStatus.power = 0;\n			}\n\n			this.fireEvent('playerstatechange', response);\n			if (playlistchange)\n				this.fireEvent('playlistchange', response);\n\n		},\n\n		_needUpdate : function(result) {\n			// the dontUpdate flag allows us to have the timestamp check ignored for one action\n			// used to prevent updates during d'n'd\n			if (this.playerStatus.dontUpdate) {\n				this.playerStatus.timestamp = result.playlist_timestamp;\n				this.playerStatus.dontUpdate = false;\n			}\n\n			var needUpdate = (result.power != null && (result.power != this.playerStatus.power));\n			needUpdate |= (result.mode != null && result.mode != this.playerStatus.mode);                                   // play/paus mode\n			needUpdate |= (result.playlist_timestamp != null && result.playlist_timestamp > this.playerStatus.timestamp);   // playlist: time of last change\n			needUpdate |= (result.playlist_cur_index != null && result.playlist_cur_index != this.playerStatus.index);      // the currently playing song's position in the playlist\n			needUpdate |= (result.current_title != null && result.current_title != this.playerStatus.current_title);        // title (eg. radio stream)\n			needUpdate |= (result.playlist_tracks > 0 && result.playlist_loop[0].title != this.playerStatus.title);         // songtitle?\n			needUpdate |= (result.playlist_tracks > 0 && result.playlist_loop[0].url != this.playerStatus.track);           // track url\n			needUpdate |= (result.playlist_tracks < 1 && this.playerStatus.track);                                          // there's a player, but no song in the playlist\n			needUpdate |= (result.playlist_tracks > 0 && !this.playerStatus.track);                                         // track in playlist changed\n			needUpdate |= (result.rate != null && result.rate != this.playerStatus.rate);                                   // song is scanning (ffwd/frwd)\n			needUpdate |= (result['playlist repeat'] != null && result['playlist repeat'] != this.playerStatus.repeat);\n			needUpdate |= (result.playlist_tracks != this.playerStatus.playlist_tracks);\n\n			return needUpdate;\n		},\n\n		showBriefly : function(result){\n			if (typeof result == 'string')\n				result = { showBriefly: [ result ] };\n			else if (typeof result == 'array')\n				result = { showBriefly: result };\n\n			if (result && result.showBriefly) {\n				var text = '';\n				for (var x = 0; x < result.showBriefly.length; x++) {\n					if (result.showBriefly[x] && result.showBriefly[x].match(/^[\\w\\s\\.;,:()\\[\\]%]/))\n						text += result.showBriefly[x] + ' ';\n				}\n\n				if (text && this.showBrieflyCache != text) {\n					this.showBrieflyCache = text;\n					this.fireEvent('showbriefly', text);\n				}\n			}\n		},\n\n		setVolume : function(amount, d){\n			if (d)\n				amount = d + (amount * 2);\n			else\n				amount *= 10;\n\n			this.playerControl(['mixer', 'volume', amount]);\n		},\n\n		selectPlayer : function(playerobj){\n			if (typeof playerobj == 'object') {\n				this._firePlayerSelected(playerobj);\n			}\n			else {\n				this._initPlayerStatus();\n				this.request({\n					params: [ '', [ \"serverstatus\", 0, 999 ] ],\n\n					success: function(response){\n						this._firePlayerSelected(this._parseCurrentPlayerInfo(response, playerobj));\n					},\n\n					scope: this\n				});\n			}\n		},\n\n		_firePlayerSelected : function(playerobj){\n			if (playerobj && playerobj.playerid) {\n				if ((playerobj.playerid != this.player && encodeURIComponent(playerobj.playerid) != this.player)\n					|| this.player == -1) {\n\n					var oldPlayer = this.player != -1 ? {\n						playerid: this.player\n					} : null;\n\n					this._initPlayerStatus();\n					this.fireEvent('playerselected', playerobj, oldPlayer);\n				}\n			}\n			else {\n				this._initPlayerStatus();\n				this.player = null;\n			}\n		},\n\n		_parseCurrentPlayerInfo : function(response, activeplayer) {\n			response = Ext.util.JSON.decode(response.responseText);\n			if (response && response.result)\n				response = response.result;\n\n			activeplayer = activeplayer || SqueezeJS.getCookie('Squeezebox-player');\n			return this.parseCurrentPlayerInfo(response, activeplayer);\n		},\n\n		parseCurrentPlayerInfo: function(result, activeplayer) {\n			if (result && result.players_loop) {\n				var players_loop = result.players_loop;\n				for (var x=0; x < players_loop.length; x++) {\n					if (players_loop[x].playerid == activeplayer || encodeURIComponent(players_loop[x].playerid) == activeplayer)\n						return players_loop[x];\n				}\n			}\n		},\n\n		getPlayer : function() {\n			if (SqueezeJS.Controller.player == null || SqueezeJS.Controller.player == -1)\n				return;\n\n			SqueezeJS.Controller.player = String(SqueezeJS.Controller.player).replace(/%3A/gi, ':');\n			return SqueezeJS.Controller.player;\n		},\n\n		isPaused : function() {\n			if (this.player && this.playerStatus.mode == 'pause') {\n				return true;\n			}\n			return false;\n		},\n\n		isPlaying : function() {\n			if (this.player && this.playerStatus.mode == 'play') {\n				return true;\n			}\n			return false;\n		},\n\n		isStopped : function() {\n			if (this.player && this.playerStatus.mode == 'stop') {\n				return true;\n			}\n			return false;\n		},\n\n		hasPlaylistTracks: function() {\n			if (!this.player || !this.playerStatus)\n				return;\n\n			return parseInt(this.playerStatus.playlist_tracks) > 0 ? true : false;\n		},\n\n		getBaseUrl: function() {\n			return this._server || '';\n		},\n\n		setBaseUrl: function(server) {\n			if (typeof server == 'object' && server.ip && server.port) {\n				this._server = 'http://' + server.ip + ':' + server.port;\n			}\n			else if (typeof server == 'string') {\n				this._server = server;\n			}\n			else {\n				this._server = '';\n			}\n		}\n	});\n}\n\nSqueezeJS.getPlayer = SqueezeJS.Controller.getPlayer;\n\nExt.apply(SqueezeJS, {\n	loadStrings : function(strings) {\n		var newStrings = '';\n		for (var x = 0; x < strings.length; x++) {\n			if (!this.Strings[strings[x].toLowerCase()] > '') {\n				newStrings += strings[x] + ',';\n			}\n		}\n\n		if (newStrings > '') {\n			newStrings = newStrings.replace(/,\$/, '');\n			this.Controller.request({\n				params: [ '', [ 'getstring', newStrings ] ],\n				scope: this,\n\n				success: function(response) {\n					if (response && response.responseText) {\n						response = Ext.util.JSON.decode(response.responseText);\n						for (x in response.result) {\n							this.Strings[x.toLowerCase()] = response.result[x];\n						}\n					}\n				}\n			})\n		}\n	},\n\n	loadString : function(string) {\n		this.loadStrings([string]);\n	}\n});\n\nSqueezeJS.SonginfoParser = {\n	tpl : {\n		raw : {\n			title : new Ext.Template('{title}'),\n			album : new Ext.Template('{album}'),\n			contributor : new Ext.Template('{contributor}'),\n			year : new Ext.Template('{year}'),\n			coverart : new Ext.Template('<img src=\"{src}\" srcset=\"{srcset}\" {width} {height}>')\n		},\n		linked : {\n			title : new Ext.Template('<a href=\"' + webroot +'{link}?player={player}&amp;item={id}\" target=\"browser\">{title}</a>'),\n			album : new Ext.Template('<a href=\"' + webroot + 'clixmlbrowser/clicmd=browselibrary+items&amp;mode=albums&amp;linktitle={title}&amp;album_id={id}&amp;player={player}/index.html?index=0\" target=\"browser\">{album}</a>'),\n			contributor : new Ext.Template('<a href=\"' + webroot + 'clixmlbrowser/clicmd=browselibrary+items&amp;mode=albums&amp;linktitle={title}&amp;artist_id={id}&amp;player={player}/\" target=\"browser\">{contributor}</a>'),\n			year : new Ext.Template('<a href=\"' + webroot + 'clixmlbrowser/clicmd=browselibrary+items&amp;mode=albums&amp;linktitle={title}&amp;year={year}&amp;player={player}/\" target=\"browser\">{year}</a>'),\n			coverart : new Ext.Template('<a href=\"' + webroot + '{link}?player={player}&amp;item={id}\" target=\"browser\"><img src=\"{src}\" srcset=\"{srcset}\" {width} {height}></a>')\n		}\n	},\n\n	title : function(result, noLink, noTrackNo){\n		var title;\n		var link;\n		var id;\n\n		if (result.playlist_tracks > 0) {\n			if (noTrackNo)\n				title = result.playlist_loop[0].title;\n\n			else\n				title = (result.playlist_loop[0].disc && result.playlist_loop[0].disccount > 1 ? result.playlist_loop[0].disc + '-' : '')\n						+ (result.playlist_loop[0].tracknum ? result.playlist_loop[0].tracknum + \". \" : '')\n						+ result.playlist_loop[0].title;\n\n			link = result.playlist_loop[0].info_link || 'songinfo.html';\n			id = result.playlist_loop[0].id;\n		}\n\n		return this.tpl[(noLink ? 'raw' : 'linked')].title.apply({\n			link: link,\n			id: id,\n			title: title,\n			player: SqueezeJS.getPlayer()\n		});\n	},\n\n	album : function(result, noLink, noRemoteTitle){\n		var album = '';\n		var id = null;\n\n		if (result.playlist_tracks > 0) {\n			if (result.playlist_loop[0].album) {\n				if (result.playlist_loop[0].album_id)\n					id = result.playlist_loop[0].album_id;\n\n				album = result.playlist_loop[0].album;\n			}\n\n			else if (result.playlist_loop[0].remote_title && !noRemoteTitle)\n				album = result.playlist_loop[0].remote_title;\n\n			else if (result.current_title)\n				album = result.current_title;\n		}\n\n		return this.tpl[((noLink || id == null) ? 'raw' : 'linked')].album.apply({\n			id: id,\n			album: album,\n			title: encodeURIComponent(SqueezeJS.string(\"album\") + ' (' + album + ')'),\n			player: SqueezeJS.getPlayer()\n		});\n	},\n\n	contributors : function(result, noLink){\n		var currentContributors = new Array();\n		var contributorRoles = SqueezeJS.contributorRoles;\n\n		var contributorList = '';\n		if (result.playlist_tracks > 0) {\n			for (var x = 0; x < contributorRoles.length; x++) {\n				if (result.playlist_loop[0][contributorRoles[x]]) {\n					var ids = result.playlist_loop[0][contributorRoles[x] + '_ids'] ? result.playlist_loop[0][contributorRoles[x] + '_ids'].split(',') : new Array();\n\n					// Don't split the artist name if we only have a single id. Or Earth would no longer play with Wind & Fire.\n					var contributors = ids.length != 1\n						? result.playlist_loop[0][contributorRoles[x]].split(/,(?!\\s)/)\n						: new Array(result.playlist_loop[0][contributorRoles[x]]);\n\n					for (var i = 0; i < contributors.length; i++) {\n						// only add to the list if it's not already in there\n						if (!currentContributors[contributors[i]]) {\n							currentContributors[contributors[i]] = 1;\n\n							if (contributorList)\n								contributorList += ', ';\n\n							contributorList += this.tpl[((ids[i] && !noLink) ? 'linked' : 'raw')].contributor.apply({\n								id: (ids[i] || null),\n								contributor: contributors[i],\n								title: encodeURIComponent(SqueezeJS.string(\"artist\") + ' (' + contributors[i] + ')'),\n								player: SqueezeJS.getPlayer()\n							});\n						}\n					}\n				}\n			}\n		}\n\n		return contributorList;\n	},\n\n	year : function(result, noLink){\n		var year;\n\n		if (result.playlist_tracks > 0 && parseInt(result.playlist_loop[0].year) > 0)\n				year = parseInt(result.playlist_loop[0].year);\n\n		return this.tpl[(noLink || !year ? 'raw' : 'linked')].year.apply({\n			year: year,\n			title: encodeURIComponent(SqueezeJS.string(\"year\") + ' (' + year + ')'),\n			player: SqueezeJS.getPlayer()\n		});\n	},\n\n	bitrate : function(result){\n		var bitrate = '';\n\n		if (result.playlist_tracks > 0 && result.playlist_loop[0].bitrate) {\n			bitrate = result.playlist_loop[0].bitrate\n				+ (result.playlist_loop[0].type\n					? ', ' + result.playlist_loop[0].type\n					: ''\n				);\n		}\n\n		return bitrate;\n	},\n\n	coverart : function(result, noLink, width){\n		var coverart = this.defaultCoverart(0, width);\n		var id = -1;\n		var link;\n\n		if (result.playlist_tracks > 0) {\n			coverart = this.coverartUrl(result, width);\n\n			if (result.playlist_loop[0].id) {\n				id = result.playlist_loop[0].id;\n				link = result.playlist_loop[0].info_link || 'songinfo.html';\n			}\n		}\n\n		if (coverart.search(/^http/) == -1 && coverart.search(/^\\//) == -1)\n			coverart = webroot + coverart;\n\n		return this.tpl[((noLink || id == null || id < 0) ? 'raw' : 'linked')].coverart.apply({\n			id: id,\n			src: coverart,\n			srcset: coverart.replace(width + 'x' + width, width*2 +'x' + width*2) + ' 2x',\n			width: width ? 'width=\"' + width + '\"' : '',\n			height: width ? 'height=\"' + width + '\"' : '',\n			link: link\n		});\n	},\n\n	coverartUrl : function(result, width){\n		var coverart = this.defaultCoverart(0, width);\n		var link;\n		if (result.playlist_tracks > 0) {\n			if (result.playlist_loop[0].artwork_url) {\n				coverart = result.playlist_loop[0].artwork_url;\n\n				var publicURL = (coverart.search(/^http:/) != -1);\n\n				if (publicURL) {\n					var parts = coverart.match(/^http:\\/\\/(.+)/);\n\n					// don't use image proxy when dealing with private IP addresses\n					if (parts && parts[1].match(/^\\d+/) && (\n						parts[1].match(/^192\\.168\\./) || parts[1].match(/^172\\.(?:1[6-9]|2\\d|3[01])\\./) || parts[1].match(/^10\\./)\n					)) {\n						publicURL = false;\n					}\n				}\n\n				// SqueezeJS.externalImageProxy must be a template accepting url and size values\n				if (coverart && width && SqueezeJS.externalImageProxy && publicURL) {\n					coverart = SqueezeJS.externalImageProxy.apply({\n						url: encodeURIComponent(coverart),\n						size: width\n					});\n				}\n\n				// some internal logos come without resizing parameters - add them here if size is defined\n				else if (coverart && width && !publicURL) {\n					coverart = coverart.replace(/(icon|image|cover)(\\.\\w+)\$/, \"\$1_\" + width + 'x' + width + \"_p\$2\");\n				}\n			}\n			else {\n				coverart = this.defaultCoverart(result.playlist_loop[0].coverid || result.playlist_loop[0].artwork_track_id || result.playlist_loop[0].id, width);\n			}\n		}\n\n		if (coverart.match(/^imageproxy/))\n			coverart = '/' + coverart;\n\n		return coverart;\n	},\n\n	defaultCoverart : function(coverid, width) {\n		return SqueezeJS.Controller.getBaseUrl() + '/music/' + (coverid || 0) + '/cover' + (width ? '_' + width + 'x' + width + '_p.png' : '');\n	}\n};\n\nSqueezeJS.Utils = {\n	replacePlayerIDinUrl : function(url, id){\n		if (!id)\n			return url;\n\n		if (typeof url == 'object' && url.search != null) {\n			var args = Ext.urlDecode(url.search.replace(/^\\?/, ''));\n\n			args.player = id;\n\n			if (args.playerid)\n				args.playerid = id;\n\n			return url.pathname + '?' + Ext.urlEncode(args) + url.hash;\n		}\n\n		var rExp = /(=(\\w\\w(:|%3A)){5}(\\w\\w))|(=(\\d{1,3}\\.){3}\\d{1,3})/gi;\n\n		if (url.search(/player=/) && ! rExp.exec(url))\n			url = url.replace(/player=/ig, '');\n\n		// reset the regex so it starts matching at the beginning of the url\n		rExp.lastIndex = 0;\n\n		return (rExp.exec(url) ? url.replace(rExp, '=' + id) : url + '&player=' + id);\n	},\n\n	formatTime : function(seconds){\n		var remaining;\n\n		if (seconds < 0) {\n			remaining = true;\n			seconds = Math.abs(seconds);\n		}\n\n		var hours = Math.floor(seconds / 3600);\n		var minutes = Math.floor((seconds - hours*3600) / 60);\n		seconds = Math.floor(seconds % 60);\n\n		var formattedTime = (hours ? hours + ':' : '');\n		formattedTime += (minutes ? (minutes < 10 && hours ? '0' : '') + minutes : '0') + ':';\n		formattedTime += (seconds ? (seconds < 10 ? '0' : '') + seconds : '00');\n		return (remaining ? '-' : '') + formattedTime;\n	},\n\n	toggleFavorite : function(el, url, title) {\n		var el = Ext.get(el);\n		if (el) {\n			if (SqueezeJS.UI)\n				SqueezeJS.UI.setProgressCursor(250);\n\n			el.getUpdateManager().showLoadIndicator = false;\n			el.load({\n				url: 'plugins/Favorites/favcontrol.html?url=' + url + '&title=' + title + '&player=' + player,\n				method: 'GET'\n			});\n		}\n	},\n\n	parseURI: function(uri) {\n		var	parsed = uri.match(/^(?:(?![^:\@]+:[^:\@\\/]*\@)([^:\\/?#.]+):)?(?:\\/\\/)?((?:(([^:\@]*)(?::([^:\@]*))?)?\@)?([^:\\/?#]*)(?::(\\d*))?)(((\\/(?:[^?#](?![^?#\\/]*\\.[^?#\\/.]+(?:[?#]|\$)))*\\/?)?([^?#\\/]*))(?:\\?([^#]*))?(?:#(.*))?)/);\n		var keys   = [\n			\"source\",\n			\"protocol\",\n			\"authority\",\n			\"userInfo\",\n			\"user\",\n			\"password\",\n			\"host\",\n			\"port\",\n			\"relative\",\n			\"path\",\n			\"directory\",\n			\"file\",\n			\"query\",\n			\"anchor\"\n		];\n		var parts = {};\n\n		for (var i = keys.length; i--;) {\n			parts[keys[i]] = parsed[i] || '';\n		}\n\n		parts.queryKey = {};\n\n		parts.query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function (\$0, \$1, \$2) {\n			if (\$1) parts.queryKey[\$1] = \$2;\n		});\n\n		return parts;\n	}\n};\n\n// our own cookie manager doesn't prepend 'ys-' to any cookie\nif (Ext.state.CookieProvider) {\n	SqueezeJS.CookieManager = new Ext.state.CookieProvider({\n		expires : new Date(new Date().getTime() + 1000*60*60*24*365),\n\n		readCookies : function(){\n			var cookies = {};\n			var c = document.cookie + \";\";\n			var re = /\\s?(.*?)=(.*?);/g;\n			var matches;\n			while((matches = re.exec(c)) != null){\n				var name = matches[1];\n				var value = matches[2];\n				if(name){\n					cookies[name] = value;\n				}\n			}\n			return cookies;\n		},\n\n		setCookie : function(name, value){\n			document.cookie = name + \"=\" + value +\n			((this.expires == null) ? \"\" : (\"; expires=\" + this.expires.toGMTString())) +\n			((this.path == null) ? \"\" : (\"; path=\" + this.path)) +\n			((this.domain == null) ? \"\" : (\"; domain=\" + this.domain)) +\n			((this.secure == true) ? \"; secure\" : \"\");\n		},\n\n		clearCookie : function(name){\n			document.cookie = name + \"=null; expires=Thu, 01-Jan-70 00:00:01 GMT\" +\n				((this.path == null) ? \"\" : (\"; path=\" + this.path)) +\n				((this.domain == null) ? \"\" : (\"; domain=\" + this.domain)) +\n				((this.secure == true) ? \"; secure\" : \"\");\n		}\n	});\n}\n\nSqueezeJS.cookieExpiry = new Date(new Date().getTime() + 1000*60*60*24*365);\n\nSqueezeJS.setCookie = function(name, value, expiry) {\n	Ext.util.Cookies.set(name, value, expiry != null ? expiry : SqueezeJS.cookieExpiry);\n};\n\nSqueezeJS.getCookie = function(name) {\n	return Ext.util.Cookies.get(name);\n};\n\nSqueezeJS.clearCookie = function(name) {\n	this.setCookie(name, null);\n	return Ext.util.Cookies.clear(name);\n};\n\nSqueezeJS.cookiesEnabled = function(){\n	Ext.util.Cookies.set('_SqueezeJS-cookietest', true);\n\n	if (Ext.util.Cookies.get('_SqueezeJS-cookietest')) {\n		Ext.util.Cookies.clear('_SqueezeJS-cookietest');\n		return true;\n	}\n\n	return false;\n};\n\n\n// XXX some legacy stuff - should eventually go away\n// there to be compatible across different skins\n\nfunction ajaxUpdate(url, params, callback) {\n	var el = Ext.get('mainbody');\n\n	if (el) {\n		var um = el.getUpdateManager();\n\n		if (um)\n			um.loadScripts = true;\n\n		if (!callback && SqueezeJS.UI)\n			callback = SqueezeJS.UI.ScrollPanel.init;\n\n		el.load(url, params + '&ajaxUpdate=1&player=' + player, callback);\n	}\n}\n\nfunction ajaxRequest(url, params, callback) {\n	if (typeof params == 'object')\n		params = Ext.util.JSON.encode(params);\n\n	Ext.Ajax.request({\n		method: 'POST',\n		url: url,\n		params: params,\n		timeout: 5000,\n		disableCaching: true,\n		callback: callback || function(){}\n	});\n}\n\n// update the status if the Player is available\nfunction refreshStatus() {\n	try { SqueezeJS.Controller.getStatus();	}\n	catch(e) {\n		try { parent.SqueezeJS.Controller.getStatus(); }\n		catch(e) {}\n	}\n}\n\nfunction setCookie(name, value) {\n	SqueezeJS.setCookie(name, value);\n}\n\nfunction resize(src, width) {\n	if (!width) {\n		// special case for IE (argh)\n		if (document.all) //if IE 4+\n			width = document.body.clientWidth*0.5;\n\n		else if (document.getElementById) //else if NS6+\n			width = window.innerWidth*0.5;\n\n		width = Math.min(150, parseInt(width));\n	}\n\n	if (src.height > width && src.height > src.width)\n		src.height = width;\n	else if (src.width > width || !src.width)\n		src.width = width;\n}\n";
        } };
        if ($@) {
            $_tt_error = $context->catch($@, \$output);
            die $_tt_error unless $_tt_error->type eq 'return';
        }
    
        return $output;
    },
    DEFBLOCKS => {

    },
});
