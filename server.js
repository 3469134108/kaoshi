const http=require("http");
const fs=require("fs");
const url=require("url");
const lf=require("./loginFunctions.js");
const cookie=require("cookie");
const qs=require("querystring");
const formidable=require("formidable");
const util=require("util");

var sessions=new Object();
//记录着所有session的变量

console.log("读取配置中……");
var config;
try {
	config=fs.readFileSync("config.json",{encoding:"utf-8"});
	config=JSON.parse(config);
} catch(err){
	console.error("无法解析config.json");
	console.error(err.message);
	return 1;
}
//从config.json中读取配置

console.log("检查配置中……");
const configCheckList=["Port"];//配置属性检查列表
var propertyLost=[];
configCheckList.forEach((property)=>{
	if(!config.hasOwnProperty(property)){
		propertyLost.push(property);
	}
});
if(propertyLost.length!=0){
	console.error("找不到这些属性:");
	console.error(JSON.stringify(propertyLost));
	return 1;
}
//检查是否有配置属性缺失

const configPropertyDefault={
	SaltDigits:6,
	SessionIdDigits:60,
	SessionLifeMs:20000,
	ImageTempStorePath:"./temp"
}
Object.keys(configPropertyDefault).forEach((property)=>{
	if(!config.hasOwnProperty(property)){
		config[property]=configPropertyDefault[property];
	}
});
//补充默认的配置

function returnMainPage(req,res){
	var mainPageFile="./questionEditor2.html";
	fs.access(mainPageFile,fs.constants.R_OK,(err)=>{
		if(err){return404(req,res);console.error(`找不到主页${mainPageFile}`);return 1};
		
		fs.readFile(mainPageFile,(err,data)=>{
			res.setHeader("Content-Type","text/html");
			res.setHeader("Content-Length",data.length);
			res.writeHead(200);
			res.end(data);
		});
	})
}

function return404(req,res,content="这里什么都没有"){
	var sendString=content;
	var sendBuffer=Buffer.from(sendString);
	res.setHeader("Content-Type","text/plain; charset=utf-8");
	res.setHeader("Content-Length",sendBuffer.length);
	res.writeHead(404);
	res.end(sendBuffer);
}

function returnJavascripts(req,res,pathname){
	pathname=`.${pathname}`;
	fs.access(pathname,fs.constants.R_OK,(err)=>{
		if(err){return404(req,res);return;}
		
		var imageType=pathname.split(".").pop();
		fs.readFile(pathname,(err,data)=>{
			res.setHeader("Content-Type","text/javascript; charset=utf-8");
			res.setHeader("Content-Length",data.length);
			res.writeHead(200);
			res.end(data);
		});
	});
}

function returnImage(req,res,pathname){
	pathname=`.${pathname}`;
	fs.access(pathname,fs.constants.R_OK,(err)=>{
		if(err){return404(req,res);return;}
		
		var imageType=pathname.split(".").pop();
		imageType=`image/${imageType}`;
		fs.readFile(pathname,(err,data)=>{
			res.setHeader("Content-Type",imageType);
			res.setHeader("Content-Length",data.length);
			res.writeHead(200);
			res.end(data);
		});
	});
}

function deleteSession(ssId){
	delete sessions[ssId];
	console.log(`已删除SessionId: ${ssId}`);
}

function returnSalt(req,res){
	var salt=lf.generateSalt(config["SaltDigits"]);
	var ssId=lf.generateSessionId(config["SessionIdDigits"]);
	var sendJson=JSON.stringify({salt});
	var sendBuffer=Buffer.from(sendJson);
	var maxAge=config["SessionLifeMs"]/1000;
	res.setHeader("Content-Type","application/json; charset=utf-8");
	res.setHeader("Content-Length",sendBuffer.length);
	res.setHeader("Set-Cookie",[cookie.serialize("ssId",ssId,{maxAge})]);
	res.writeHead(200);
	res.end(sendBuffer);
	sessions[ssId]="salt";
	setTimeout(deleteSession,config["SessionLifeMs"],ssId);
}

function returnOK(req,res){
	var sendBuffer=Buffer.from("OK");
	res.setHeader("Content-Type","text/plain");
	res.setHeader("Content-Length",sendBuffer.length);
	res.writeHead(200);
	res.end(sendBuffer);
}

function handleAPI(req,res,pathname){
	switch(pathname.split("/")[2]){
		case "salt":
			returnSalt(req,res);
			break;
		case "login":
			returnOK(req,res);
			break;
		default:
			return404(req,res);
			break;
	}
}

function handleUpload(req,res,pathname){
	switch(pathname.split("/")[2]){
		case "image":
			handleImageUpload(req,res);
			break;
		default:
			return404(req,res);
			break;
		}
}

function handleImageUpload(req,res){
	var form=formidable.IncomingForm();
	form.uploadDir=config["ImageTempStorePath"];
	form.parse(req,(err,fields,files)=>{
		console.log(util.inspect(files));
		console.log(`		FileUpload	${files["imageToUpload"].name}`);
		console.log(`		FileStored	${files["imageToUpload"].path}`);
		console.log(`		FileType	${files["imageToUpload"].type}`);
		var imageUrl=files["imageToUpload"].path;
		var sendJson={imageUrl};
		var sendBuffer=Buffer.from(JSON.stringify(sendJson));
		res.setHeader("Content-Type","application/json");
		res.setHeader("Content-Length",sendBuffer.length);
		res.writeHead(200);
		res.end(sendBuffer);
	});
}

function mainHttpHandler(req,res){
	var reqHost=req.headers["host"]||req.headers["Host"];
	var reqRemoteIp=req.socket.remoteAddress;
	var reqRemotePort=req.socket.remotePort;
	var reqLocalIp=req.socket.localAddress;
	var reqLocalPort=req.socket.localPort;
	console.log(`${new Date()}`);
	console.log(`	Remote	${reqRemoteIp}:${reqRemotePort}`);
	console.log(`	Local	${reqLocalIp}:${reqLocalPort}`);
	if(reqHost)console.log(`	Host	${reqHost}`);
	console.log(`	Path	${req.url}`);
	if(req.headers["cookie"])
		console.log(`	Cookie	${JSON.stringify(req.headers["cookie"])}`);
	//记录访问
	
	var reqPathname=url.parse(req.url).pathname;
	switch(reqPathname.split("/")[1]){
		case "images":
			returnImage(req,res,reqPathname);
			break;
		case "javascripts":
			returnJavascripts(req,res,reqPathname);
			break;
		case "api":
			handleAPI(req,res,reqPathname);
			break;
		case "upload":
			handleUpload(req,res,reqPathname);
			break;
		case "":
			returnMainPage(req,res);
			break;
		default:
			return404(req,res);
			break;
	}
}

var mainHttpServer=http.createServer(mainHttpHandler);
mainHttpServer.listen(config["Port"]);
console.log(`服务已在 ${config["Port"]} 端口启动`);
