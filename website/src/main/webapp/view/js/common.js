/*
	MS 民生电商公共方法
*/
window.MS = window.MS || {};
//判断平台类型和特性的属性
;(function(){
    var userAgent = navigator.userAgent || '';
    MS.platform = MS.platform || {};
    //判断是否为android平台
    MS.platform.isAndroid = /android/i.test( userAgent );
    //判断是否为Winphone平台
    MS.platform.isWinphone = /windows phone/i.test( userAgent );
    //判断是否为ipad平台
    MS.platform.isIpad = /ipad/i.test( userAgent );
    //判断是否为iphone平台
    MS.platform.isIphone = /iphone/i.test( userAgent );
    //判断是否是微信
    MS.platform.isWeChat = /micromessenger/i.test( userAgent );
    //判断是否是UC浏览器
    MS.platform.isUc = /ucbrowser/i.test( userAgent );
})();
//触屏设备使用touchstart事件，PC使用click
;(function(){
    MS.EventCenter = MS.EventCenter || {};
    MS.EventCenter.CLICK = ('ontouchstart' in window ? 'touchstart' : 'click');
})();
//cookie方法
;(function() {
    MS.cookie = {
        get : function( name ) {
            var c = document.cookie;
            if ( !c.length ) {
                return '';
            }
            var tp = c.split( '; ' );
            for ( var i = tp.length - 1; i >= 0; i-- ) {
                var tm = tp[ i ].split( '=' );
                if ( tm.length > 1 && tm[ 0 ] == name && tm[ 1 ] ) {
                    return unescape( $.trim( tm[ 1 ] ) );
                }
            }
            return '';
        },
        set : function( name, value, day, domain, usehost ) {
            day = day || 365, domain = domain || '', usehost = usehost || 0;
            var expires = new Date();
            expires.setTime( (new Date()).getTime() + 3600 * 24 * 1000 * day );
            document.cookie = name + "=" + escape( value ) + "; path=/; " + (usehost ? 'host' : 'domain') + "=" + domain + (day == -1 ? '' : ";expires=" + expires.toGMTString());
        },
        del : function( name ) {
            this.set( name, '', -365, null, 0 );
            this.set( name, '', -365, document.location.host, 1 );
        }
    };
})();
//本地存储
;(function(){
    var __localStorage = {
        set : function( name, val ){
            window.localStorage && localStorage.setItem( name, val );
        },
        get : function( name, val ){
            return window.localStorage && localStorage.getItem( name );
        },
        del : function( name, val ){
            window.localStorage && localStorage.removeItem( name );
        }
    };
    MS.STORAGE = MS.__localStorage || {
        set : __localStorage.set,
        get : __localStorage.get,
        del : __localStorage.del
    };
})();
//设置token
;(function(){
    function __setToken( tokens ) {
        MS.cookie.set( 'token', tokens )
    };
    MS.token = {
        set : __setToken,
        get : function() {
            return MS.cookie.get( 'token' );
        },
        del : function() {
            MS.cookie.set( 'token', '', -365 );
        }
    };
})();
//全屏遮罩
;(function(){
    function __addShadow( top, callback ) {
        var $shadow = $( '#__shadow' );
        if ( typeof top === 'function' ) {
            callback = top;
            top = 0;
        }
        if ( !$shadow.length ) {
            $shadow = $( '<div id="__shadow" style="opacity: .8; width: 100%;height: 100%;background-color: #000;position: fixed;top: 0;left: 0;" class="z-act-pop"></div>' );
            $shadow.appendTo( 'body' );
        } else {
            $shadow.show();
        }
        var docH = $( document ).height(), winH = $( window ).height(), h = Math.max( docH, winH );
        $shadow.height( h ).css( 'top', top ).off( MS.EventCenter.CLICK ).on( MS.EventCenter.CLICK, function( e ) {
            e.preventDefault();
            e.stopPropagation();
            callback && callback();
            $shadow.hide();
            // 避免点击穿透到后面的元素
            return false;
        } );
        return $shadow;
    }
    MS.shadow = MS.shadow || {
        show : __addShadow,
        hide : function() {
            $( '#__shadow' ).hide();
            return false;
        }
    };
})();
//全屏loding
;(function(){
    function __addLoading(){
        var _loading = $( '#__loading' );
        if( !_loading.length ){
            _loading = $( '<div id="__loading" style="opacity: .8; width: 100%;height: 100%;background-color: #000;position: fixed;top: 0;left: 0;" class="z-act-pop"></div>' );
            _loading.appendTo( 'body' );
        }else{
            _loading.show();
        }
        return _loading;
    }
    MS.loading = MS.loading || {
        show : __addLoading,
        hide : function(){
            $( '#__loading' ).hide();
        }
    }
})();
/*
    对AJAX进行封装
    可配置参数
    options.isLoading 为false就不显示loading
    options.isToken 为false时就不需要传token字段
*/
;(function(){
    MS.util = MS.util || {};
    function __request( url, data, callback, options ) {
        var $timer = 0;
        // 简略写法支持
        if ( typeof data === 'function' ) {
            // 支持__request(url, callback, options)写法
            if ( typeof callback !== 'undefined' ) {
                options = callback;
            }
            // 支持__request(url, callback)写法
            callback = data;
            data = {};
        }
        //追加isajax，使服务器能够识别该请求来源于ajax
        if ( !options || !options.noAjax ) {
            data.isajax = 1;
        }
        //避免api的缓存
        data.dtime = +new Date();
        //标识手机端请求
        data.wap = true;
        //token登录秘钥
        ( options && options.isToken === false ) ? '' : ( data.token = MS.token.get() || MS.STORAGE.get( 'token' ) );
        // 默认参数
        var ajaxSettings = {
            url : url,
            type : 'POST',
            data : data,
            dataType : 'json',
            crossDomain : true,
            timeout : 60000,
            beforeSend : function( xhr, settings ){
                if( ajaxSettings.isLoading == false ){ return; }
                MS.loading.show();
            },
            success : function( json ) {
                if ( !json ) { return; }
                var disposeJson = {
                	isSuccess : ( json.code == 'C00000' ),
                    code : json.code,
                    msg : json.msg,
                    data : json.data
                };
                json = $.extend( json, disposeJson );
                callback && callback( json );
            },
            error : function( xhr, errorType, error ){
                if( errorType == 'error' ){
                    MS.messShow( '服务器异常，请稍后重试！' );
                }else if( errorType == 'timeout' ){
                    MS.messShow( '请求超时，请稍后再试！' );
                }
            },
            complete : function(xhr, status){
                clearTimeout( $timer );
                if( ajaxSettings.isLoading === false ){ return; }
                $timer = setTimeout( MS.loading.hide, 100 );
            }
        };
        // 扩展默认参数
        if ( options ) {
            //是否显示loading
            ( options.isLoading === false ) ? ajaxSettings.isLoading = false : ajaxSettings.isLoading = true;
            ajaxSettings = $.extend( ajaxSettings, options );
        }
        return $.ajax( ajaxSettings );
    }
    MS.util.request = MS.request = MS.request || __request;
})();
//登陆成功后保存用户的手机号和昵称到cookie
;(function(){
    MS.userInfo = {
        setNikeName : function(nikeName){
            MS.cookie.set( 'nikeName', nikeName );
        },
        setPhone:function(phones){
            MS.cookie.set( 'phone', phones );
        },
        getNikeName : function() {
            return MS.cookie.get( 'nikeName' );
        },
        getPhone : function() {
            return MS.cookie.get( 'phone' );
        }
    };
})();
;(function(){
    MS.util = MS.util || {};
    MS.util.addSheet = MS.util.addSheet || function( css ) {
        // 当为 IE 浏览器的时候
        // 将 opacity 样式全部替换为 filter:alpha(opacity) 方式设置半透明
        if ( !-[ 1, ] ) {
            css = css.replace( /opacity:\s*(\d?\.\d+)/g, function( $, $1 ) {
                $1 = parseFloat( $1 ) * 100;
                if ( $1 < 0 || $1 > 100 ) {
                    return "";
                }
                return "filter:alpha(opacity=" + $1 + ");"
            } );
        }
        css += "\n";//增加末尾的换行符，方便在firebug下的查看。
        var doc = document, head = doc.getElementsByTagName( "head" )[ 0 ],
        styles = head.getElementsByTagName( "style" ), style, media;
        if ( styles.length === 0 ) {//如果不存在style元素则创建
            if ( doc.createStyleSheet ) {    //ie
                doc.createStyleSheet();
            } else {
                style = doc.createElement( 'style' );//w3c
                style.setAttribute( "type", "text/css" );
                head.insertBefore( style, null )
            }
        }
        // getElementsByTagName 的返回类型为 NodeList ,
        // 在从 NodeList 中读取对象时,
        // 都会重新搜索一次满足条件的对象
        style = styles[ 0 ];
        /*
         style标签media属性常见的四种值
         screen 计算机屏幕（默认值）。
         handheld 手持设备（小屏幕、有限的带宽）。
         print  打印预览模式 / 打印页。
         all  适合所有设备。
         */
        media = style.getAttribute( "media" );
        // 当 media 不为 screen 且为空
        if ( media === null && !/screen/i.test( media ) ) {
            style.setAttribute( "media", "all" );
        }
        if ( style.styleSheet ) {    //ie
            style.styleSheet.cssText += css;//添加新的内部样式
        } else if ( doc.getBoxObjectFor ) {
            style.innerHTML += css;//火狐支持直接innerHTML添加样式表字串
        } else {
            style.appendChild( doc.createTextNode( css ) )
        }
    };
})();
//信息提示浮层
;(function(){
    //获取窗口可视范围的高度
    function getClientHeight(){
        var h = 0;
        var docH = $( document ).height(), winH = $( window ).height(), h = Math.max( docH, winH );
        return h;
    }
    //给页面添加弹出层的html
    function messHtml(){
        var $containerWindow = $('#container_window');
        var $html = '<div class="mess-box z-act"><div class="mess-box-info"><div class="mess-content">您的信息不全，请您补全信息后再进行投资</div><div class="mess-btn"><ul><li class="sure"><a href="javaScript:;">确定 </a><span>|</span></li><li class="cancel"><a href="javaScript:;">取消</a></li></ul></div></div></div>' ;
        if( !$containerWindow.length ){
            var $container = $('<section class="container" id="container_window"></div>');
            $container.append( $html );
            $("body").append( $container );
        }
    }
    //弹窗信息提示
    function messShow(info,url,btnInfo,callback){
        messHtml();//给页面添加弹出层的html
        var hgh = getClientHeight();//获取窗口可视范围的高度
        $(".mess-box").show();
        $(".mess-box").css("height",hgh+"px");
        $("body").css("height",hgh+"px");
        $("body").css("overflow","hidden");
        if(info){//弹出框的主体信息，当其为空时显示默认信息，不为空时赋值
            $(".mess-content").text(info);
        }

        if(callback){//点击真实的确定按钮的时候会执行返回函数
			$(".mess-btn .sure a").click(function(e){
				e.preventDefault();
				callback();
			});
		}else{
			 if(url == undefined || url==""){//当url为空的时候，仅显示取消按钮，并且把取消按钮的文字置换为“确定”
		         $(".mess-btn li.sure").hide();
		         $(".mess-btn li.cancel").css("width","100%");
		         $(".mess-btn .cancel a").text("确定");
		     }else{
		         $(".mess-btn .sure a").attr("href",url);//当url存在的时候为确定按钮赋值
		     }
		}

        if(btnInfo == "" || btnInfo){//btnInfo为确定按钮传入的值。
            if(btnInfo == ""){//如果btnInfo为空的话，将确定按钮隐藏，并且把取消按钮的文字置换为“确定”
                $(".mess-btn .sure span").text("");
                $(".mess-btn li.sure").hide();
                $(".mess-btn li.cancel").css("width","100%");
                $(".mess-btn .cancel a").text("确定");
            }
            $(".mess-btn .sure a").text(btnInfo);//为确定按钮赋值
        }

        $(".mess-btn .cancel").click(function(){//点击取消按钮的时候会返回true
            $(".mess-box").hide();
            $("body").css("overflow","auto");
            return true;
        });
        return true;
    }
    MS.messShow = messShow;
})();
//获取URL参数
;(function(){
	function getQueryStringArgs(){
		var qs = (location.search.length > 0 ? location.search.substring(1) : "");
		var args = {};
		var items = qs.length ? qs.split("&") : [];
		var item = null,
			name = null,
			value = null,
			i = 0,
			len = items.length;
		for(i = 0; i< len;i++){
			item = items[i].split("=");
			name = decodeURIComponent(item[0]);
			value = decodeURIComponent(item[1]);
			if(name.length){
				args[name] = value;
			}
		}
		return args;
	}
	MS.getQueryStringArgs = getQueryStringArgs;
})();