
var Options =
{
    "ckEnabled": ["checked", false],
    "ckCtrl": ["checked", false]
};
function close() {
    window.self.close();
}

function initIcon() {
    var localOptions = JSON.parse(localStorage["ColorOptions"]);
    if (localOptions['ckEnabled'][1] == true) {
        chrome.browserAction.setIcon({
            path: "icon_nodict.gif"
        })
    }
}
function changeIcon() {
    if (document.getElementById('ckEnabled').checked) {
        var a = document.getElementById('ckCtrl');
        a.disabled = true;

        chrome.browserAction.setIcon({
            path: "icon_nodict.gif"
        })
    }
    else {
        var a = document.getElementById('ckCtrl');
        a.disabled = false;

        chrome.browserAction.setIcon({
            path: "icon_dict.gif"
        })
    }
}

function save_options() {
    changeIcon();
    for (key in Options) {
        if (Options[key][0] == "checked") {
            Options[key][1] = document.getElementById(key).checked;
        }
    }
    localStorage["ColorOptions"] = JSON.stringify(Options);
}
function restore_options() {
    var localOptions = JSON.parse(localStorage["ColorOptions"]);

    for (key in localOptions) {
        optionValue = localOptions[key];
        if (!optionValue) return;
        var element = document.getElementById(key);
        if (element) {
            element.value = localOptions[key][1];
            switch (localOptions[key][0]) {
                case "checked":
                    if (localOptions[key][1]) element.checked = true;
                    else element.checked = false;
                    break;
            }
        }
    }

}

document.body.onload = function () { restore_options(); changeIcon(); };
document.getElementById("ckEnabled").onclick = function () { save_options(); };
document.getElementById("ckCtrl").onclick = function () { save_options(); };
