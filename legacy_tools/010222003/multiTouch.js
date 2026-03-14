var touchID = null;
function processEvent(event) {
  if (event.changedTouches) {
	// 单点触控
    var currentTouch = null;
    if (event.type == "touchstart") {
      // 假如当前无触摸点，则新建一个
      if (touchID == null) {
        touchID = event.changedTouches[0].identifier;
        currentTouch = event.changedTouches[0];
      } else {
        return false;
      }
    } else if (event.type == "touchmove") {
      // 判断触发当前事件的触摸点中是否有touchID对应的触摸点
      for (var i = 0; i < event.changedTouches.length; i++) {
        if (event.changedTouches[i].identifier == touchID) {
          currentTouch = event.changedTouches[i];
          break;
        }
      }
      if (!currentTouch) {
        return false;
      }
    } else if (event.type == "touchend" || event.type == "touchcancel") {
      // 判断触发当前事件的触摸点中是否有touchID对应的触摸点
      for (var i = 0; i < event.changedTouches.length; i++) {
        if (event.changedTouches[i].identifier == touchID) {
          currentTouch = event.changedTouches[i];
          break;
        }
      }
      if (currentTouch) {
        touchID = null;
      } else {
        return false;
      }
    }
    // do something for current touch point
    return true;
  }else{
	  return true;
  }
}
