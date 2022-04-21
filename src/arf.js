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
let fastEnchantmentAlpha = (img, th=0, ms = [0,255,0]) =>{
    /** forよりwhileの方が高速にループ処理出来るとかできないとか
     *  x = (x+1)｜0
     * かつて高速と謳われたインクリメント方法…++の方が今は早いらしい
     */
    let i = 0;
    let j = 0;
    const row = img.rows;
    const col = img.cols;
    let inter = new cv.Mat(row, col, cv.CV_8UC4);

    while(i < row){
        j = 0;
        while(j < col){
            if( img.ucharPtr(i,j)[0] != th ){ // 0でない = 黒領域 = 緑に塗りつぶす
                insertRGBA(inter, j, i, [ms[0], ms[1], ms[2], 255]);
            }
            j++;
        }
        i++;
    }
    return inter;
};
function arf(){
    this._img = null;
    this.rows = 0;
    this.cols = 0;
    this._imd = null;
};
arf.prototype.loadimg = function(callback = function(){}){
    load_image( (r,e) => {
        this._img = cv.imread("img-canvas");
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
        [osr(pixel[0],+os),  osr(pixel[1],+os),  osr(pixel[2],+os),  osr(pixel[3],0)]);
    cv.inRange(this._img, low, high, this._imd)
};
arf.prototype.closedRegionFiller = function(x = 0, y = 0){
    /**
     * 座標点が白なら上下左右にシフトして再帰的に塗りつぶしを実施
     * 最終的に座標点から閉領域のみを塗りつぶしたイメージが出来上がる。
     */
    const killEval = (row, col) => {
        if( this._imd.ucharPtr(row, col)[0] !== 255 ){
            console.log("killed by colorRegion",this._imd.ucharPtr(row, col)[0]);
            return false;
        } else if( 0 > row || 0 > col || this.rows <= row || this.cols <= col){
            console.log("killed by out of range");
            return false;
        } else{
            return true;
        }
    };
    let rImg = new cv.Mat(this.rows, this.cols, cv.CV_8UC4);
    let col = x;
    let row = y;
    let killSignalY, killSignalX = true;
    let leftSearchPoints,rightSeachPoints = [];
    for(let i = 0; i < 2; i++){
        row = y;
        killSignalY = true;
        while(killSignalY){
            insertRGBA(rImg, col, row);
            row++;
            killSignalY = killEval(row, col);
        }
        killSignalY = true;
        while(killSignalY){
            insertRGBA(rImg, col, row);
            row--;
            killSignalY = killEval(row, col);
        }
        col++;
    }
    return rImg;
};
arf.prototype.lineDetector = function(x = false,y = false, th = 3){
    this.loadimg( (r,e) => {
        console.log(x,y,th);
        let pixel = [];
        if(x && y){
            pixel = this._img.ucharPtr(y, x);
            const RGBA = "rgba("+Number(pixel[0])+","+Number(pixel[1])+","+Number(pixel[2])+","+Number(pixel[3])+")";
            $("#arf-color-palette").css("background-color",RGBA);
        }
        else{
            let color = $("#arf-color-palette").css("background-color");;
            let p = color.match(/\d+/g);
            pixel = p.map( str => parseInt(str, 10) );
            pixel.push(255);// add alpha
        }
        //二値化 -> this._imd
        this.binarization(pixel);
        //x,y座標値の閉空間以外を削除
        const sugukesu = this.closedRegionFiller(x, y);
        cv.imshow("layer-arf", sugukesu);
        /**
        // 指定値分ボアアップする
        cv.dilate(this._imd, this._imd, cv.Mat.ones(th, th, cv.CV_8U), new cv.Point(-1, -1), 1);
        // 黒い部分は緑に、それ以外は透明に書き換える。
        let isr = fastEnchantmentAlpha(this._imd);
        cv.imshow("layer-arf", isr);
         */
    });
};
$(function(){
    $("#"+ARF+"-param").on("click",function(e){
        const th = Number( $(this).val() );
        setTimeout(()=>{
            ar.lineDetector(false,false, th);
        },5);
    });

    let ar = new arf("img-canvas");
    $("#layer-receptor").on("click",function(e){
        if( $("#"+ARF).prop("checked") == false || $("#"+ARF+"-dropper").prop("checked") == false ){
            return false;
        }
        let rect = e.target.getBoundingClientRect();
        x = parseInt(e.clientX - rect.left);
        y = parseInt(e.clientY - rect.top);
        setTimeout(()=>{
            const th = Number( $("#"+ARF+"-param").val() );
            ar.lineDetector(x, y, th);
        },5);
    });
});