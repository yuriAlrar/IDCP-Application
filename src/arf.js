const ARF = "arf";
let osr = (i, offset=-128)=>{
    const v = (i + offset < 0) ? 0 : (i + offset > 255) ? 255 : i + offset;
    return v;
};
let fastEnchantmentAppha = (img, th=0, ms = [0,255,0]) =>{
    let i = 0;
    let j = 0;
    const row = img.rows;
    const col = img.cols;
    let inter = new cv.Mat(row, col, cv.CV_8UC4);

    while(i < row){
        j = 0;
        while(j < col){
            if( img.ucharPtr(i,j)[0] != th ){
                inter.ucharPtr(i,j)[0] = ms[0];
                inter.ucharPtr(i,j)[1] = ms[1];
                inter.ucharPtr(i,j)[2] = ms[2];
                inter.ucharPtr(i,j)[3] = 255;
            }
            j=(j+1)|0;
        }
        i=(i+1)|0;
    }
    return inter;
};
function arf(){
    this._img = null;
    this._imd = null;
};
arf.prototype.loadimg = function(callback = function(){}){
    load_image( (r,e) => {
        this._img = cv.imread("img-canvas");
        callback(r,e);
    });
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
            pixel.push(255);
        }
        console.log(pixel);

        this._imd  = new cv.Mat(this._img.rows, this._img.cols, cv.CV_8UC4);
        let mask = new cv.Mat(this._img.rows, this._img.cols, cv.CV_8UC4);
        const os = 24;
        let low =  new cv.Mat(this._imd.rows, this._imd.cols, this._imd.type(),
            [osr(pixel[0],-os), osr(pixel[1],-os), osr(pixel[2],-os), osr(pixel[3],0)]);
        let high = new cv.Mat(this._imd.rows, this._imd.cols, this._imd.type(),
            [osr(pixel[0],+os),  osr(pixel[1],+os),  osr(pixel[2],+os),  osr(pixel[3],0)]);
        cv.inRange(this._img, low, high, this._imd)//マスクを作成
        cv.imshow("layer-arf", mask);

        cv.dilate(this._imd, this._imd, cv.Mat.ones(th, th, cv.CV_8U), new cv.Point(-1, -1), 1);
        let isr = fastEnchantmentAppha(this._imd);
        cv.imshow("layer-arf", isr);
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