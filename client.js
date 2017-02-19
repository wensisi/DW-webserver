(function () {
	var d = document,
	w = window,
	p = parseInt,
	dd = d.documentElement,
	db = d.body,
	dc = d.compatMode == 'CSS1Compat',
	dx = dc ? dd: db,
	ec = encodeURIComponent;
	
	
	w.CHAT = {
		msgObj:d.getElementById("message"),
		screenheight:w.innerHeight ? w.innerHeight : dx.clientHeight,
		username:null,
		userid:null,
		socket:null,
		//让浏览器滚动条保持在最低部
		scrollToBottom:function(){
			w.scrollTo(0, this.msgObj.clientHeight);
		},
		//退出，本例只是一个简单的刷新
		logout:function(){
			//this.socket.disconnect();
			location.reload();
		},
		//提交聊天消息内容
		submit:function(_obj){
			console.log(_obj);
			var content = d.getElementById("content").value +d.getElementById("emoji").getAttribute("data-value");
			if(content != '' || _obj.file !=""){
				var obj = {
					userid: this.userid,
					username: this.username,
					fontsize:_obj.fsize,
					color:_obj.color,
					content: content,
					fileflag:_obj.fileflag,
					file:_obj.file
				};
				this.socket.emit('message', obj);
				d.getElementById("content").value = '';
			}
			return false;
		},
		genUid:function(){
			return new Date().getTime()+""+Math.floor(Math.random()*899+100);
		},
		//更新系统消息，本例中在用户加入、退出的时候调用
		updateSysMsg:function(o, action){
			//当前在线用户列表
			var onlineUsers = o.onlineUsers;
			//当前在线人数
			var onlineCount = o.onlineCount;
			//新加入用户的信息
			var user = o.user;
				
			//更新在线人数
			var userhtml = '';
			var separator = '';
			for(key in onlineUsers) {
		        if(onlineUsers.hasOwnProperty(key)){
					userhtml += "<li>"+onlineUsers[key]+"</li>";
				}
		    }
			// d.getElementById("onlinecount").innerHTML = '当前共有 '+onlineCount+' 人在线，在线列表：'+userhtml;
			d.getElementById("onlinecount").innerHTML = userhtml;
			//添加系统消息
			var html = '';
			html += '<div class="msg-system">';
			html += user.username;
			html += (action == 'login') ? '加入聊天' : ' 退出了聊天室';
			html += '</div>';
			var section = d.createElement('section');
			section.className = 'system J-mjrlinkWrap J-cutMsg';
			section.innerHTML = html;
			// d.getElementById("upstate").innerHTML = html;
			this.msgObj.appendChild(section);	
			this.scrollToBottom();
		},
		//第一个界面用户提交用户名
		usernameSubmit:function(){
			var username = d.getElementById("username").value;
			if(username != ""){
				d.getElementById("username").value = '';
				d.getElementById("loginbox").style.display = 'none';
				d.getElementById("chatbox").style.display = 'block';
				this.init(username);
			}
			return false;
		},
		init:function(username){
			/*
			客户端根据时间和随机数生成uid,这样使得聊天室用户名称可以重复。
			实际项目中，如果是需要用户登录，那么直接采用用户的uid来做标识就可以
			*/
			this.userid = this.genUid();
			this.username = username;
			 d.getElementById("showusername").innerHTML='<li>'+this.username+'</li>';

			this.msgObj.style.minHeight = (this.screenheight - db.clientHeight + this.msgObj.clientHeight) + "px";
			this.scrollToBottom();
			
			//连接websocket后端服务器
			// this.socket = io.connect('ws://realtime.plhwin.com:3000');
			this.socket = io.connect('http://localhost:3000');

			//告诉服务器端有用户登录
			this.socket.emit('login', {userid:this.userid, username:this.username});
			
			//监听新用户登录
			this.socket.on('login', function(o){
				CHAT.updateSysMsg(o, 'login');	
			});
			
			//监听用户退出
			this.socket.on('logout', function(o){
				CHAT.updateSysMsg(o, 'logout');
			});
			
			//监听消息发送
			this.socket.on('message', function(obj){
				var time = new Date();
				var nowtime = time.getHours()+":"+time.getMinutes()+":"+time.getSeconds();
				console.log("nowtime",nowtime);
				var isme = (obj.userid == CHAT.userid) ? true : false;
				var usernameDiv = '<div>'+obj.username+" "+nowtime+'</div>';
				if(obj.fileflag)
				{
				var contentDiv = '<div><img src='+obj.file+' /></div>';	
				}
				else
				{
				var contentDiv = '<div>'+_showEmoji(obj.content)+'</div>';
				}
				
				var section = d.createElement('section');
				if(isme){
					section.className = 'user';
					section.innerHTML = contentDiv + usernameDiv;
				} else {
					section.className = 'service';
					section.innerHTML = usernameDiv + contentDiv;
				}
				section.style.fontSize = obj.fontsize;
				section.style.color = obj.color;
				CHAT.msgObj.appendChild(section);
				CHAT.scrollToBottom();

				function _showEmoji(msg) {
				    var match, result = msg,
				        reg = /\[emoji:\d+\]/g,
				        emojiIndex,
				        totalEmojiNum = document.getElementById('emojiWrapper').children.length;
				    while (match = reg.exec(msg)) {
				        emojiIndex = match[0].slice(7, -1);
				        if (emojiIndex > totalEmojiNum) {
				            result = result.replace(match[0], '[X]');
				        } else {
				            result = result.replace(match[0], '<img class="emoji" src="emo/' + emojiIndex + '.png" />');
				        };
				    };
				    return result;
				}	
			});
			this._initialEmoji();
			 document.getElementById('emoji').addEventListener('click', function(e) {
			     var emojiwrapper = document.getElementById('emojiWrapper');
			     emojiwrapper.style.display = 'block';
			     e.stopPropagation();
			 }, false);
			 document.body.addEventListener('click', function(e) {
			     var emojiwrapper = document.getElementById('emojiWrapper');
			     if (e.target != emojiwrapper) {
			         emojiwrapper.style.display = 'none';
			     }
			 });

		},
		_initialEmoji: function() {
	    var emojiContainer = document.getElementById('emojiWrapper'),
	        docFragment = document.createDocumentFragment();
	    for (var i = 4; i >0; i--) {
	        var emojiItem = document.createElement('img');
	        emojiItem.src = 'emo/' + i + '.png';
	        emojiItem.title = i;
	        docFragment.appendChild(emojiItem);
	    }
	    emojiContainer.appendChild(docFragment);
	},
	
	};
	//通过“回车”提交用户名
	d.getElementById("username").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			CHAT.usernameSubmit();
		}
	};
	//通过“回车”提交信息
	var user_set = {
		fsize :"",
		color:"",
		fileflag:false
	};
	d.getElementById("content").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			user_set.fsize = "45px";
			user_set.color = "#08af67";
			CHAT.submit(user_set);
		}
	};
	//通过点击发送消息
	d.getElementById("mjr_send").addEventListener("click",function(){
		user_set.fsize = "0.48rem";
		user_set.color = d.getElementById("colorStyle").value;
		CHAT.submit(user_set);
	}); 
	d.getElementById("get_image").addEventListener("change",function(){
		user_set.fileflag = true;
		var reader = new FileReader();
		reader.readAsDataURL(this.files[0]);
		reader.onload = function(e) {
            //读取成功，显示到页面并发送到服务器
             this.value = '';
              user_set.file = e.target.result;
              console.log("base64",e.target.result);
              console.log("data",user_set);
              CHAT.submit(user_set);
              user_set.fileflag = false;
         };
	});

	d.getElementById('emojiWrapper').addEventListener('click', function(e) {
    //获取被点击的表情
    var target = e.target;
    if (target.nodeName.toLowerCase() == 'img') {
        var messageInput = d.getElementById('emoji');
        // messageInput.focus();
        messageInput.setAttribute("data-value",messageInput.getAttribute("data-value") + '[emoji:' + target.title + ']');
    };
}, false);

})();