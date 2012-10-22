/* See license.txt for terms of usage */

define([
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/lib/events",
    "firebug/lib/css",
    "firebug/lib/dom",
    "firebug/chrome/window",
    "firebug/cookies/cookieUtils"
],
function(Obj, FBTrace, Locale, Domplate, Events, Css, Dom, Win, CookieUtils) {

// ********************************************************************************************* //
// Custom Panel Implementation

var panelName = "nitratools";

Firebug.MyPanel = function MyPanel() {};
Firebug.MyPanel.prototype = Obj.extend(Firebug.Panel,
{
    name: panelName
    ,title: "Nitra Tools"

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Initialization

    ,initialize: function() {
        Firebug.Panel.initialize.apply(this, arguments);

    	this.model = new Firebug.MyPanelModel();

        if (FBTrace.DBG_NITRATOOLS)
            FBTrace.sysout("NitraTools; MyPanel.initialize");

       // TODO: Panel initialization (there is one panel instance per browser tab)

        this.refresh();
    },

    destroy: function(state)
    {
        if (FBTrace.DBG_NITRATOOLS)
            FBTrace.sysout("NitraTools; MyPanel.destroy");

        Firebug.Panel.destroy.apply(this, arguments);
    },

    show: function(state)
    {
        Firebug.Panel.show.apply(this, arguments);

        if (FBTrace.DBG_NITRATOOLS)
            FBTrace.sysout("NitraTools; MyPanel.show");
    },

    refresh: function()
    {
        // Render panel content. The HTML result of the template corresponds to: 
        //this.panelNode.innerHTML = "<span>" + Locale.$STR("nitratools.panel.label") + "</span>";
        this.MyTemplate.render(this.panelNode, this.model);

        // TODO: Render panel content
    }
});

// ********************************************************************************************* //
// Panel UI (Domplate)

// Register locales before the following template definition.
Firebug.registerStringBundle("chrome://nitratools/locale/nitratools.properties");

/**
 * Domplate template used to render panel's content. Note that the template uses
 * localized strings and so, Firebug.registerStringBundle for the appropriate
 * locale file must be already executed at this moment.
 */


with (Domplate) {
	var sectionTitles = [
         Locale.$STR("nitratools.panel.section.contextManager.title")
         ,Locale.$STR("nitratools.panel.section.metaTags.title")
//         ,Locale.$STR("nitratools.panel.section.eventHandlers.title")
//         ,Locale.$STR("nitratools.panel.section.eventDescriptors.title")
//         ,Locale.$STR("nitratools.panel.section.dataDescriptors.title")
//         ,Locale.$STR("nitratools.panel.section.widgets.title")
//         ,Locale.$STR("nitratools.panel.section.contentCells.title")
     ]
	,OPEN_CLASS = "open";
	
	Firebug.MyPanel.prototype.MyTemplate = domplate({
	    tag:
	        DIV({class: "section-list"},
        	    SECTION({onclick: "$onClickRow"}, 
        	    	H1("ContextManager"),
        	    	DETAILS(
        	    		TAG("$mapView", {map: "$model.context"})
        	    	)
        	    ),
        	    SECTION({onclick: "$onClickRow"}, 
        	    	H1("Meta Data"),
        	    	DETAILS(
        	    		TAG("$mapView", {map: "$model.metaTags"})
        	    	)
        	    ),
        	    SECTION({onclick: "$onClickRow"}, 
        	    	H1("Widgets used"),
        	    	DETAILS(
        	    		TAG("$mapView", {map: "$model.widgets"})
        	    	)
        	    ),
        	    SECTION({onclick: "$onClickRow"}, 
        	    	H1("Event Handlers"),
        	    	DETAILS(
        	    		TAG("$mapView", {map: "$model.eventHandlers"})
        	    	)
        	    ),
	    	    SECTION({onclick: "$onClickRow"}, 
	        	   	H1("iPerceptions"),
	        	    DETAILS(
	        	    	TAG("$mapView", {map: "$model.iPerceptions"})
	        	    )
	        	),
	    	    SECTION({onclick: "$onClickRow"}, 
	        	   	H1("Cookies"),
	        	    DETAILS(
	        	    	TAG("$mapView", {map: "$model.cookies"})
	        	    )
	        	)
		    )
	    ,mapView:
	    	TABLE(
	    		TBODY( 
    				FOR("member", "$map",
				        TAG("$mapRowView", {member: "$member"})
				    )
				)
		    )
		,mapRowView:
			TR(
				TD({class: "map-key"}, "$member.key"),
				TD({class: "map-value"}, "$member.value")
			)
		,mapRowValue: function(value, row) {
			if (!rep)
				rep = Firebug.getRep(value);
	        return rep.tag.append({object: value}, row);
		}
	    ,render: function(parentNode, model) {
	        this.tag.replace({sections: sectionTitles, model: model}, parentNode);
	    }
	    ,onClickRow: function(event) {
	        if (Events.isLeftClick(event, false))
	        {
	            var row = event.target;
	            if (row)
	            {
	                this.toggleRow(row);
	                Events.cancelEvent(event);
	            }
	        }
	    }
	    ,toggleRow: function(row) {
	        var opened = Css.hasClass(row, OPEN_CLASS);
	        Css.toggleClass(row, OPEN_CLASS);
	    }




	});
}

(function() {
	Firebug.MyPanelModel = function(){
		this.initialize();
	};

	Firebug.MyPanelModel.prototype = {
		context: []
		,metaTags: []
		,widgets: []
		,eventHandlers: []
		,iPerceptions: []
		,cookies: []
		,initialize: function() {
	        FBTrace.sysout("NitraTools; initializing model data", this.context);		
			this.context = [];
			this.createContextMap(getGlobalJsObject("ContextManager"), "");
			sortMap(this.context);
			
			this.metaTags = [];
			this.createMetaTagMap();
			
			this.widgets = [];
			this.createWidgetMap();
			
			this.eventHandlers = [];
			this.createEventHandlerMap();
			
			this.iPerceptions = [];
			this.createIPerceptionsMap();
			
			this.cookies = [];
			this.createCookiesMap();
			
	        FBTrace.sysout("NitraTools; model data", this.context);		
		}
		,createContextMap: function(context, root) {
			for (var k in context) {
				if (typeof context[k] !== "function" && k !== "getterMap") {
//					var dataObj = {key: root+k, value: context[k], isSystemValue: false};
					switch (typeOf(context[k])) {
					case "object":
						this.createContextMap(context[k], root + k + ".");
						continue;
//					case "null":
//					case "undefined":
//						dataObj.isSystemValue = true;
					default:
						this.context.push({key: root+k, value: context[k]});
					}
				}
			}
		}
		,createMetaTagMap: function() {
			var els = getElementsByTag('meta');
			for (var i=0, iMax=els.length; i<iMax; i++) {
				if (els[i].name) {
					this.metaTags.push({
						key: els[i].name
						,value: els[i].content
					});
				}
			}
			
			var title = getElementsByTag('title')[0];
			this.metaTags.push({
				key: "title"
				,value: title.text
			});
			sortMap(this.metaTags);
		}
		,createWidgetMap: function() {
			var els = getElementsByClass('CobaltEditableWidget');
			for (var i=0, iMax=els.length; i<iMax; i++) {
				this.widgets.push({
					key: els[i].id
					,value: els[i]
				});
			}
			sortMap(this.widgets);
		}
		,createEventHandlerMap: function() {
			var handlers = getGlobalJsObject("EventManager").handlerArray;
			for (var i=0, iMax=handlers.length; i<iMax; i++) {
				this.eventHandlers.push({
					key: [handlers[i].source, handlers[i].eventName].join(":")
					,value: handlers[i].handler
				});
			}
			sortMap(this.eventHandlers);
		}
		,createIPerceptionsMap: function() {
			var data = getGlobalJsObject("iPerceptions");
			for (var k in data) {
				this.iPerceptions.push({
					key: k
					,value: data[k]
				});
			}
			sortMap(this.iPerceptions);
		}
		,createCookiesMap: function() {
			var data = getCookies();
	        FBTrace.sysout("NitraTools; cookie object", data);
	        for (var i=0, iMax=data.length; i<iMax; i++) {
	        	// *sigh* The XML in LSLP_VISITOR is invalid. Don't use a namespace unless you define it.
	            if (data[i].cookie.name == "LSLP_VISITOR") {
	            	data[i].cookie.value = data[i].cookie.value.replace(/<Data>/g, "<Data xmlns:lslp=\"http://www.w3.org/TR/REC-xml-names/\">");
	            }
	            if (!data[i].getXmlValue()) {
					this.cookies.push({
						key: data[i].cookie.name
						,value: data[i].cookie.value
					});
	            } else {
	            	var xmlMap = xmlToMap(data[i].cookie.name, data[i].getXmlValue());
	            	this.cookies = this.cookies.concat(xmlMap);
	            }
	        }
	        sortMap(this.cookies);
	    }
	};

	function xmlToMap(rootName, doc) {
		var map = [];
		for (var i=0,iMax=doc.children.length; i<iMax; i++) {
			var child = doc.children[i];
			map.push({
				key: [rootName, child.localName].join("::")
				,value: child.textContent
			});
		}
        FBTrace.sysout("NitraTools; parsing xml", map);
		return map;
	}
	
	function getElementsByTag(tag) {
		return Firebug.currentContext.window.document.getElementsByTagName(tag);
	}

	function getElementsByClass(tag) {
		return Firebug.currentContext.window.document.getElementsByClassName(tag);
	}

	function getGlobalJsObject(name) {
		return Firebug.currentContext.window.wrappedJSObject[name];
	}

	function getCookies() {
		var cookies = Firebug.currentContext.window.document.cookie;
		return CookieUtils.parseSentCookiesFromString(cookies);
	}
	
	function typeOf(value) {
	    var s = typeof value;
	    if (s === 'object') {
	        if (value) {
	            if (value instanceof Array) {
	                s = 'array';
	            }
	        } else {
	            s = 'null';
	        }
	    }
	    return s;
	}
	
	function sortMap(map) {
		map.sort(function(a,b) {
			var ak = a.key.toLowerCase(), bk=b.key.toLowerCase();
			if (ak > bk) {
				return 1;
			} else if (ak < bk) {
				return -1;
			} else {
				return 0;
			}
		});
	}
})();

// ********************************************************************************************* //
// Registration

Firebug.registerPanel(Firebug.MyPanel);
Firebug.registerStylesheet("chrome://nitratools/skin/nitratools.css");

if (FBTrace.DBG_NITRATOOLS)
    FBTrace.sysout("NitraTools; myPanel.js, stylesheet registered");

return Firebug.MyPanel;

// ********************************************************************************************* //
});
