
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

function generateSalt(){
	return Math.floor(Math.random()*M);
}