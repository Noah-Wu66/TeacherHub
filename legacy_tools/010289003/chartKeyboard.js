document.write('<img id="chartKeyboardNum0" src="../images/img/global/chartInput/num0.png"style="display:none" /><img id="chartKeyboardNum1" src="../images/img/global/chartInput/num1.png"style="display:none" /><img id="chartKeyboardNum2" src="../images/img/global/chartInput/num2.png"style="display:none" /><img id="chartKeyboardNum3" src="../images/img/global/chartInput/num3.png"style="display:none" /><img id="chartKeyboardNum4" src="../images/img/global/chartInput/num4.png"style="display:none" /><img id="chartKeyboardNum5" src="../images/img/global/chartInput/num5.png"style="display:none" /><img id="chartKeyboardNum6" src="../images/img/global/chartInput/num6.png"style="display:none" /><img id="chartKeyboardNum7" src="../images/img/global/chartInput/num7.png"style="display:none" /><img id="chartKeyboardNum8" src="../images/img/global/chartInput/num8.png"style="display:none" /><img id="chartKeyboardNum9" src="../images/img/global/chartInput/num9.png"style="display:none" /><img id="chartKeyboardNumPoint" src="../images/img/global/chartInput/numPoint.png"style="display:none" /><img id="chartKeyboardNumDel" src="../images/img/global/chartInput/numDel.png"style="display:none" /><img id="chartKeyboardNumWan" src="../images/img/global/chartInput/numWan.png"style="display:none" /><img id="chartKeyboardNumBw" src="../images/img/global/chartInput/numBw.png"style="display:none" /><img id="chartKeyboardNumYi" src="../images/img/global/chartInput/numYi.png"style="display:none" /><img id="chartKeyboardNumDisplay" src="../images/img/global/chartInput/numDisplay.png"style="display:none" /><img id="chartKeyboardNumOk" src="../images/img/global/chartInput/numOk.png"style="display:none" /><img id="chartKeyboardNumSelect" src="../images/img/global/chartInput/btnSelect.png"style="display:none" />');


function initInputKeyboard() {
	let numBtnWidth = oneSize * 80;
	let numBtnHeight = oneSize * 80;
	let numDisplayWidth = oneSize * 265;
	let numDisplayHeight = oneSize * 80;
	let numOkWidth = oneSize * 254;
	let numOkHeight = oneSize * 73;
	let numPaddingX = oneSize * 12;//按钮之间
	let numPaddingY = oneSize * 12;//按钮之间
	let otherPadding = oneSize * 20;//按钮距离边框，显示框、ok距离其他
	let keyBoardWidth = oneSize * 304;
	let keyBoardHeight = oneSize * 709;

	keyboardInfoArray.width = keyBoardWidth;
	keyboardInfoArray.height = keyBoardHeight;
	keyboardInfoArray.displayValue = '';
	keyboardInfoArray.displayValueUnit = '';

	let numMarginX = (keyBoardWidth - numBtnWidth * 3 - numPaddingX * 2) / 2;
	let numMarginY = otherPadding * 3 + numDisplayHeight;
	keyboardInfoArray.push({ 'x': numMarginX, 'y': numMarginY, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '1', 'type': 'num' });
	keyboardInfoArray.push({ 'x': numMarginX + numBtnWidth + numPaddingX, 'y': numMarginY, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '2', 'type': 'num' });
	keyboardInfoArray.push({ 'x': numMarginX + numBtnWidth * 2 + numPaddingX * 2, 'y': numMarginY, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '3', 'type': 'num' });
	keyboardInfoArray.push({ 'x': numMarginX, 'y': numMarginY + numBtnHeight + numPaddingY, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '4', 'type': 'num' });
	keyboardInfoArray.push({ 'x': numMarginX + numBtnWidth + numPaddingX, 'y': numMarginY + numBtnHeight + numPaddingY, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '5', 'type': 'num' });
	keyboardInfoArray.push({ 'x': numMarginX + numBtnWidth * 2 + numPaddingX * 2, 'y': numMarginY + numBtnHeight + numPaddingY, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '6', 'type': 'num' });
	keyboardInfoArray.push({ 'x': numMarginX, 'y': numMarginY + numBtnHeight * 2 + numPaddingY * 2, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '7', 'type': 'num' });
	keyboardInfoArray.push({ 'x': numMarginX + numBtnWidth + numPaddingX, 'y': numMarginY + numBtnHeight * 2 + numPaddingY * 2, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '8', 'type': 'num' });
	keyboardInfoArray.push({ 'x': numMarginX + numBtnWidth * 2 + numPaddingX * 2, 'y': numMarginY + numBtnHeight * 2 + numPaddingY * 2, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '9', 'type': 'num' });

	keyboardInfoArray.push({ 'x': numMarginX, 'y': numMarginY + numBtnHeight * 3 + numPaddingY * 3, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '0', 'type': 'num' });
	keyboardInfoArray.push({ 'x': numMarginX + numBtnWidth + numPaddingX, 'y': numMarginY + numBtnHeight * 3 + numPaddingY * 3, 'w': numBtnWidth, 'h': numBtnHeight, 'value': '.', 'type': 'Point' });
	keyboardInfoArray.push({ 'x': numMarginX + numBtnWidth * 2 + numPaddingX * 2, 'y': numMarginY + numBtnHeight * 3 + numPaddingY * 3, 'w': numBtnWidth, 'h': numBtnHeight, 'type': 'Del' });

	keyboardInfoArray.push({ 'x': numMarginX, 'y': numMarginY + numBtnHeight * 4 + numPaddingY * 4, 'w': numBtnWidth, 'h': numBtnHeight, 'type': 'unit', 'value': 'Wan', 'text': '万', 'select': false });
	keyboardInfoArray.push({ 'x': numMarginX + numBtnWidth + numPaddingX, 'y': numMarginY + numBtnHeight * 4 + numPaddingY * 4, 'w': numBtnWidth, 'h': numBtnHeight, 'type': 'unit', 'value': 'Bw', 'text': '百万', 'select': false });
	keyboardInfoArray.push({ 'x': numMarginX + numBtnWidth * 2 + numPaddingX * 2, 'y': numMarginY + numBtnHeight * 4 + numPaddingY * 4, 'w': numBtnWidth, 'h': numBtnHeight, 'type': 'unit', 'value': 'Yi', 'text': '亿', 'select': false });

	keyboardInfoArray.push({ 'x': (keyBoardWidth - numDisplayWidth) / 2, 'y': otherPadding, 'w': numDisplayWidth, 'h': numDisplayHeight, 'type': 'Display', 'value': '' });
	keyboardInfoArray.push({ 'x': (keyBoardWidth - numOkWidth) / 2, 'y': otherPadding * 4 + numDisplayHeight + numPaddingY * 4 + numBtnHeight * 5, 'w': numOkWidth, 'h': numOkHeight, 'type': 'Ok' });
}

function clickOnKeyboard(X, Y) {

	if (X > keyboardMarginX && X < keyboardMarginX + keyboardInfoArray.width && Y > keyboardMarginY && Y < keyboardMarginY + keyboardInfoArray.height) {

		for (i = 0; i < keyboardInfoArray.length; i++) {
			let startX = keyboardMarginX + keyboardInfoArray[i].x;
			let startY = keyboardMarginY + keyboardInfoArray[i].y;
			if (X > startX && X < startX + keyboardInfoArray[i].w && Y > startY && Y < startY + keyboardInfoArray[i].h) {
				if (keyboardInfoArray[i].type == 'num') {
					if (keyboardInfoArray.displayValue.length < 4) {
						keyboardInfoArray.displayValue = keyboardInfoArray.displayValue + keyboardInfoArray[i].value;
					}
				} else if (keyboardInfoArray[i].type == 'Point') {
					if (keyboardInfoArray.displayValue.length < 3 && keyboardInfoArray.displayValue != '' && keyboardInfoArray.displayValue.indexOf('.') == -1) {
						keyboardInfoArray.displayValue = keyboardInfoArray.displayValue + keyboardInfoArray[i].value;
					}
				} else if (keyboardInfoArray[i].type == 'Del') {
					keyboardInfoArray.displayValue = keyboardInfoArray.displayValue.substring(0, keyboardInfoArray.displayValue.length - 1);
				} else if (keyboardInfoArray[i].type == 'unit') {
					if (keyboardInfoArray[i].select) {
						keyboardInfoArray[i].select = false;
						keyboardInfoArray.displayValueUnit = '';
					} else {
						if (keyboardInfoArray.displayValue != '') {
							for (j = 12; j < 15; j++) {
								keyboardInfoArray[j].select = false;
							}
							keyboardInfoArray[i].select = true;
							keyboardInfoArray.displayValueUnit = keyboardInfoArray[i].text;
						}
					}
				} else if (keyboardInfoArray[i].type == 'Display') {

				} else if (keyboardInfoArray[i].type == 'Ok') {

					if (keyboardInfoArray.displayValue != '') {
						oneGridValue = keyboardInfoArray.displayValue;
						let fixNum = checkDecimalPlaces(Number(oneGridValue));
						
						if (keyboardInfoArray.displayValue.indexOf('.') == -1 || keyboardInfoArray.displayValue.indexOf('.') == keyboardInfoArray.displayValue.length - 1) {
							for (j = 0; j < chartRowYNum; j++) {
								let yValue = '';
								yValue = parseInt(oneGridValue) + parseInt(oneGridValue) * (j);
								chartAxisYArray[j].value = yValue;
							}
						} else {
							//小数点后只保留1位
							// oneGridValue = oneGridValue.substring(0, keyboardInfoArray.displayValue.indexOf('.') + 2);
							for (j = 0; j < chartRowYNum; j++) {
								let yValue = '';
								yValue = parseFloat(parseFloat(oneGridValue) + parseFloat(oneGridValue) * j).toFixed(fixNum);
								chartAxisYArray[j].value = yValue;
							}

						}
						console.log(chartAxisYArray);
						oneGridValueUnit = keyboardInfoArray.displayValueUnit;
						newYStep = true;
						showKeyboardFlag = false;
					} else {
						showKeyboardFlag = false;
					}
					// openKeyboard();
					
					// alert(oneGridValueUnit);
				}
				return true;
			}

		}
		return true;
	}
}

function drawKeyboard() {
	ctx.fillStyle = '#95DCFF';
	ctx.strokeStyle = '#95DCFF';
	// ctx.beginPath();
	// ctx.rect(keyboardMarginX, keyboardMarginY, keyboardInfoArray.width, keyboardInfoArray.height);
	fillRoundRect(ctx, keyboardMarginX, keyboardMarginY, keyboardInfoArray.width, keyboardInfoArray.height, oneSize * 20, '#95DCFF', '#95DCFF');
	// ctx.fill();
	// ctx.stroke();
	// ctx.beginPath();
	fillRoundRect(ctx, keyboardMarginX, keyboardMarginY, keyboardInfoArray.width, oneSize * 120, oneSize * 20, '#6CCEFE', '#6CCEFE');

	for (i = 0; i < keyboardInfoArray.length; i++) {
		if (keyboardInfoArray[i].type == 'num') {
			let numImg = document.getElementById('chartKeyboardNum' + keyboardInfoArray[i].value);
			ctx.drawImage(numImg, keyboardMarginX + keyboardInfoArray[i].x, keyboardMarginY + keyboardInfoArray[i].y, keyboardInfoArray[i].w, keyboardInfoArray[i].h);
		} else if (keyboardInfoArray[i].type == 'Point') {
			let numImg = document.getElementById('chartKeyboardNum' + keyboardInfoArray[i].type);
			ctx.drawImage(numImg, keyboardMarginX + keyboardInfoArray[i].x, keyboardMarginY + keyboardInfoArray[i].y, keyboardInfoArray[i].w, keyboardInfoArray[i].h);
		} else if (keyboardInfoArray[i].type == 'Del') {
			let numImg = document.getElementById('chartKeyboardNum' + keyboardInfoArray[i].type);
			ctx.drawImage(numImg, keyboardMarginX + keyboardInfoArray[i].x, keyboardMarginY + keyboardInfoArray[i].y, keyboardInfoArray[i].w, keyboardInfoArray[i].h);
		} else if (keyboardInfoArray[i].type == 'unit') {
			let numImg = document.getElementById('chartKeyboardNum' + keyboardInfoArray[i].value);
			ctx.drawImage(numImg, keyboardMarginX + keyboardInfoArray[i].x, keyboardMarginY + keyboardInfoArray[i].y, keyboardInfoArray[i].w, keyboardInfoArray[i].h);
			if (keyboardInfoArray[i].select) {
				let sImg = document.getElementById('chartKeyboardNumSelect');
				ctx.drawImage(sImg, keyboardMarginX + keyboardInfoArray[i].x, keyboardMarginY + keyboardInfoArray[i].y, keyboardInfoArray[i].w, keyboardInfoArray[i].h);
			}
		} else if (keyboardInfoArray[i].type == 'Display') {
			let numImg = document.getElementById('chartKeyboardNum' + keyboardInfoArray[i].type);
			ctx.drawImage(numImg, keyboardMarginX + keyboardInfoArray[i].x, keyboardMarginY + keyboardInfoArray[i].y, keyboardInfoArray[i].w, keyboardInfoArray[i].h);
			;
			ctx.fillStyle = tableTextColor;
			let size = Math.floor(oneSize * 48);
			cfont = size.toString() + "px 方正黑体,黑体,Microsoft YaHei";
			ctx.font = cfont;
			let titleTextWidth = ctx.measureText(keyboardInfoArray.displayValue + keyboardInfoArray.displayValueUnit).width;
			let textStartX = keyboardMarginX + keyboardInfoArray[i].x + keyboardInfoArray[i].w - oneSize * 12 - titleTextWidth;
			ctx.fillText(keyboardInfoArray.displayValue + keyboardInfoArray.displayValueUnit, textStartX, keyboardMarginY + keyboardInfoArray[i].y + keyboardInfoArray[i].h * 0.6);

		} else if (keyboardInfoArray[i].type == 'Ok') {
			let numImg = document.getElementById('chartKeyboardNum' + keyboardInfoArray[i].type);
			ctx.drawImage(numImg, keyboardMarginX + keyboardInfoArray[i].x, keyboardMarginY + keyboardInfoArray[i].y, keyboardInfoArray[i].w, keyboardInfoArray[i].h);
		}

	}
}


function openKeyboard() {
	if (showKeyboardFlag) {
		showKeyboardFlag = false;
	} else {
		for (i = 0; i < keyboardInfoArray.length; i++) {
			if (keyboardInfoArray[i].type == 'unit') {
				keyboardInfoArray[i].select = false;
			} else if (keyboardInfoArray[i].type == 'Display') {
				keyboardInfoArray[i].value = '';
			}
		}
		keyboardInfoArray.displayValue = '';
		keyboardInfoArray.displayValueUnit = '';
		showKeyboardFlag = true;
	}
}

/**
* 判断输入的数字是整数还是小数
* @param {number} num - 要判断的数字
* @returns {number} 如果是整数返回0，如果是小数返回小数位数
*/
function checkDecimalPlaces(num) {
	// 检查输入是否为数字
	if (typeof num !== 'number' || isNaN(num)) {
		throw new Error('输入必须是有效的数字');
	}

	// 如果数字是整数，直接返回0
	if (Number.isInteger(num)) {
		return 0;
	}

	// 将数字转为字符串并分割
	const numStr = num.toString();

	// 判断是否有小数点
	if (numStr.includes('.')) {
		// 获取小数部分的长度
		const decimalPart = numStr.split('.')[1];
		return decimalPart.length;
	}

	// 如果没有小数点，则是整数
	return 0;
}