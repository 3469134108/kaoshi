idCharSet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function generateSessionId(len){
	var ans="";
	for(let i=0;i<len;i++){
		ans+=idCharSet[Math.floor(Math.random()*idCharSet.length)];
	}
	return ans;
}

saltCharSet="0123456789";
function generateSalt(len){
	len=Number(len);
	var ans="";
	for(let i=0;i<len;i++){
		ans+=saltCharSet[Math.floor(Math.random()*saltCharSet.length)];
	}
	return ans;
}

var M=99999989;
function hashString(s){
	var ans=0;
	var base=1;
	for(let i=0;i<s.length;i++){
		ans=(ans+((((i+1)*s.charCodeAt(i))%M)*base)%M)%M;
		base=(base<<30)%M;
	}
	if(ans<0)ans=(ans+M)%M;
	return ans;
}

function addSaltAndHash(s,salt){
	s=String(s);
	salt=String(salt);
	var ans="";
	for(let i=0;i<salt.length;i++){
		ans+=s[i]+salt[i];
	}
	ans+=s.substr(salt.length);
	ans=hashString(ans);
	return ans;
}

module.exports={
	generateSessionId:generateSessionId,
	generateSalt:generateSalt,
	hashString:hashString,
	addSaltAndHash:addSaltAndHash,
}