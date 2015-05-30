
var last_frame = null;
var xx, yy, sx, sy;
var list = new Array();

var body = document.getElementsByTagName("body")[0];
var styleInsert = document.createElement("style");
styleInsert.type = "text/css";
var styleContent = document.createTextNode("#yddContainer{display:block;font-family:Microsoft YaHei;position:relative;width:100%;height:100%;top:-4px;left:-4px;font-size:12px;border:1px solid}#yddTop{display:block;height:22px}#yddTopBorderlr{display:block;position:static;height:17px;padding:2px 28px;line-height:17px;font-size:12px;color:#5079bb;font-weight:bold;border-style:none solid;border-width:1px}#yddTopBorderlr .ydd-sp{position:absolute;top:2px;height:0;overflow:hidden}.ydd-icon{left:5px;width:17px;padding:0px 0px 0px 0px;padding-top:17px;background-position:-16px -44px}.ydd-close{right:5px;width:16px;padding-top:16px;background-position:left -44px}#yddKeyTitle{float:left;text-decoration:none}#yddMiddle{display:block;margin-bottom:10px}.ydd-tabs{display:block;margin:5px 0;padding:0 5px;height:18px;border-bottom:1px solid}.ydd-tab{display:block;float:left;height:18px;margin:0 5px -1px 0;padding:0 4px;line-height:18px;border:1px solid;border-bottom:none}.ydd-trans-container{display:block;line-height:160%}.ydd-trans-container a{text-decoration:none;}#yddBottom{position:absolute;bottom:0;left:0;width:100%;height:22px;line-height:22px;overflow:hidden;background-position:left -22px}.ydd-padding010{padding:0 10px}#divResult{color:#252525;z-index:10001;}#yddContainer{background:#fff;border-color:#4b7598}#yddTopBorderlr{border-color:#f0f8fc}#divResult .ydd-sp{}#divResult a,#divResult a:hover,#divResult a:visited{color:#50799b}#divResult .ydd-tabs{color:#959595}.ydd-tabs,.ydd-tab{background:#fff;border-color:#d5e7f3}#yddBottom{color:#363636}#divResult{min-width:250px;max-width:400px;}");

if (styleInsert.styleSheet)
    styleInsert.styleSheet.cssText = styleContent.nodeValue;
else {
    styleInsert.appendChild(styleContent);
    document.getElementsByTagName("head")[0].appendChild(styleInsert)
}

document.addEventListener('mousemove', onMouseMove, true);
body.addEventListener("mouseup", onMouseUp, false);

function onMouseUp(e)
{
    closeDiv();
}

function closeDiv() {
    if (in_div)
        return;
    if (last_frame != null) {
        while (list.length != 0) {
            body.removeChild(list.pop());
        }
        last_frame = null;
        return true;
    }
    return false
}

var prevC, prevO, prevWord;
var isAlpha = function (str) { return /[a-zA-Z']+/.test(str) };
function onMouseMove(event) {
    if(!(event.ctrlKey&&event.altKey))
        return true;
    var r = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (!r) return true;

    var so = r.startOffset, eo = r.endOffset;
    if (prevC === r.startContainer && prevO === so)
        return true

    prevC = r.startContainer;
    prevO = so;
    var tr = r.cloneRange(), text = '';
    if (r.startContainer.data)
        while (so >= 1) {
            tr.setStart(r.startContainer, --so);
            text = tr.toString();
            if (!isAlpha(text.charAt(0))) {
                tr.setStart(r.startContainer, so + 1);
                break;
            }
        }
    if (r.endContainer.data)
        while (eo < r.endContainer.data.length) {
            tr.setEnd(r.endContainer, ++eo);
            text = tr.toString();
            if (!isAlpha(text.charAt(text.length - 1))) {
                tr.setEnd(r.endContainer, eo - 1);
                break;
            }
        }

    var word = tr.toString();
    if (prevWord == word)
        return true;

    prevWord = word;

    if (word.length > 0) {
        setTimeout(function () {
            var s = window.getSelection();
            s.removeAllRanges();
            s.addRange(tr);
            xx = event.pageX, yy = event.pageY, sx = event.screenX, sy = event.screenY;
            queryWord(word);
        }, 100);
    }
}

function queryWord(word) {
    chrome.extension.sendRequest({ 'action': 'query', 'word': word }, onQueryResponse);
}

function onQueryResponse(data) {
    closeDiv();
    createDiv(data, xx, yy, sx, sy);
}
var in_div = false;
function createDiv(word, x, y, screenX, screenY) {
    var frame_height = 150;
    var frame_width = 300;
    var padding = 10;

    var frame_left = 0;
    var frame_top = 0;
    var frame = document.createElement('div');

    frame.id = 'divResult';

    var screen_width = screen.availWidth;
    var screen_height = screen.availHeight;

    if (screenX + frame_width < screen_width)
        frame_left = x;
    else
        frame_left = (x - frame_width - 2 * padding);

    frame.style.left = frame_left + 'px';

    if (screenY + frame_height + 20 < screen_height)
        frame_top = y;
    else
        frame_top = (y - frame_height - 2 * padding);


    frame.style.top = frame_top + 10 + 'px';
    frame.style.position = 'absolute';

    if (frame.style.left + frame_width > screen_width) {
        frame.style.left -= frame.style.left + frame_width - screen_width;
    }
    frame.innerHTML += word;
    frame.onmouseover = function (e) { in_div = true; };
    frame.onmouseout = function (e) { in_div = false; };
    body.style.position = "static";
    body.appendChild(frame);


    if (document.getElementById("voice") != null) {
        var speach_swf = document.getElementById("voice");
        if (speach_swf.innerHTML != '') {
            speach_swf.innerHTML = insertaudio("http://dict.youdao.com/speech?audio=" + speach_swf.innerHTML, "test", "CLICK", "dictcn_speech");
            var speach_flash = document.getElementById("speach_flash");
            if (speach_flash != null) {
                try {
                    speach_flash.StopPlay();
                }
                catch (err) {
                    ;
                }
            }
        }
    }


    list.push(frame);
    var leftbottom = frame_top + 10 + document.getElementById("divResult").clientHeight;

    if (leftbottom < y) {
        var newtop = y - document.getElementById("divResult").clientHeight;
        frame.style.top = newtop + 'px';
    }
    if (last_frame != null) {
        if (last_frame.style.top == frame.style.top && last_frame.style.left == frame.style.left) {
            body.removeChild(frame);
            list.pop();
            return;
        }
    }
    last_frame = frame;
}

function insertaudio(a, query, action, type) {
    return '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0" width="15px" height="15px" align="absmiddle" id="speach_flash">' + '<param name="allowScriptAccess" value="sameDomain" />' + '<param name="movie" value="http://cidian.youdao.com/chromeplus/voice.swf" />' + '<param name="loop" value="false" />' + '<param name="menu" value="false" />' + '<param name="quality" value="high" />' + '<param name="wmode"  value="transparent">' + '<param name="FlashVars" value="audio=' + a + '">' + '<embed wmode="transparent" src="http://cidian.youdao.com/chromeplus/voice.swf" loop="false" menu="false" quality="high" bgcolor="#ffffff" width="15" height="15" align="absmiddle" allowScriptAccess="sameDomain" FlashVars="audio=' + a + '" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />' + '</object>';
}