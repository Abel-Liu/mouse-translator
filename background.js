
chrome.extension.onRequest.addListener(onQueryRequest);

function onQueryRequest(request, sender, callback) {
    if (request.action == 'query') {
        //callback({ 'result': request.word });
        fetchWordWithoutDeskDict(request.word, callback);
    }
};


sprintfWrapper = {
    init: function () {

        if (typeof arguments == "undefined") { return null; }
        if (arguments.length < 1) { return null; }
        if (typeof arguments[0] != "string") { return null; }
        if (typeof RegExp == "undefined") { return null; }

        var string = arguments[0];
        var exp = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
        var matches = new Array();
        var strings = new Array();
        var convCount = 0;
        var stringPosStart = 0;
        var stringPosEnd = 0;
        var matchPosEnd = 0;
        var newString = '';
        var match = null;

        while (match = exp.exec(string)) {
            if (match[9]) { convCount += 1; }

            stringPosStart = matchPosEnd;
            stringPosEnd = exp.lastIndex - match[0].length;
            strings[strings.length] = string.substring(stringPosStart, stringPosEnd);

            matchPosEnd = exp.lastIndex;
            matches[matches.length] = {
                match: match[0],
                left: match[3] ? true : false,
                sign: match[4] || '',
                pad: match[5] || ' ',
                min: match[6] || 0,
                precision: match[8],
                code: match[9] || '%',
                negative: parseInt(arguments[convCount]) < 0 ? true : false,
                argument: String(arguments[convCount])
            };
        }
        strings[strings.length] = string.substring(matchPosEnd);

        if (matches.length == 0) { return string; }
        if ((arguments.length - 1) < convCount) { return null; }

        var code = null;
        var match = null;
        var i = null;

        for (i = 0; i < matches.length; i++) {

            if (matches[i].code == '%') { substitution = '%' }
            else if (matches[i].code == 'b') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(2));
                substitution = sprintfWrapper.convert(matches[i], true);
            }
            else if (matches[i].code == 'c') {
                matches[i].argument = String(String.fromCharCode(parseInt(Math.abs(parseInt(matches[i].argument)))));
                substitution = sprintfWrapper.convert(matches[i], true);
            }
            else if (matches[i].code == 'd') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)));
                substitution = sprintfWrapper.convert(matches[i]);
            }
            else if (matches[i].code == 'f') {
                matches[i].argument = String(Math.abs(parseFloat(matches[i].argument)).toFixed(matches[i].precision ? matches[i].precision : 6));
                substitution = sprintfWrapper.convert(matches[i]);
            }
            else if (matches[i].code == 'o') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(8));
                substitution = sprintfWrapper.convert(matches[i]);
            }
            else if (matches[i].code == 's') {
                matches[i].argument = matches[i].argument.substring(0, matches[i].precision ? matches[i].precision : matches[i].argument.length)
                substitution = sprintfWrapper.convert(matches[i], true);
            }
            else if (matches[i].code == 'x') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                substitution = sprintfWrapper.convert(matches[i]);
            }
            else if (matches[i].code == 'X') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                substitution = sprintfWrapper.convert(matches[i]).toUpperCase();
            }
            else {
                substitution = matches[i].match;
            }

            newString += strings[i];
            newString += substitution;

        }
        newString += strings[i];

        return newString;
    },

    convert: function (match, nosign) {
        if (nosign) {
            match.sign = '';
        } else {
            match.sign = match.negative ? '-' : match.sign;
        }
        var l = match.min - match.argument.length + 1 - match.sign.length;
        var pad = new Array(l < 0 ? 0 : l).join(match.pad);
        if (!match.left) {
            if (match.pad == "0" || nosign) {
                return match.sign + pad + match.argument;
            } else {
                return pad + match.sign + match.argument;
            }
        } else {
            if (match.pad == "0" || nosign) {
                return match.sign + match.argument + pad.replace(/0/g, ' ');
            } else {
                return match.sign + match.argument + pad;
            }
        }
    }
}

sprintf = sprintfWrapper.init;

function fetchWordWithoutDeskDict(word, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (data) {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var dataText = translateXML(xhr.responseXML);
                if (dataText != null)
                    callback(dataText);
            }
        }
    }
    var url = 'http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q=' + encodeURIComponent(word) + '&pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208&le=eng'

    xhr.open('GET', url, true);
    xhr.send();
};

var noBaseTrans = false;
var noWebTrans = false;
var speach = '';
function translateXML(xmlnode) {
    var translate = "<strong>查询:</strong><br/>";
    var root = xmlnode.getElementsByTagName("yodaodict")[0];

    if ("" + root.getElementsByTagName("return-phrase")[0].childNodes[0] != "undefined")
        var retphrase = root.getElementsByTagName("return-phrase")[0].childNodes[0].nodeValue;

    if ("" + root.getElementsByTagName("dictcn-speach")[0] != "undefined")
        speach = root.getElementsByTagName("dictcn-speach")[0].childNodes[0].nodeValue;

    var lang = "&le=";
    if ("" + root.getElementsByTagName("lang")[0] != "undefined")
        lang += root.getElementsByTagName("lang")[0].childNodes[0].nodeValue;
    var strpho = "";
    if ("" + root.getElementsByTagName("phonetic-symbol")[0] != "undefined") {
        if ("" + root.getElementsByTagName("phonetic-symbol")[0].childNodes[0] != "undefined")
            var pho = root.getElementsByTagName("phonetic-symbol")[0].childNodes[0].nodeValue;

        if (pho != null) {
            strpho = "&nbsp;[" + pho + "]";
        }
    }

    if ("" + root.getElementsByTagName("translation")[0] == "undefined") {
        noBaseTrans = true;
    }
    if ("" + root.getElementsByTagName("web-translation")[0] == "undefined") {
        noWebTrans = true;
    }

    var basetrans = "";
    var webtrans = "";
    var translations;
    var webtranslations;
    if (noBaseTrans == false) {
        if ("" + root.getElementsByTagName("translation")[0].childNodes[0] != "undefined") {
            translations = root.getElementsByTagName("translation");
        }
        else {
            noBaseTrans = true;
        }
        var i;
        for (i = 0; i < translations.length - 1; i++) {
            basetrans += '<div class="ydd-trans-container ydd-padding010">' + translations[i].getElementsByTagName("content")[0].childNodes[0].nodeValue + "</div>";
        }
        basetrans += '<div class="ydd-trans-container ydd-padding010">' + translations[i].getElementsByTagName("content")[0].childNodes[0].nodeValue + "</div>";
    }

    if (noWebTrans == false) {
        if ("" + root.getElementsByTagName("web-translation")[0].childNodes[0] != "undefined") {
            webtranslations = root.getElementsByTagName("web-translation");
        }
        else {
            noWebTrans = true;
        }
        var i;
        for (i = 0; i < webtranslations.length - 1 ; i++) {
            webtrans += '<div class="ydd-trans-container ydd-padding010"><a href="http://dict.youdao.com/search?q=' + encodeURIComponent(webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue) + '&keyfrom=chrome.extension' + lang + '" target=_blank>' + webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue + ":</a> ";
            webtrans += webtranslations[i].getElementsByTagName("trans")[0].getElementsByTagName("value")[0].childNodes[0].nodeValue + "<br /></div>";
        }
        webtrans += '<div class="ydd-trans-container ydd-padding010"><a href="http://dict.youdao.com/search?q=' + encodeURIComponent(webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue) + '&keyfrom=chrome.extension' + lang + '" target=_blank>' + webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue + ":</a> ";
        webtrans += webtranslations[i].getElementsByTagName("trans")[0].getElementsByTagName("value")[0].childNodes[0].nodeValue + "</div>";
    }
    return genTable(retphrase, strpho, basetrans, webtrans);
}

function genTable(word, strpho, baseTrans, webTrans) {
    var lan = '';

    var title = word;
    if (title.length > 15) {
        title = title.substring(0, 10) + '...';
    }

    var fmt = '';
    if (noBaseTrans && noWebTrans) {

        fmt = '<div id="yddContainer" align=left style="padding:0px 0px 0px 0px;">' +
		'    <div id="yddTop" class="ydd-sp"><div id="yddTopBorderlr"><a href="http://dict.youdao.com/search?q=' +
		encodeURIComponent(word) +
		'&keyfrom=chrome.extension' +
		lan +
		'" target=_blank title="查看完整释义" id="yddKeyTitle">' +
		title +
		'</a>&nbsp;<span style="font-weight:normal;font-size:10px;">' +
		strpho +'</div></div>' +
		'    <div id="yddMiddle">';
    }
    else {
        fmt = '<div id="yddContainer" align=left style="padding:0px 0px 0px 0px;">' +
		'    <div id="yddTop" class="ydd-sp"><div id="yddTopBorderlr"><a href="http://dict.youdao.com/search?q=' +
		encodeURIComponent(word) +
		'&keyfrom=chrome.extension' +
		lan +
		'" target=_blank title="查看完整释义" id="yddKeyTitle">' +
		title +
		'</a>&nbsp;<span style="font-weight:normal;font-size:10px;">' +
		strpho +
		'&nbsp;&nbsp;</span><span id="voice" style="padding:2px;height:15px;width:15px">' +
		speach +
		'</span></div></div>' +
		'    <div id="yddMiddle">';
    }
    if (noBaseTrans == false) {
        var base =
			 '  <div class="ydd-trans-wrapper" style="display:block;padding:0px 0px 0px 0px" id="yddSimpleTrans">' +
			 '        <div class="ydd-tabs"><span class="ydd-tab">基本翻译</span></div>' +
			 '        %s' +
			 '	</div>';
        base = sprintf(base, baseTrans);
        fmt += base;
    }
    if (noWebTrans == false) {
        var web =
			'       <div class="ydd-trans-wrapper" style="display:block;padding:0px 0px 0px 0px">' +
			'        <div class="ydd-tabs"><span class="ydd-tab">网络释义</span></div>' +
			'        %s' +
			'      </div>';
        web = sprintf(web, webTrans);
        fmt += web;
    }
    if (noBaseTrans && noWebTrans) {
        fmt += '&nbsp;&nbsp;没有英汉互译结果<br/>&nbsp;&nbsp;<a href="http://www.youdao.com/search?q=' + encodeURIComponent(word) + '&ue=utf8&keyfrom=chrome.extension" target=_blank>请尝试网页搜索</a>';
    }
    fmt += '   </div>' +
			'  </div>';

    res = fmt;
    noBaseTrans = false;
    noWebTrans = false;
    speach = '';
    return res;
}