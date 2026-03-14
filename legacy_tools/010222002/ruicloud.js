// var tagName = document.getElementById("ruicloudCommonTools").getAttribute("tag");
// console.log(tagName);
document.write("<script language=javascript src='../common/jquery.min.js'></script>");
const INFOIMGSRC = "../images/img/global/dialog-info.png";
const WARNINGIMGSRC = "../images/img/global/dialog-warning.png";
const ERRORIMGSRC = "../images/img/global/dialog-error.png";

const RIGHTIMGSRC = "../images/img/global/finish-right.png";
const WRONGIMGSRC = "../images/img/global/finish-wrong.png";
const CUSTOMSRC = "../images/img/global/finish-custom.png";
const RIGHTSOUNDOGGSRC = "../sound/finish-right.ogg";
const RIGHTSOUNDMP3SRC = "../sound/finish-right.mp3";
const WRONGSOUNDOGGSRC = "../sound/finish-wrong.ogg";
const WRONGSOUNDMP3SRC = "../sound/finish-wrong.mp3";

const LIGHTIMGSRC = "../images/img/global/light.png";

const RUICLOUD_KEY_CODE = "edc38f2adb31788c";
const RUICLOUD_FONT = " ruicloud_number,ruicloud_add_sub,ruicloud_letter,ruicloud_symbol,rucloud_base";

const CORRECTSHORT_OGGSRC = "../sound/correct_short.ogg";
const CORRECTSHORT_MP3SRC = "../sound/correct_short.mp3";
const WRONGSHORT_OGGSRC = "../sound/wrong_short.ogg";
const WRONGSHORT_MP3SRC = "../sound/wrong_short.mp3";

const RUICLOUD_SYMBOL_GREATER = '＞';
const RUICLOUD_SYMBOL_LESS = '＜';
const RUICLOUD_SYMBOL_GREATER_EQUAL = '≥';
const RUICLOUD_SYMBOL_LESS_EQUAL = '≤';
const RUICLOUD_SYMBOL_PLUS = '＋';
const RUICLOUD_SYMBOL_MINUS = '－';
const RUICLOUD_SYMBOL_MULTIPLE = '×';
const RUICLOUD_SYMBOL_DIVISION = '÷';
const RUICLOUD_SYMBOL_EQUAL = '＝';
const RUICLOUD_SYMBOL_WAVE = '&sim';
const RUICLOUD_SYMBOL_ELLIPSIS = '···';
const RUICLOUD_SYMBOL_APPROX_EQUAL = '≈';

const FIREWORKSSRC = "../images/img/global/fireworks.gif";

Array.prototype.contains =function(val){
	for(var i=this.length - 1;i>=0 ; i--){
		
		if(this[i]== val){
			return true;
		}
	}
	return false;
}

function getOffsetYForFillText(ctx, text) {
    return (ctx.measureText(text).actualBoundingBoxAscent) / 2;
}

function seededRandom(seed, max, min) {
    max = max || 1;
    min = min || 0;
    seed = (seed * 9301 + 49297) % 233280;
    let rnd = seed / 233280.0;
    return min + rnd * (max - min);
}

function seededRandomInt(seed, max, min) {
    if (typeof max == "undefined") {
        max = 10;
    }
    if (typeof min == "undefined") {
        min = 1;
    }
    return parseInt((seededRandom(seed, max, min) + "").replace(".", ""));
}

function addDefaultPromptView(x, y, text) {
    return addPromptView(x, y, text, true, 0, '4vh', '#333333', '#ffffff', 'default');
}

/**
 * 
 * @param {*} x 左上角坐标x，需要带单位，如10px ，1vh
 * @param {*} y 左上角坐标y，需要带单位，如10px ，1vh
 * @param {*} text 提示内容
 * @param {*} iconFlag true:带灯泡icon，false不带
 * @param {*} duration 延时自动关闭，0不关闭
 * @param {*} fontSize 字大小，需要带单位，如10px ，1vh
 * @param {*} color 字颜色
 * @param {*} backgroundColor 背景色
 * @param {*} border 边框，没有的话给"none"，如果想用默认就是"default"(defalut时会忽略borderRadius)
 * @param {*} borderRadius  圆角，没有的话0
 * @returns 返回view
 */

function addPromptView(x, y, text, iconFlag, duration, fontSize, color, backgroundColor, border, borderRadius) {
    let view = document.createElement('span');
    view.style.position = "absolute";
    view.style.left = x;
    view.style.top = y;
    view.style.color = color;
    view.style.background = backgroundColor;
    view.style.padding = '1vh';
    view.style.fontSize = fontSize;
    if (iconFlag) {
        view.innerHTML = "<img src='" + LIGHTIMGSRC + "' style='height:6vh;width:auto;margin-right:2vh'><span>" + text + "</span>";
    } else {
        view.innerHTML = "<span>" + text + "</span>";
    }

    view.style.pointerEvents = 'none';
    view.style.zIndex = 99999999;

    view.style.display = "flex";
    view.style.justifyContent = "flex-start";
    view.style.alignItems = "center";
    view.style.alignContent = "center";



    if (border == "default") {
        view.style.border = "1vh solid";
        view.style.borderImage = "linear-gradient(90deg, #4e94fe, #e6f1ff) 1";
        view.style.clipPath = "inset(0 round 1vh)";
    } else {
        view.style.border = border;
        view.style.borderRadius = borderRadius;
    }


    document.body.appendChild(view);

    // border: 10px solid;



    if (duration > 0) {
        setTimeout(function () {
            view.parentNode.removeChild(view);
        }, duration);
    }
    return view;
}

function updatePromptViewText(view, text) {
    if (view) {
        view.innerHTML = view.innerHTML.replace(/<span>.*<\/span>/g, "<span>" + text + "</span>");
    }
}

function removePromptView(view) {
    if (view && view.parentNode != null) {
        view.parentNode.removeChild(view);
    }

}

function safePlayAudio(audio) {
    if (!audio) {
        return;
    }
    try {
        var playPromise = audio.play();
        if (playPromise && typeof playPromise.catch == 'function') {
            playPromise.catch(function () { });
        }
    } catch (e) { }
}

function safeRemoveNode(node) {
    if (node && node.parentNode) {
        node.parentNode.removeChild(node);
    }
}

/** 0:正确音效 1:错误音效 */
function playShortSound(type) {
    var shortAudio = new Audio();
    let soundType = 0;
    if (shortAudio.canPlayType('audio/ogg') != '') {
        soundType = 0;
    } else if (shortAudio.canPlayType('audio/mpeg') != '') {
        soundType = 1;
    }

    if (type == 0) {
        shortAudio.src = CORRECTSHORT_OGGSRC;
        if (soundType == 1) {
            shortAudio.src = CORRECTSHORT_MP3SRC;
        }
    } else if (type == 1) {
        shortAudio.src = WRONGSHORT_OGGSRC;
        if (soundType == 1) {
            shortAudio.src = WRONGSHORT_MP3SRC;
        }
    }

    document.body.appendChild(shortAudio);
    shortAudio.currentTime = 0;
    shortAudio.load();
    safePlayAudio(shortAudio);
    shortAudio.onended = function () {
        safeRemoveNode(shortAudio);
    };
    setTimeout(function () {
        safeRemoveNode(shortAudio);
    }, 5000);
}

/**
 * 
 * @param {*} type 0:正确  1：错误 (和弹框的音乐一样)
 */
 function playFinishAudio(type){
	var audio = new Audio();
	let soundType = 0;
    if (audio.canPlayType('audio/ogg') != '') {
        soundType = 0;
    } else if (audio.canPlayType('audio/mpeg') != '') {
        soundType = 1;
    }
	 if (type == 0) {
        audio.src = RIGHTSOUNDOGGSRC;
        if (soundType == 1) {
            audio.src = RIGHTSOUNDMP3SRC;
        }
    } else if (type == 1) {
        audio.src = WRONGSOUNDOGGSRC;
        if (soundType == 1) {
            audio.src = WRONGSOUNDMP3SRC;
        }
    } 
	document.body.appendChild(audio);
    audio.currentTime = 0;
    audio.load();
    safePlayAudio(audio);
	audio.onended = function () {
        safeRemoveNode(audio);
    };
		
		
	setTimeout(function () {
        safeRemoveNode(audio);
    }, 5000);
}

/**
 * 
 * @param {*} type 0:你真棒  1：再想想  2：自定义文字
 * @param {*} duration 时长
 * @param {*} text 自定义文字的内容 (可不传)
 * @param {*} fontSize 字大小，需要带单位，如10px ，1vh (可不传)
 * @param {*} color 字颜色(可不传)
 * @param {*} top 弹窗位置 默认居中(可不传)
 */
function showFinishAlert(type, duration, text, fontSize, color, top) {
    var audio = new Audio();
    let soundType = 0;
    if (audio.canPlayType('audio/ogg') != '') {
        soundType = 0;
    } else if (audio.canPlayType('audio/mpeg') != '') {
        soundType = 1;
    }

    var img = new Image();
    if (type == 0) {
        img.src = RIGHTIMGSRC;
        audio.src = RIGHTSOUNDOGGSRC;
        if (soundType == 1) {
            audio.src = RIGHTSOUNDMP3SRC;
        }
    } else if (type == 1) {
        img.src = WRONGIMGSRC;
        audio.src = WRONGSOUNDOGGSRC;
        if (soundType == 1) {
            audio.src = WRONGSOUNDMP3SRC;
        }
    } else if (type == 2) {
        img.src = CUSTOMSRC;
    }

    if (type != 2) {
        document.body.appendChild(audio);
        audio.currentTime = 0;
        audio.load();
        safePlayAudio(audio);
        audio.onended = function () {
            safeRemoveNode(audio);
        };
        text = '';
        img.style.position = "absolute";
        img.style.width = "57.22vh";
        img.style.height = "51.09vh";
        img.style.left = "calc(50vw - 28.61vh)";
        img.style.top = (top || 20) + "vh";
    } else {
        img.style.position = "absolute";
        img.style.width = "74.96vh";
        img.style.height = "38.32vh";
        img.style.left = "calc(50vw - 37.48vh)";
        img.style.top = ((top || 20) + 8.35) + "vh";
    }
    img.style.zIndex = 9999999999999;

    var div = document.createElement("div");
    div.innerHTML = (text || '');
    div.style.position = "absolute";
    div.style.width = "64.96vh";
    div.style.height = "38.32vh";
    div.style.left = "calc(50vw - 32.48vh)";
    if (type != 2) {
        div.style.top = (top || 28.35) + "vh";
    } else {
        div.style.top = ((top || 20) + 8.35) + "vh";
    }
    div.style.zIndex = 9999999999999;

    div.style.textAlign = "center";
    div.style.fontSize = fontSize || '5vh';
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.color = color || '#333333';
    document.body.appendChild(img);
    document.body.appendChild(div);

    setTimeout(function () {
        safeRemoveNode(img);
        safeRemoveNode(div);
    }, duration);

    if (type != 2) {
        setTimeout(function () {
            safeRemoveNode(audio);
        }, 5000);
    }
}

function showRightAlert(duration) {
    var img = new Image();
    img.src = RIGHTIMGSRC;
    img.style.position = "absolute";
    img.style.width = "57.22vh";
    img.style.height = "51.09vh";
    img.style.left = "calc(50vw - 28.61vh)";
    img.style.top = "20vh";

    document.body.appendChild(img);

    setTimeout(function () {
        img.parentNode.removeChild(img);
    }, duration);
}

function showWrongAlert(duration) {
    var img = new Image();
    img.src = WRONGIMGSRC;
    img.style.position = "absolute";
    img.style.width = "57.22vh";
    img.style.height = "51.09vh";
    img.style.left = "calc(50vw - 28.61vh)";
    img.style.top = "20vh";

    document.body.appendChild(img);

    setTimeout(function () {
        img.parentNode.removeChild(img);
    }, duration);
}

/**
 * 
 * @param {*} context 
 * @param {*} x 中心点坐标x
 * @param {*} y 中心点坐标y
 * @param {*} width 宽度
 * @param {*} radius 弧度
 * @param {*} color 线条颜色
 * @param {*} lineWidth 线条宽度
 * @param {*} deg 方向。向上：0，向右:Math.PI/2，向下:Math.PI，向左：Math.PI*3/2
 */
function drawBrackets(context, x, y, width, radius, color, lineWidth, deg) {
    context.save();
    context.translate(x, y);
    context.rotate(deg);
    context.beginPath();
    context.setLineDash([]);
    context.lineWidth = lineWidth;
    context.strokeStyle = color;
    context.moveTo(-width / 2, -radius);
    context.arc(-width / 2 + radius, -radius, radius, Math.PI, Math.PI / 2, true);
    context.lineTo(-radius, 0);
    context.arc(-radius, radius, radius, Math.PI * 3 / 2, Math.PI * 2, false);
    context.arc(radius, radius, radius, Math.PI, Math.PI * 3 / 2, false);
    context.lineTo(width / 2 - radius, 0);
    context.arc(width / 2 - radius, -radius, radius, Math.PI / 2, 0, true);
    context.stroke();
    context.restore();
}


function showDialog(_0x548888, _0x478381, _0x226e8b) {
    var _0x4fb048 = { 'acTVf': '0|1|5|3|4|7|2|8|6', 'OnVNP': function (_0x318123, _0x10973a) { return _0x318123 + _0x10973a; }, 'idAtb': '-webkit-transform\x20', 'dyZOb': 's\x20ease-in,\x20opacity\x20', 'xLuZz': 's\x20ease-in', 'dGrkW': function (_0x8fc51f, _0x2beb75, _0x42c144) { return _0x8fc51f(_0x2beb75, _0x42c144); }, 'nXzGk': function (_0x853e84, _0x17d382) { return _0x853e84 * _0x17d382; }, 'IfobY': function (_0x118156, _0x30e504) { return _0x118156(_0x30e504); }, 'IjXFi': function (_0x104442, _0x609ffe) { return _0x104442 / _0x609ffe; }, 'hSeFY': function (_0x12f6e8, _0x31f060) { return _0x12f6e8 - _0x31f060; }, 'ayFbT': function (_0x2a43c9, _0x21a1a5) { return _0x2a43c9 == _0x21a1a5; }, 'Tlkdc': function (_0x2747f1, _0xaf440e) { return _0x2747f1 + _0xaf440e; }, 'AJnHy': function (_0x7edd5a, _0x168608) { return _0x7edd5a + _0x168608; }, 'wAFCl': function (_0x326580, _0x2879e2) { return _0x326580 + _0x2879e2; }, 'pReWT': function (_0x2d7b9b, _0x5b4c96) { return _0x2d7b9b + _0x5b4c96; }, 'DqVWj': '<img\x20src=\x27', 'KdIOB': '\x27/><span>', 'ULcIw': '</span>', 'KnBZT': 'dialoginfo\x20dialogsuccess', 'jZMOq': function (_0xdb43b2, _0x760051) { return _0xdb43b2 + _0x760051; }, 'MbkaZ': function (_0x54d298, _0x53acad) { return _0x54d298 + _0x53acad; }, 'RqUuM': function (_0x5ebdc2, _0xeea7c3) { return _0x5ebdc2 + _0xeea7c3; }, 'sVyao': function (_0x1c6304, _0x5ccc00) { return _0x1c6304 + _0x5ccc00; }, 'kgXTt': 'dialoginfo\x20dialogwarning', 'VypYT': function (_0x3fb5b4, _0x51d964) { return _0x3fb5b4 + _0x51d964; }, 'cMHUU': function (_0x1802f9, _0x3cef08) { return _0x1802f9 + _0x3cef08; }, 'yiCsz': function (_0x302cfa, _0x3636d9) { return _0x302cfa + _0x3636d9; }, 'mxhSE': 'dialoginfo\x20dialogerror', 'waxuK': function (_0x11e6c9, _0x37c1b3) { return _0x11e6c9 + _0x37c1b3; }, 'lHvBN': 'div', 'Xlitp': function (_0x141af6, _0x49235a) { return _0x141af6 + _0x49235a; } };
    var _0x23832d = _0x4fb048['acTVf']['split']('|'),
        _0x3eeec7 = 0x0;
    while (!![]) {
        switch (_0x23832d[_0x3eeec7++]) {
            case '0':
                var _0x40ca7f = { 'BuBYo': function (_0xf33b63, _0x30def9) { return _0x4fb048['OnVNP'](_0xf33b63, _0x30def9); }, 'jjwNo': function (_0x3ae6de, _0x2808cf) { return _0x4fb048['OnVNP'](_0x3ae6de, _0x2808cf); }, 'yNzyj': function (_0x8ea9e7, _0x44a4c7) { return _0x4fb048['OnVNP'](_0x8ea9e7, _0x44a4c7); }, 'TEFpN': _0x4fb048['idAtb'], 'clIYJ': _0x4fb048['dyZOb'], 'apssu': _0x4fb048['xLuZz'], 'ZfqxD': function (_0x11e05f, _0x1af94e, _0x598afb) { return _0x4fb048['dGrkW'](_0x11e05f, _0x1af94e, _0x598afb); }, 'Znngg': function (_0x242a66, _0x599249) { return _0x4fb048['nXzGk'](_0x242a66, _0x599249); } };
                continue;
            case '1':
                _0x226e8b = _0x4fb048['IfobY'](isNaN, _0x226e8b) ? 0x7d0 : _0x226e8b;
                continue;
            case '2':
                _0x24144f['style']['left'] = _0x4fb048['OnVNP'](_0x4fb048['IjXFi'](_0x4fb048['hSeFY'](document['documentElement']['clientWidth'], _0x2c17ca), 0x2), 'px');
                continue;
            case '3':
                if (_0x4fb048['ayFbT'](_0x548888, 0x0)) {
                    _0x24144f['innerHTML'] = _0x4fb048['Tlkdc'](_0x4fb048['AJnHy'](_0x4fb048['wAFCl'](_0x4fb048['pReWT'](_0x4fb048['DqVWj'], INFOIMGSRC), _0x4fb048['KdIOB']), _0x478381), _0x4fb048['ULcIw']);
                    _0x24144f['className'] = _0x4fb048['KnBZT'];
                } else if (_0x4fb048['ayFbT'](_0x548888, 0x1)) {
                    _0x24144f['innerHTML'] = _0x4fb048['jZMOq'](_0x4fb048['MbkaZ'](_0x4fb048['RqUuM'](_0x4fb048['sVyao'](_0x4fb048['DqVWj'], WARNINGIMGSRC), _0x4fb048['KdIOB']), _0x478381), _0x4fb048['ULcIw']);
                    _0x24144f['className'] = _0x4fb048['kgXTt'];
                } else {
                    _0x24144f['innerHTML'] = _0x4fb048['VypYT'](_0x4fb048['cMHUU'](_0x4fb048['cMHUU'](_0x4fb048['yiCsz'](_0x4fb048['DqVWj'], ERRORIMGSRC), _0x4fb048['KdIOB']), _0x478381), _0x4fb048['ULcIw']);
                    _0x24144f['className'] = _0x4fb048['mxhSE'];
                }
                continue;
            case '4':
                var _0x2c17ca = Math['max'](_0x4fb048['waxuK'](_0x4fb048['nXzGk'](_0x478381['length'], 0x1e), 0x50), 0x96);
                continue;
            case '5':
                var _0x24144f = document['createElement'](_0x4fb048['lHvBN']);
                continue;
            case '6':
                _0x4fb048['dGrkW'](setTimeout, function () {
                    var _0x359c5e = 0.5;
                    _0x24144f['style']['webkitTransition'] = _0x40ca7f['BuBYo'](_0x40ca7f['jjwNo'](_0x40ca7f['jjwNo'](_0x40ca7f['yNzyj'](_0x40ca7f['TEFpN'], _0x359c5e), _0x40ca7f['clIYJ']), _0x359c5e), _0x40ca7f['apssu']);
                    _0x24144f['style']['opacity'] = '0';
                    _0x40ca7f['ZfqxD'](setTimeout, function () { document['body']['removeChild'](_0x24144f); }, _0x40ca7f['Znngg'](_0x359c5e, 0x3e8));
                }, _0x226e8b);
                continue;
            case '7':
                _0x24144f['style']['width'] = _0x4fb048['Xlitp'](_0x2c17ca, 'px');
                continue;
            case '8':
                document['body']['appendChild'](_0x24144f);
                continue;
        }
        break;
    }
}

function createKeyBoard(_0x2ccad1, _0x544726, _0x4e7b9c, _0x4c57cf, _0x38f090, _0x250784) {
    var _0x223a29 = { 'dlSCx': '1|8|0|6|3|4|2|7|5', 'rJiFq': 'keyboardnumberDiv', 'JULVk': 'div', 'cTZgv': function (_0x22c525, _0x7647db) { return _0x22c525 == _0x7647db; }, 'oMjGG': function (_0x2d929a, _0x56aabb) { return _0x2d929a + _0x56aabb; }, 'gpUpP': function (_0x6eacf8, _0x3d8106) { return _0x6eacf8 + _0x3d8106; }, 'meHgj': function (_0x5037ce, _0x5022e1) { return _0x5037ce + _0x5022e1; }, 'fqIvg': function (_0xf44d7f, _0x1aed59) { return _0xf44d7f + _0x1aed59; }, 'cecFr': function (_0xd02126, _0x4a094e) { return _0xd02126 + _0x4a094e; }, 'WSTbu': function (_0x49e293, _0x16410f) { return _0x49e293 + _0x16410f; }, 'DrLxy': function (_0x58a77e, _0x3c58d3) { return _0x58a77e + _0x3c58d3; }, 'KKCkF': function (_0x2a7ce0, _0x169df6) { return _0x2a7ce0 + _0x169df6; }, 'vaPzk': function (_0x231531, _0x3eae05) { return _0x231531 + _0x3eae05; }, 'ZnwJx': '<table>', 'OJzNZ': '\x20\x20\x20\x20<tr>', 'YfGoW': '\x20\x20\x20\x20\x20\x20\x20\x20<td>1</td>', 'HxTpk': '\x20\x20\x20\x20\x20\x20\x20\x20<td>2</td>', 'aqeyW': '\x20\x20\x20\x20\x20\x20\x20\x20<td>3</td>', 'kxQZD': '\x20\x20\x20\x20</tr>', 'mlywv': '\x20\x20\x20\x20\x20\x20\x20\x20<td>4</td>', 'EJlMF': '\x20\x20\x20\x20\x20\x20\x20\x20<td>5</td>', 'QgJoW': '\x20\x20\x20\x20\x20\x20\x20\x20<td>6</td>', 'swiEJ': '\x20\x20\x20\x20\x20\x20\x20\x20<td>7</td>', 'VGqlR': '\x20\x20\x20\x20\x20\x20\x20\x20<td>8</td>', 'PMiWO': '\x20\x20\x20\x20\x20\x20\x20\x20<td>9</td>', 'HDhWp': '\x20\x20\x20\x20\x20\x20\x20\x20<td>0</td>', 'SCPVH': '\x20\x20\x20\x20\x20\x20\x20\x20<td>DEL</td>', 'DhAhH': '\x20\x20\x20\x20\x20\x20\x20\x20<td>OK</td>', 'twfvA': '</table>', 'UCncw': function (_0x5eb5ac, _0x40484a) { return _0x5eb5ac + _0x40484a; }, 'kgUkZ': function (_0x3d5e73, _0x5396b7) { return _0x3d5e73 + _0x5396b7; }, 'MKlSN': function (_0x7e86b1, _0x1dd0f0) { return _0x7e86b1 + _0x1dd0f0; }, 'GlGIi': function (_0x25cc3e, _0x41d952) { return _0x25cc3e + _0x41d952; }, 'YYeHk': function (_0x2ca265, _0x3a4a81) { return _0x2ca265 + _0x3a4a81; }, 'lVZcb': function (_0x509e00, _0x1e44e6) { return _0x509e00 + _0x1e44e6; }, 'IYoDL': function (_0x105bf3, _0x3c7967) { return _0x105bf3 + _0x3c7967; }, 'XEpbf': function (_0x2a9029, _0x421848) { return _0x2a9029 + _0x421848; }, 'bclkt': '\x20\x20\x20\x20\x20\x20\x20\x20<td\x20colspan=\x222\x22>DEL</td>', 'NgaON': function (_0x1a0951, _0x3c3822, _0x1d99aa, _0x1d9599) { return _0x1a0951(_0x3c3822, _0x1d99aa, _0x1d9599); }, 'FFMuQ': 'keyboardnumber' };
    var _0x1eda55 = _0x223a29['dlSCx']['split']('|'),
        _0xc9167d = 0x0;
    while (!![]) {
        switch (_0x1eda55[_0xc9167d++]) {
            case '0':
                _0x205b5d['id'] = _0x223a29['rJiFq'];
                continue;
            case '1':
                var _0x205b5d = document['createElement'](_0x223a29['JULVk']);
                continue;
            case '2':
                _0x2ccad1['appendChild'](_0x205b5d);
                continue;
            case '3':
                _0x205b5d['style']['left'] = _0x4c57cf;
                continue;
            case '4':
                _0x205b5d['style']['top'] = _0x4e7b9c;
                continue;
            case '5':
                _0x2ccad1['styleddrop']();
                continue;
            case '6':
                if (_0x223a29['cTZgv'](_0x544726, 0x0)) { _0x205b5d['innerHTML'] = _0x223a29['oMjGG'](_0x223a29['oMjGG'](_0x223a29['gpUpP'](_0x223a29['gpUpP'](_0x223a29['gpUpP'](_0x223a29['meHgj'](_0x223a29['fqIvg'](_0x223a29['fqIvg'](_0x223a29['cecFr'](_0x223a29['cecFr'](_0x223a29['WSTbu'](_0x223a29['DrLxy'](_0x223a29['DrLxy'](_0x223a29['DrLxy'](_0x223a29['DrLxy'](_0x223a29['DrLxy'](_0x223a29['DrLxy'](_0x223a29['KKCkF'](_0x223a29['KKCkF'](_0x223a29['KKCkF'](_0x223a29['vaPzk'](_0x223a29['ZnwJx'], _0x223a29['OJzNZ']), _0x223a29['YfGoW']), _0x223a29['HxTpk']), _0x223a29['aqeyW']), _0x223a29['kxQZD']), _0x223a29['OJzNZ']), _0x223a29['mlywv']), _0x223a29['EJlMF']), _0x223a29['QgJoW']), _0x223a29['kxQZD']), _0x223a29['OJzNZ']), _0x223a29['swiEJ']), _0x223a29['VGqlR']), _0x223a29['PMiWO']), _0x223a29['kxQZD']), _0x223a29['OJzNZ']), _0x223a29['HDhWp']), _0x223a29['SCPVH']), _0x223a29['DhAhH']), _0x223a29['kxQZD']), _0x223a29['twfvA']); } else if (_0x223a29['cTZgv'](_0x544726, 0x1)) { _0x205b5d['innerHTML'] = _0x223a29['UCncw'](_0x223a29['kgUkZ'](_0x223a29['MKlSN'](_0x223a29['MKlSN'](_0x223a29['MKlSN'](_0x223a29['MKlSN'](_0x223a29['GlGIi'](_0x223a29['GlGIi'](_0x223a29['YYeHk'](_0x223a29['YYeHk'](_0x223a29['YYeHk'](_0x223a29['lVZcb'](_0x223a29['lVZcb'](_0x223a29['lVZcb'](_0x223a29['IYoDL'](_0x223a29['IYoDL'](_0x223a29['IYoDL'](_0x223a29['XEpbf'](_0x223a29['XEpbf'](_0x223a29['XEpbf'](_0x223a29['XEpbf'](_0x223a29['ZnwJx'], _0x223a29['OJzNZ']), _0x223a29['YfGoW']), _0x223a29['HxTpk']), _0x223a29['aqeyW']), _0x223a29['kxQZD']), _0x223a29['OJzNZ']), _0x223a29['mlywv']), _0x223a29['EJlMF']), _0x223a29['QgJoW']), _0x223a29['kxQZD']), _0x223a29['OJzNZ']), _0x223a29['swiEJ']), _0x223a29['VGqlR']), _0x223a29['PMiWO']), _0x223a29['kxQZD']), _0x223a29['OJzNZ']), _0x223a29['HDhWp']), _0x223a29['bclkt']), _0x223a29['DhAhH']), _0x223a29['kxQZD']), _0x223a29['twfvA']); }
                continue;
            case '7':
                _0x223a29['NgaON'](keyBoardAddEvent, _0x2ccad1, _0x38f090, _0x250784);
                continue;
            case '8':
                _0x205b5d['className'] = _0x223a29['FFMuQ'];
                continue;
        }
        break;
    }
}

function closeKeyBoard() {
    var _0x2cc00f = { 'bxuBx': function (_0x373e83, _0x5c4670) { return _0x373e83(_0x5c4670); }, 'ngGJY': '.keyboardnumber' };
    _0x2cc00f['bxuBx']($, _0x2cc00f['ngGJY'])['fadeOut'](0x190);
}

function configKeyBoardPosition(_0x42abd5, _0x23824b) {
    var _0x3e9221 = { 'OFFhN': 'keyboardnumberDiv' };
    var _0x2ca5c1 = document['getElementById'](_0x3e9221['OFFhN']);
    _0x2ca5c1['style']['left'] = _0x23824b;
    _0x2ca5c1['style']['top'] = _0x42abd5;
}

function keyBoardAddEvent(_0x555def, _0x401016, _0x311458) {
    var _0x24f0c5 = { 'fvfWR': function (_0x376d7d, _0x21e165, _0x2db160) { return _0x376d7d(_0x21e165, _0x2db160); }, 'zMAnZ': function (_0x483283, _0x5bf7fd) { return _0x483283(_0x5bf7fd); }, 'EHfni': function (_0x3fb5a7, _0x5772ea, _0x554297) { return _0x3fb5a7(_0x5772ea, _0x554297); }, 'LUpfL': '6|4|1|3|5|2|0', 'NeJmI': '.keyboardnumber\x20td', 'Dyyih': '.keyboardshow', 'ycwIo': '4|5|1|2|0|6|3', 'cbXSR': '.keyboardnumber', 'QRLxS': 'keyboardshow\x20keyboardactive' };
    _0x555def['styleddrop'] = function () {
        var _0x48a376 = _0x24f0c5['LUpfL']['split']('|'),
            _0x1d8b2d = 0x0;
        while (!![]) {
            switch (_0x48a376[_0x1d8b2d++]) {
                case '0':
                    _0x389578['find'](_0x24f0c5['NeJmI'])['click'](function () {
                        if (_0x470ed9) {
                            _0x470ed9 = ![];
                            _0x24f0c5['fvfWR'](setTimeout, function () { _0x470ed9 = !![]; }, 0x64);
                            var _0x482050 = _0x24f0c5['zMAnZ']($, this)['html']();
                            _0x24f0c5['EHfni'](_0x311458, _0x482050, _0x5aa4d6);
                        }
                    });
                    continue;
                case '1':
                    var _0x5aa4d6 = this;
                    continue;
                case '2':
                    _0x389578['find'](_0x24f0c5['Dyyih'])['click'](function () {
                        if (_0x470ed9) {
                            var _0x2207bb = _0x390933['rTKbP']['split']('|'),
                                _0x392c36 = 0x0;
                            while (!![]) {
                                switch (_0x2207bb[_0x392c36++]) {
                                    case '0':
                                        _0x389578['find'](_0x390933['WzeVf'])['fadeIn'](0x190);
                                        continue;
                                    case '1':
                                        _0x5aa4d6 = this;
                                        continue;
                                    case '2':
                                        _0x5aa4d6['innerHTML'] = '';
                                        continue;
                                    case '3':
                                        _0x390933['ATqJQ'](_0x401016, _0x5aa4d6);
                                        continue;
                                    case '4':
                                        _0x470ed9 = ![];
                                        continue;
                                    case '5':
                                        _0x390933['DgjGR'](setTimeout, function () { _0x470ed9 = !![]; }, 0x64);
                                        continue;
                                    case '6':
                                        _0x5aa4d6['className'] = _0x390933['YXRiN'];
                                        continue;
                                }
                                break;
                            }
                        }
                    });
                    continue;
                case '3':
                    var _0x1b2571 = 0xa;
                    continue;
                case '4':
                    var _0x389578 = _0x24f0c5['zMAnZ']($, this);
                    continue;
                case '5':
                    var _0x470ed9 = !![];
                    continue;
                case '6':
                    var _0x390933 = { 'rTKbP': _0x24f0c5['ycwIo'], 'WzeVf': _0x24f0c5['cbXSR'], 'ATqJQ': function (_0x3be551, _0x4fa42f) { return _0x24f0c5['zMAnZ'](_0x3be551, _0x4fa42f); }, 'DgjGR': function (_0x5d55c0, _0x5e3c85, _0x15481b) { return _0x24f0c5['EHfni'](_0x5d55c0, _0x5e3c85, _0x15481b); }, 'YXRiN': _0x24f0c5['QRLxS'] };
                    continue;
            }
            break;
        }
    };
}

function showFireworks() {
    var img = new Image();
	img.src = FIREWORKSSRC;
	img.style.position = "absolute";
	img.style.width = "80vh";
	img.style.height = "45vh";
    img.style.left = "calc(50vw - 40vh)";
	img.style.top = "20vh";
    img.style.zIndex = 99999999;

    document.body.appendChild(img);

    setTimeout(function () {
       img.parentNode.removeChild(img);
    }, 5000);
}
