let PITR = {};
let LIPA = [];
let clickpoint = () =>{
    let tcv = "layer-canvas";
    let canvas = $("#"+tcv);
    if(!PITR[tcv]){
        PITR[tcv] = [];
    }
    $("#layer-receptor").on("click",function(e){
        let ctx = canvas[0].getContext("2d");
        //クリックした所に円を描く
        let rect = e.target.getBoundingClientRect();
        x = parseInt(e.clientX - rect.left);
        y = parseInt(e.clientY - rect.top);
        //描く
        ctx.strokeStyle = 'rgb(0, 255, 0)';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI*2);
        ctx.stroke();
        PITR[tcv].push([x,y]);
        multipointFill(tcv, PITR[tcv].length - 1);
    });
}
let evalList = (lst1, lst2) => {
    ret = true;
    if(lst1.length != lst2.length){
        ret = false;
    }
    else{
        for(let i = 0; i < lst1.length; i++){
            if(lst1[i] != lst2[i]){
                ret = false;
                break;
            }
        }
    }
    return ret;
}
let evalClossLiner = (pt1=[-1,-1], pt2=[-1,-1]) => {
    let flag = true;
    //線分交差判定　直線判定になってるので線分判定に変更する
    for(let i = 0; i < LIPA.length;i++ ){
        const pt3 = LIPA[i][0];
        const pt4 = LIPA[i][1];
        const tilt1 = LIPA[i][2];
        const intercept1 = LIPA[i][3];
        const diva1 = Math.sign( pt1[1] - (tilt1 * pt1[0] + intercept1) );
        const diva2 = Math.sign( pt2[1] - (tilt1 * pt2[0] + intercept1) );

        const tilt2 = (pt2[1] - pt1[1]) / (pt2[0] - pt1[0]);
        const intercept2 = pt1[1] - (pt1[0] * tilt2);
        const diva3 = Math.sign( pt3[1] - (tilt2 * pt3[0] + intercept2) );
        const diva4 = Math.sign( pt4[1] - (tilt2 * pt4[0] + intercept2) );
        if(diva1 == 0 && diva2 == 0 && diva3 == 0 && diva4 == 0){
            //全部線の上=その線は登録済み
            flag = true;
            break;
        }
        if( (diva1 + diva2 == 0) && ( diva3 + diva4 == 0 ) ){
            //2線の一時式にそれぞれ当てて、どちらも違領域判定(diva+diva=0)ならば、交差している
            //交差してる
            flag = false;
            break;
        }
        else{
            flag = true;
        }
    }
    return flag;
}
let mostClosePoint = (pv = -1, roop = [[0,0]], exc = []) =>{
    let reach = 2147483646;
    let reachpoint = -1;
    const pivot = roop[pv];
    for(let i = 0; i < roop.length; i++){
        const xy = roop[i];
        //基準点との距離を計算
        const dist =  Math.pow(pivot[0] - xy[0], 2) + Math.pow(pivot[1] - xy[1], 2);
        if(dist == 0 || exc.indexOf(i) != -1){
            //距離がゼロか除外リストにある場合
            continue;
        }
        else if( evalClossLiner(pivot, xy) ){
            //線は交差していなくて
            if( reach > dist ){
                //初回か、距離が更新されているなら
                reach = dist;
                reachpoint = i;    
            }
        }
    }
    return reachpoint;
}
let lipaStocker = (pt1, pt2) => {
    //lipa : [ [x1, y1], [x2, y2], tilt, intercept]
    if(!pt1 || !pt2){
        return false;
    }
    else if(!evalClossLiner(pt1,pt2)){
        //線が交差している
        //return false;
    }
    let flag = true;
    for(let i = 0; i < LIPA.length; i++ ){
        let t = LIPA[i][0];
        let s = LIPA[i][1];
        if( ( t[0] == pt1[0] && t[1] == pt1[1] && s[0] == pt2[0] && s[1] == pt2[1] ) ||
            ( s[0] == pt1[0] && s[1] == pt1[1] && t[0] == pt2[0] && t[1] == pt2[1] ) ){
            //既に線ペアが存在する
            flag = false;
            break;
        }
    }
    if(flag == true){
        const tilt = (pt2[1] - pt1[1]) / (pt2[0] - pt1[0]);
        const intercept = pt1[1] - (pt1[0] * tilt);
        LIPA.push([pt1, pt2, tilt, intercept]);
    }
    return flag;
}
function tril(){
    this._tril = [];
};
tril.prototype.clear = function(){
    this._tril = [];
}
tril.prototype.stocker = function(pt1, pt2, pt3){
    //tril : [[x1, y1],[x2,y2],[x3,y3]]
    if(!pt1 || !pt2 || !pt3){
        return false;
    }
    let flag = true;
    for(let i = 0; i < this._tril.length; i++ ){
        //三角形の数だけfor
        let iflag = false;
        for(let j = 0; j < this._tril[i].length; j++ ){
            //三点それぞれ巡回
            const t = this._tril[i][j];//三角形を構成する点[x1,y1]
            if( !evalList(t, pt1) && !evalList(t, pt2) && !evalList(t, pt3) ){
                //引数3点がアンマッチ=新しい三角形候補
                iflag = true;
                break;
            }
        }
        //三点すべてマッチしてるならiflagはfalseとなる
        flag = iflag;
        if(flag == false){
            //その三角形とマッチ=登録済み=探索終了
            break;
        }
    }
    if(flag == true){
        this._tril.push([pt1,pt2,pt3]);
    }
    return flag;
}
tril.prototype.put = function(i = -1){
    if(i < 0){
        return this._tril.length;
    }
    else if(i > this._tril.length){
        return false;
    }
    else{
        return this._tril[i];
    }
}
let multipointFill = (tcv, pv1 = -1, pv2 = -1) =>{
    let pt0 = pv1;//1点目はピボット
    let pt1 = -1;
    let pt2 = -1;
    let roop = PITR[tcv].map( list => ([...list]));
    //最後に入れた点
    if(roop.length < 3){
        //3点以下は計算しない
        return false;
    }
    //2点目を探索 引数2点は除外
    pt1 = mostClosePoint(pv1, roop, [pv1,pv2]);
    if(pv2 < 0){
        //pv1のみが渡されていた場合は追加で1点、計2点を探して三角形を作る
        pt2 = mostClosePoint(pv1, roop, [pv1,pt1]);
    }
    else{
        //pv2が指定されている場合はそれで3点完成
        pt2 = pv2;
    }
    if(pt0 == -1 || pt1 == -1 || pt2 == -1){
        //点が見つからなかったら描画終了
        return false;
    }
    else{
        //立　教　ト　ラ　イ　ア　ン　グ　ル
        if(lipaStocker(roop[pt0],roop[pt1])){
            multipointFill(tcv, pt0, pt1);
        }
        if(lipaStocker(roop[pt1],roop[pt2])){
            multipointFill(tcv, pt1, pt2);
        }
        if(lipaStocker(roop[pt2],roop[pt0])){
            multipointFill(tcv, pt2, pt0);
        }
        //作成したLine Pairを全検索して三角形を作れるだけ作る
        let tri = new tril();//三角形リスト
        for(let i = 0; i < LIPA.length; i++){
            const plipa1 = LIPA[i][0];//[x1,y1]
            const plipa2 = LIPA[i][1];//[x2,y2]
            let llipa1 = [];//plipa1と接続している線のリスト
            let llipa2 = [];//plipa2と接続している線のリスト
            for(let j = i + 1; j < LIPA.length; j++){
                //点plipa1を端にもつ線を抽出
                if( evalList(plipa1, LIPA[j][0]) || evalList(plipa1, LIPA[j][1]) ){
                    llipa1.push( [LIPA[j][0],LIPA[j][1]] );
                }
                //点plipa2を端にもつ線を抽出
                if( evalList(plipa2, LIPA[j][0]) || evalList(plipa2, LIPA[j][1]) ){
                    llipa2.push( [LIPA[j][0],LIPA[j][1]] );
                }
            }
            for(let t = 0; t < llipa1.length; t++ ){
                //3点目の候補　この点がllipa2にも含まれていれば三角形が作れる
                const trip1 = evalList(plipa1, llipa1[t][0]) ? llipa1[t][1] : llipa1[t][0];
                for(let s = 0; s < llipa2.length; s++ ){
                    const trip2 = evalList(plipa2, llipa2[s][0]) ? llipa2[s][1] : llipa2[s][0];
                    if( evalList(trip1, trip2) ){
                        //plipa1 - trip1(trip2)の線とplipa2 - trip1(trip2)の線が見つかった
                        tri.stocker(plipa1,plipa2,trip1);
                    }
                }
            }
        }
        let canvas = $("#layer-filler")[0];
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0,0,canvas.width, canvas.height);
        ctx.strokeStyle = 'rgb(255, 0, 0)';
        ctx.fillStyle = "rgb(0, 255, 0)";
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        for(let i = 0; i < tri.put(); i++){
            const triangle = tri.put(i);
            ctx.moveTo(triangle[0][0],triangle[0][1]);
            ctx.lineTo(triangle[1][0],triangle[1][1]);
            ctx.lineTo(triangle[2][0],triangle[2][1]);
            //ctx.lineTo(triangle[0][0],triangle[0][1]);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }        
        return true;
    }
}

$(function(){
    clickpoint();
});
    
