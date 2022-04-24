/**
 * mpf.js
 * MultiPointFiller(ドロネー図形を作成するモジュール)
 * 作ってるときはそう呼んでて、後日正式名称(ドロネー図)を知った。
 */
let PITR = {};// クリックポイント、線分をスタック
const LAYER = "layer-mpf";
let clickpoint = () =>{
    /** クリックした箇所に円を描画 */
    let tcv = LAYER;
    let canvas = $("#"+tcv);
    if(!PITR[tcv]){
        PITR[tcv] = [];
    }
    $("#layer-receptor").on("click",function(e){
        if( $("#mpf").prop("checked") == false ){
            return false;
        }
        let rect = e.target.getBoundingClientRect();//クリックした所に円を描く
        x = parseInt(e.clientX - rect.left);
        y = parseInt(e.clientY - rect.top);
        PITR[tcv].push([x,y]);
        multipointFill(tcv);
    });
}
let evalDimension = (pt1, pt2, pv) => {
    /** pt1-pt2の線分に対してpvがどのdimensionにいるか判定 */
    const tilt = (pt2[1] - pt1[1]) / (pt2[0] - pt1[0]);
    const intercept = pt1[1] - (pt1[0] * tilt);
    return Math.sign( Number(pv[1] - (tilt * pv[0] + intercept) ) );
};
function lipa(roop = [], lipa = []){
    /** 
     * 交差しない線分ペアのリストを作成する
     * 継承クラスは主に線分交差判定処理
     */
    this._roop = roop;   
    this._lipa = lipa;// line pair = 線分リスト
}
lipa.prototype.evalClossLiner = function(pt1=[-1,-1], pt2=[-1,-1]){
    /** 線分交差判定　直線判定になってるので線分判定に変更する */
    let flag = true;
    const tilt2 = (pt2[1] - pt1[1]) / (pt2[0] - pt1[0]);
    const intercept2 = pt1[1] - (pt1[0] * tilt2);
    for(let i = 0; i < this._lipa.length;i++ ){
        //全ての線分(this._lipa)を対象に、pt1,pt2がどこにいるかを全探索する
        const pt3 = this._lipa[i][0];
        const pt4 = this._lipa[i][1];
        const diva1 = Math.sign( Number(pt1[1] - (this._lipa[i][2] * pt1[0] + this._lipa[i][3]) ) );
        const diva2 = Math.sign( Number(pt2[1] - (this._lipa[i][2] * pt2[0] + this._lipa[i][3]) ) );

        const diva3 = Math.sign( Number(pt3[1] - (tilt2 * pt3[0] + intercept2) ) );
        const diva4 = Math.sign( Number(pt4[1] - (tilt2 * pt4[0] + intercept2) ) );
        if( (diva1 == 0 && diva2 == 0 ) || ( diva3 == 0 && diva4 == 0 ) ){
            // 全部線の上=その線は登録済み
            flag = false;
            break;
        }
        if( (diva1 + diva2 == 0) && ( diva3 + diva4 == 0 ) ){
            // 2線の一次式にそれぞれ当てて、どちらも違う領域判定(diva+diva=0)ならば、交差している
            flag = false;
            break;
        }
        else{
            flag = true;
        }
    }
    return flag;
}
lipa.prototype.mostClosePoint = function(pv1 = -1, pv2 = -1, exp=false){
    /**  */
    if(pv1 < 0 || pv2 < 0){
        return -1;
    }
    let reach = 2147483646;
    let reachpoint = -1;
    const pivot1 = this._roop[pv1];
    const pivot2 = this._roop[pv2];
    for(let i = 0; i < this._roop.length; i++){
        const xy = this._roop[i];
        //基準点との距離を計算
        const dist = Math.pow(pivot1[0] - xy[0], 2) + Math.pow(pivot1[1] - xy[1], 2)
                   + Math.pow(pivot2[0] - xy[0], 2) + Math.pow(pivot2[1] - xy[1], 2);
        if(dist == 0 || i == pv1 || i == pv2){
            //距離がゼロか除外リストにある場合
            continue;
        }
        else if(exp !== false && evalDimension(this._roop[pv1], this._roop[pv2], xy) != exp){
            //対象点が検索方向と異なる(=pv1-pv2の線分よりも)
            continue;
        }
        else if( this.evalClossLiner(pivot1, xy) || this.evalClossLiner(pivot2, xy) ){
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
lipa.prototype.lipaStocker = function(pt1, pt2){
    /** lipa : [ [x1, y1], [x2, y2], tilt, intercept] */
    if(!pt1 || !pt2){
        return false;
    }
    else if(!this.evalClossLiner(pt1,pt2)){
        //線が交差している
        return false;
    }
    let flag = true;
    for(let i = 0; i < this._lipa.length; i++ ){
        let t = this._lipa[i][0];
        let s = this._lipa[i][1];
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
        this._lipa.push([pt1, pt2, tilt, intercept]);
    }
    return flag;
}
lipa.prototype.rcsLinePair = function(p1 = false, p2 = false, exp = false){
    /** 
     * 2点を引数とし、this._lipaリストから
     * 線分が交差せず、かつ最も面積の小さい三角形を作成できる点を探索する
     * 引数がない場合は最後に追加された2点を初期値とする
     * 再帰処理によってthis._lipaを探索する
     * exp = 探索方向(p1-p2線分を境界とした正負方向)
     * 　どちらも探して再帰する
     * 最終的に閉区間が三角形のみで構成された線分リストを返す
      */
    let pv1,pv2;
    if(p1 === false && p2 === false && exp == false){
        pv1 = this._roop.length-1;
        pv2 = this._roop.length-2;
    }
    else{
        pv1 = p1;
        pv2 = p2;
    }
    let pt0 =  this.mostClosePoint(pv1, pv2, exp);
    let pt1 = pv1;
    let pt2 = pv2;
    //console.log("srch",pt1,pt2,">>",pt0);
    if( pt0 >= 0 && pt1 >= 0 && this.lipaStocker(this._roop[pt0],this._roop[pt1])){
        const d = evalDimension(this._roop[pt0], this._roop[pt1], this._roop[pt2]);
        this.rcsLinePair(pt0, pt1, d);
        this.rcsLinePair(pt0, pt1, d*-1);
    }
    if( pt1 >= 0 && pt2 >= 0 && this.lipaStocker(this._roop[pt1],this._roop[pt2])){
        const d = evalDimension(this._roop[pt1], this._roop[pt2], this._roop[pt0]);
        this.rcsLinePair(pt1, pt2, d);
        this.rcsLinePair(pt1, pt2, d*-1);
    }
    if( pt2 >= 0 && pt0 >= 0 && this.lipaStocker(this._roop[pt2],this._roop[pt0])){
        const d = evalDimension(this._roop[pt2], this._roop[pt0], this._roop[pt1]);
        this.rcsLinePair(pt2, pt0, d);
        this.rcsLinePair(pt2, pt0, d*-1);
    }
    return this._lipa;
};
function tril(){
    /** 三角形[pt1, pt2, pt3]リスト構造体 */
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
let multipointFill = (tcv) =>{
    /**
     * PTIRに格納されている多点からドロネー図を作成する
     * tcv  : mpf.js固有のキー(="layer-mpf")
     * roop : 多点リスト
     */
    //let roop = PITR[tcv].map( list => ([...list]));
    const roop = PITR[tcv];

    let canvas = $("#"+LAYER)[0];
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.strokeStyle = 'rgb(255, 0, 0)';
    ctx.fillStyle = 'rgba(255, 0, 0)';
    for(let i = 0; i< roop.length; i++){
        ctx.beginPath();
        ctx.arc(roop[i][0], roop[i][1], 3, 0, Math.PI*2);
        ctx.stroke();
    }
    if(roop.length < 3) return;

    let lip = new lipa(roop);
    let linepair = lip.rcsLinePair();

    //作成したLine Pairを全検索して三角形を作れるだけ作る
    let tri = new tril();//三角形リスト
    for(let i = 0; i < linepair.length; i++){
        const plipa1 = linepair[i][0];//[x1,y1]
        const plipa2 = linepair[i][1];//[x2,y2]
        let llipa1 = [];//plipa1と接続している線のリスト
        let llipa2 = [];//plipa2と接続している線のリスト
        for(let j = i + 1; j < linepair.length; j++){
            //点plipa1を端にもつ線を抽出
            if( evalList(plipa1, linepair[j][0]) || evalList(plipa1, linepair[j][1]) ){
                llipa1.push( [linepair[j][0],linepair[j][1]] );
            }
            //点plipa2を端にもつ線を抽出
            if( evalList(plipa2, linepair[j][0]) || evalList(plipa2, linepair[j][1]) ){
                llipa2.push( [linepair[j][0],linepair[j][1]] );
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
    //描く
    ctx.strokeStyle = 'rgb(255, 0, 0)';
    ctx.fillStyle = "rgb(0, 255, 0)";
    ctx.globalCompositeOperation = "source-over";
    for(let i = 0; i < tri.put(); i++){
        const triangle = tri.put(i);
        ctx.beginPath();
        ctx.moveTo(triangle[0][0],triangle[0][1]);
        ctx.lineTo(triangle[1][0],triangle[1][1]);
        ctx.lineTo(triangle[2][0],triangle[2][1]);
        ctx.closePath();
        ctx.fill();
    }
    ctx.stroke();
    for(let i = 0; i< linepair.length; i++){
        ctx.beginPath();
        ctx.moveTo(linepair[i][0][0],linepair[i][0][1]);
        ctx.lineTo(linepair[i][1][0],linepair[i][1][1]);
        ctx.stroke();
    }
    return true;
}

$(function(){
    clickpoint();
});
    
