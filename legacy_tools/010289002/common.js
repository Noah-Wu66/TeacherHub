
function submitQRCodeResult(result){
	var tokenid = window.parent.document.getElementById("tid").value;
	var userTokenId  = window.parent.document.getElementById("userTokenId").value;
	if(userTokenId != ""){
		$.ajax({
			type:"POST",
			url:"qc/submitQRCodeResult.do",
			timeout:10000,
			data:{'tid':tokenid,
				 'userTokenId':userTokenId,
				 'result':result},
			success:function(data){

			},
			error:function(){

			}
		});
	}	
}



function openProgress(){
	if($('#pageover').length == 0){
			var imgeWidth = document.documentElement.clientWidth/1920*500;
			var tb_pathToImage = "images/icon/loading.gif";  
			imgLoader = new Image(); //  image对象  
		    imgLoader.src = tb_pathToImage;  
		    $("body").append("<div id='Image_load'><img style='width:"+imgeWidth+"px;' src='" + imgLoader.src + "' /></div>"); //page中增加Img  
		    $('#Image_load').css('display','block'); //show loader  
		    $("body").append("<div id='pageover' style='z-index:99999;' class='window-mask' ></div>");  //增加遮罩层 		  
	}
}
var osBrowser = function (){
	var ua = navigator.userAgent,
	isWindowsPhone = /(?:Windows Phone)/.test(ua),
	isSymbian = /(?:SymbianOS)/.test(ua) || isWindowsPhone,
	isAndroid = /(?:Android)/.test(ua),
	isFireFox = /(?:Firefox)/.test(ua),
	isChrome = /(?:Chrome|CriOS)/.test(ua),
	isTablet = /(?:iPad|PlayBook)/.test(ua) || (isAndroid && !/(?:Mobile)/.test(ua)) || (isFireFox && /(?:Tablet)/.test(ua)),
	isPhone = /(?:iPhone)/.test(ua) && !isTablet,
	isPc = !isPhone && !isAndroid && !isSymbian;
	return {
		isTablet: isTablet,
		isPhone: isPhone,
		isAndroid: isAndroid,
		isPc: isPc
	};	
}();

function closeProgress(){
		$('#Image_load').remove();  
        $('#pageover').remove(); 
        if (osBrowser.isPc) {
            checkBrowser();
        }
}	

function checkBrowser(){
	if(isIE()){
		showBrowserRemindTip("IE",1);
	}

	if(isWxchar()){
		showBrowserRemindTip("电脑微信",2);
	}
}

function isIE() {
	if (!!window.ActiveXObject || "ActiveXObject" in window){
		return true;
	}else{
		return false;
	}	
}

function isWxchar(){
	var isWeixinBrowser = /micromessenger/i.test(navigator.userAgent)
	if (isWeixinBrowser) { 
		return true;
	}else{
		return false;
	}
}

function showBrowserRemindTip(browserInfo,type){
	var mydate = new Date();
	var browserCheckKey = "checkBrowserFlag" +mydate.toLocaleDateString();
	console.log("browserCheckKey=" + browserCheckKey);
	//var browserCheckFlag =  getCookiByName(browserCheckKey);
	var browserCheckFlag = 0;
	if(browserCheckFlag != "" && browserCheckFlag == 1){ //已经检查

	}else{
		var msg = "睿知云检测到您正在使用"+browserInfo + "浏览器，可能会导致部分内容无法正常使用，建议您复制以下地址，然后使用谷歌、360安全、腾讯等常用浏览器重新打开。";
		if(type == 2){
			msg = '睿知云<span style="color:red;">不支持</span>'+browserInfo + '直接使用，请点击<span style="color:red;">右上角图标</span>用浏览器打开。';
		}
		console.log("browserCheckFlag=" + browserCheckFlag);
		var screenWidth =document.body.clientWidth;
		var screenHeight = document.body.clientHeight;
        var body = document.getElementsByTagName('body')[0];
        var html = document.getElementsByTagName('html')[0];
        var width = html.clientWidth;
        var height =  html.clientHeight;
        var max = width > height ? width : height;
        var min = width > height ? height : width;

    	if($('#browserRemindPageover').length == 0){
        	 var screenHeight =1000;
   	   	 	 var dailogWidth = screenHeight*0.66;
   		 	 var dailogHeight = screenHeight*0.43;
   		 	 var mLeft =(max - dailogWidth)/2;
   		 	 var mTop =(min - dailogHeight)/2;
   		 	 
   		 	 //alert(screenHeight + " =" + dailogHeight);
			 console.log(document.documentElement.clientHeight + " = " + dailogHeight);
   			 var imagewidth = screenHeight/1000 * 100;
   			 var textFontSize = screenHeight/1370 * 40;
   			 var textPadding = screenHeight/1370 * 12;
   			 var titileHeight =screenHeight/1370 *90;
   			 var titileFontSize =screenHeight/1370 *40;
   			 var titileMarginL=screenHeight/1370 *16;
   			 var btnBottom = screenHeight/1370 * 20;
   			 var copyBtnFontSize =screenHeight/1370 *30;
   			 var copyBtnHeight = screenHeight/1370 *60;
   			 var btnRight =( dailogWidth - imagewidth)/2;
   		 	 var htmlStr = "<div id='browserRemindPageover' style='z-index:100012;background-color: rgba(0,0,0,0.8);'  class='window-mask'></div>";
       		 htmlStr += '<div id="browserRemind_dialog" style="z-index:100012;width:'+dailogWidth + 'px;height:' + dailogHeight + 'px;background-color:white;position:absolute;left:'+mLeft+'px' + ';top:'+mTop+ 'px; border-radius: 15px;" >';
       		 htmlStr += '<div id="title" style="width:'+dailogWidth + 'px;height:' + titileHeight + 'px;background-color:#4f93fe;color:white;border-top-left-radius:15px;border-top-right-radius:15px;font-size:' +titileFontSize +'px;" ><div style="margin-left:'+titileFontSize+'px;padding-top:'+titileMarginL+'px;">提示信息</div></div>';
       		 htmlStr += '<div style="margin:20px 30px;font-size:'+textFontSize+'px;">'+msg+'</div>';
			 if(type == 2){
				htmlStr +='<img  src="images/icon/wxloginError.png" style="margin-left:5vh;"/>'
			 }
			 
       		 htmlStr += '<div style="display:flex;font-size:'+textFontSize+'px;">';
       			htmlStr += '<div style="margin:10px 30px;font-size:'+textFontSize+'px;">mathtool.ruizhiyun.net</div>';
       		 	htmlStr += '<div style="margin:10px 30px;background-color: #2179fb;color:white;text-align:center;cursor:pointer;border-radius:10px;height:' +copyBtnHeight+'px;font-size:'+copyBtnFontSize+'px;" onclick="copyUrlText()">';
       				htmlStr += '<div style="margin-top:' +  screenHeight/1370 *8+'px;margin-left:' +screenHeight/1370 *12+'px;margin-right:'+ screenHeight/1370 *12 +'px;">复制链接</div>';
       		 	htmlStr += '</div>';
				htmlStr += '<div style="height:20px;font-size:16px;margin-top:'+ screenHeight/1370 *20 +'px;color:#06A8FF;font-family:microsoft yahei;text-align:center;" >';
					htmlStr +='<img  src="images/icon/dialog-info.png" id="text_msg" style="display: none;"/>'
				htmlStr += '</div>';
			 htmlStr += '</div>';
       		 htmlStr+='<img  style="position: absolute;z-index:100012;right:' + btnRight +'px;bottom:' + btnBottom+'px;cursor: pointer;width:'+imagewidth+'px" src="images/icon/setting/global/config_ok.png"  onclick="closebrowserRemindInfo()"></img>';
       		 htmlStr+='</div> ';
       			 
       		$("body").append(htmlStr);
    	}
    	
		var browserCheckTipCookie = browserCheckKey+"=1";
		document.cookie = browserCheckTipCookie;
	}
}

function getCookiByName(c_name){
	   var sName ="";
	   if (document.cookie.length > 0) {
		   c_start = document.cookie.indexOf(c_name + "=")
	        if (c_start != -1) {
	            c_start = c_start + c_name.length + 1
	            c_end = document.cookie.indexOf(";", c_start)
	            if (c_end == -1) c_end = document.cookie.length
	            sName= decodeURIComponent(document.cookie.substring(c_start, c_end))  // 取出值 
	           
	        }
	    }
	   return(sName)
}
function closebrowserRemindInfo(){
	$('#browserRemind_dialog').remove();
	$('#browserRemindPageover').remove();
}

function copyUrlText() {
    var oInput = document.createElement('input');
    oInput.value = "mathtool.ruizhiyun.net";
    document.body.appendChild(oInput);
    oInput.select();// 选择对象
    document.execCommand("Copy");// 执行浏览器复制命令
    oInput.className ='oInput';
    oInput.style.display='none';
  $('#text_msg').css('display','block');
  setTimeout(function () {
         var d = 0.5;
         setTimeout(function () {
         	  $('#text_msg').css('display','none');
          }, d * 1000);
      }, 500);
      
}
