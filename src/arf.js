const ARF = "arf";
let osr = (i, offset=-128)=>{
    const v = (i + offset < 0) ? 0 : (i + offset > 255) ? 255 : i + offset;
    return v;
};
let insertRGBA = (img, x, y, rgba = [0, 255, 0, 255]) =>{
    img.ucharPtr(y, x)[0] = rgba[0];
    img.ucharPtr(y, x)[1] = rgba[1];
    img.ucharPtr(y, x)[2] = rgba[2];
    img.ucharPtr(y, x)[3] = rgba[3];
    return img;
};
function arf(){
    this._img = null;// original
    this._imd = null;// binalized
    this._crl = null;// filled
    this.rows = 0;
    this.cols = 0;
    this.closedRegionLines = [];
    this.pushHistory = [];
    this.loadimg();
};
arf.prototype.loadimg = function(callback = function(){}){
    /** 既知の不具合
     * メモリリークを引き起こしている可能性
     * this._imgのdeleteを都度しないとout of memoryが発生している？
     */
    load_image( (r,e) => {
        this._img = cv.imread("img-canvas");
        this._imd = null;
        this._crl = null;
        this.closedRegionLines = [];
        this.rows = this._img.rows;
        this.cols = this._img.cols;
        callback(r,e);
    });
};
arf.prototype.binarization = function(pixel = [0, 0, 0, 0], os = 24){
    /** pixel色を基準にthis._imdをRGBAの±osの間で2値化する */
    this._imd  = new cv.Mat(this.rows, this.cols, cv.CV_8UC4);
    let low =  new cv.Mat(this.rows, this.cols, this._imd.type(),
        [osr(pixel[0],-os), osr(pixel[1],-os), osr(pixel[2],-os), osr(pixel[3],0)]);
    let high = new cv.Mat(this.rows, this.cols, this._imd.type(),
        [osr(pixel[0],+os),  osr(pixel[1],+os), osr(pixel[2],+os), osr(pixel[3],0)]);
    //cv.GaussianBlur(this._img, this._imd, new cv.Size(1, 1), 0, 0, cv.BORDER_DEFAULT);
    cv.inRange(this._img, low, high, this._imd);
};
arf.prototype.DrawClosedRegionLines = function(){
    const color = new cv.Scalar(0, 255, 0, 255);
    this._crl = new cv.Mat(this.rows, this.cols, cv.CV_8UC4);
    for(let i in this.closedRegionLines){
        cv.line(
            this._crl, 
            new cv.Point(this.closedRegionLines[i][0][0], this.closedRegionLines[i][0][1]), 
            new cv.Point(this.closedRegionLines[i][1][0], this.closedRegionLines[i][1][1]), 
            color
        );
    }
}
arf.prototype.closedRegionFiller = function(xy = []){
    /**
     * 座標点が白なら上下左右にシフトして再帰的に塗りつぶしを実施
     * 最終的に座標点から閉領域のみを塗りつぶしたイメージが出来上がる。
     */
    const killEval = (row, col) => {
        /** 探索の終了条件 */
        if( this._imd.ucharPtr(row, col)[0] !== 255 ){
            return false;
        } else if( 0 > row || 0 > col || this.rows <= row || this.cols <= col){
            return false;
        } else{
            return true;
        }
    };
    const expPointManager = (aps, row, col) =>{
        let adjacentPoint = aps;// eslint: no-param-reassign
        if(adjacentPoint.length === 0){
            /** 空ならば新規追加 */
            adjacentPoint.push( [col, row] );
        } else if(evalList(adjacentPoint[adjacentPoint.length - 1], [col, row], true)){
            /** 連続値は必要ないので、直前の座標と現在地の座標 - 1が同じならば置き換え */
            adjacentPoint[adjacentPoint.length - 1] = [col, row];
        } else{
            /** そうでなければ飛び地と判定し、座標を新規追加 */
            adjacentPoint.push( [col, row] );
        }
        return adjacentPoint;
    };
    const bExplorationY = (xy, symbol = 0) =>{
        /** X,YからY軸方向に探査し、その境界値(上下計2点)を返す */
        let [col, row] = [xy[0], xy[1]];
        let expResult = {
            "begin":[], "end":[],
            "beforePlus": [], "beforeMinus": [], "afterPlus": [], "afterMinus": [],
            "killFlag": false
        };
        while( killEval(row, col) ){
            /** x軸方向に左右ずつずらして。そのピクセルが閾値対象か判定、対象ならば次に探索するので座標を保持 */
            if( symbol >= 0 && killEval(row, col + 1) ){
                expResult.afterPlus = expPointManager(expResult.afterPlus, row, col + 1);
            }
            if( symbol <= 0 && killEval(row, col - 1) ){
                expResult.beforePlus = expPointManager(expResult.beforePlus, row, col - 1);
            }
            row++;
        }
        expResult.end = [col, row];
        row = xy[1];
        while( killEval(row, col) ){
            if( symbol >= 0 && killEval(row, col + 1) ){
                expResult.afterMinus = expPointManager(expResult.afterMinus, row, col + 1);
            }
            if( symbol <= 0 && killEval(row, col - 1) ){
                expResult.beforeMinus = expPointManager(expResult.beforeMinus, row, col - 1);
            }
            row--;
        }
        expResult.begin = [col, row];
        return expResult;
    };
    const recrusedExpLiner = (xy, depth = 0) => {
        let bExp = bExplorationY(xy);
        const uniqKey = bExp.begin.join("_") + "_" + bExp.end.join("_");
        if(this.closedRegionLines[uniqKey]){
            // 登録済みの線であれば探索終了
            return false;
        } else{
            this.closedRegionLines[uniqKey] = [bExp.begin, bExp.end];
            this.pushHistory[0].push([bExp.begin, bExp.end]);
        }
        for(let i in bExp.afterPlus){
            recrusedExpLiner( bExp.afterPlus[i], depth + 1 );
        }
        for(let i in bExp.afterMinus){
            recrusedExpLiner( bExp.afterMinus[i], depth + 1 );
        }
        for(let i in bExp.beforePlus){
            recrusedExpLiner( bExp.beforePlus[i], depth + 1 );
        }
        for(let i in bExp.beforeMinus){
            recrusedExpLiner( bExp.beforeMinus[i], depth + 1 );
        }
        if(depth > 3000){
            // 深度3000以上の再帰処理は打切り
            return false;
        }
        return true;
    };
    this.pushHistory.unshift([]);
    recrusedExpLiner(xy);
    this.DrawClosedRegionLines();
    return true;
};
arf.prototype.getAxisColor = function(x = false,y = false){
    const pixel = this._img.ucharPtr(y, x);
    const RGBA = "rgba("+Number(pixel[0])+","+Number(pixel[1])+","+Number(pixel[2])+","+Number(pixel[3])+")";
    return RGBA;
};
arf.prototype.clearCanvasArea = function(){
    // 一度描画する
    cv.imshow("layer-arf", new cv.Mat(this.rows, this.cols, cv.CV_8UC4));
    // その後にクリアする
    const canvas = $("#layer-arf")[0];
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};
arf.prototype.clearCRL = function(){
    try{
        this._img.delete();
        this._imd.delete();
        this._crl.delete();
    } catch{
        console.log("no match");
    }
    this.loadimg();
    this.clearCanvasArea();
};
arf.prototype.lineDetector = function(x = false,y = false, th = 3, colorThreshold = 24){
    console.log(th, colorThreshold);
    //基準色の取得
    let color = $("#arf-color-palette").css("background-color");;
    let p = color.match(/\d+/g);
    let pixel = p.map( str => parseInt(str, 10) );
    pixel.push(255);// add alpha
    //二値化 -> this._imd
    this.binarization(pixel, colorThreshold);
    if(x && y){
        //x,y座標値の閉空間を探索 -> this._crl
        this.closedRegionFiller([x, y]);
    } else{
        // スタックしている座標リストを使って描画 -> this._crl
        this.DrawClosedRegionLines();
    }
    if(this._crl){
        // 指定値分ボアアップする
        let finalCvs = new cv.Mat(this.rows, this.cols, cv.CV_8UC4);
        cv.dilate(this._crl, finalCvs, cv.Mat.ones(th, th, cv.CV_8U), new cv.Point(-1, -1), 1);
        //cv.imshow("layer-arf", this._imd);
        cv.imshow("layer-arf", finalCvs);
        this._imd.delete();
        this._crl.delete();
    } else{
        return false;
    }
    return true;
};
$(function(){
    let ar = new arf("img-canvas");
    $("#"+ARF+"-param").on("click",function(e){
        const th = Number( $(this).val() );
        setTimeout(()=>{
            ar.lineDetector(false, false, th);
        },5);
    });
    $("#"+ARF+"-clear").on("click",function(e){
        setTimeout(ar.clearCRL(), 5);
    });
    $("#layer-receptor").on("click",function(e){
        /* ischecked true  : spoit color & filler
                     false : filler
        */
        const modeState  = $("#"+ARF).prop("checked");
        const checkState = $("#"+ARF+"-dropper").prop("checked");
        let rect = e.target.getBoundingClientRect();
        x = parseInt(e.clientX - rect.left);
        y = parseInt(e.clientY - rect.top);
        if( modeState === false ){
            // 塗りつぶしモードが選択されていなかったら
            return false;
        } else if(checkState === true){
            // チェックが入っていたら色を更新する
            $("#arf-color-palette").css("background-color", ar.getAxisColor(x, y));
        }
        setTimeout(()=>{
            ar.lineDetector(x, y, Number($("#"+ARF+"-param").val()), Number($("#"+ARF+"-cThreshold").val()));
        },5);
    });
});