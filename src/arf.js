const ARF = "arf";
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
arf.prototype.lineDetector = function(){
    this.loadimg( (r,e) => {
        let ESL = (roop,lst) => {
            for(let i = 0;i < roop.length; i++){
                if( ( roop[i][0] == lst[0] && roop[i][1] == lst[1] )
                 || ( roop[i][0] == lst[1] && roop[i][1] == lst[0] ) ){
                     return false;
                 }
            }
            return true;
        }
        let roop = []
        let lines = new cv.Mat();
        let dst = new cv.Mat(this._img.rows, this._img.cols, cv.CV_8UC4);
        /***
        let imd = new cv.Mat();
        // グレイスケール化
        cv.cvtColor(this._img, imd, cv.COLOR_RGBA2GRAY, 0);
        ***/
        // エッジ検出
        cv.Canny(this._imd, this._imd, 150, 200);
        //ハフ変換
        cv.HoughLinesP(this._imd, lines,1, Math.PI / 180, 2, 1, 0);
        for (let i = 0; i < lines.rows; ++i) {
            let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
            let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);
            cv.line(dst, startPoint, endPoint, new cv.Scalar(0, 255, 0, 255));
            let l1 = [startPoint["x"],startPoint["y"]];
            let l2 = [endPoint["x"]  ,endPoint["y"]  ];
            if(ESL(roop,l1)) roop.push( l1 );
            if(ESL(roop,l2)) roop.push( l2 );
        }    
        cv.imshow("layer-arf", dst);
        //cv.imshow("layer-arf", this._imd);
        //let lip = new lipa(roop);
        //let linepair = lip.rcsLinePair();
        console.log(roop);
        /***/
    });
};
$(function(){
    let ar = new arf("img-canvas");
    $("#"+ARF+"-draw").on("click", ()=>{
        if( $("#"+ARF).prop("checked") == true ){
            setTimeout(function(){
                ar.lineDetector();
            }, 5);
        }    
    });
    $("#layer-receptor").on("click",function(e){
        if( $("#"+ARF).prop("checked") == false || $("#"+ARF+"-dropper").prop("checked") == false ){
            return false;
        }
        //クリックした所に円を描く
        let rect = e.target.getBoundingClientRect();
        x = parseInt(e.clientX - rect.left);
        y = parseInt(e.clientY - rect.top);
        ar.loadimg(()=>{
            let osr = (i, offset=-128)=>{
                const v = (i + offset < 0) ? 0 : (i + offset > 255) ? 255 : i + offset;
                console.log(v);
                return v;
            };
            const pixel = ar._img.ucharPtr(y, x);
            const RGBA = "rgba("+Number(pixel[0])+","+Number(pixel[1])+","+Number(pixel[2])+","+Number(pixel[3])+")";
            $("#arf-color-palette").css("background-color",RGBA);

            ar._imd  = new cv.Mat(ar._img.rows, ar._img.cols, cv.CV_8UC4);
            let mask = new cv.Mat(ar._img.rows, ar._img.cols, cv.CV_8UC4);

            //cv.cvtColor(this._imd, this._imd, cv.COLOR_BGR2HSV)//画像をHSVに変換
            //cv.cvtColor(this._imd, this._imd, cv.COLOR_RGB2RGBA)//画像をRGBAに変換
            const os = 24;
            let low =  new cv.Mat(ar._imd.rows, ar._imd.cols, ar._imd.type(),
                [osr(pixel[0],-os), osr(pixel[1],-os), osr(pixel[2],-os), osr(pixel[3],0)]);
            //cv.cvtColor(low, low, cv.COLOR_BGR2HSV)//画像をHSVに変換
            let high = new cv.Mat(ar._imd.rows, ar._imd.cols, ar._imd.type(),
                [osr(pixel[0],+os),  osr(pixel[1],+os),  osr(pixel[2],+os),  osr(pixel[3],0)]);
            //cv.cvtColor(high, high, cv.COLOR_BGR2HSV)//画像をHSVに変換
            cv.inRange(ar._img, low, high, ar._imd)//マスクを作成
            /***
            for(let i = 0; i < ar._imd.rows; i++){
                for(let j = 0; j < ar._imd.cols; j++){
                    if( ar._imd.ucharPtr(i,j)[0] == 0 ){
                        mask.ucharPtr(i,j)[3] = 0;
                    }
                    else{
                        mask.ucharPtr(i,j)[0] = 0;
                        mask.ucharPtr(i,j)[1] = 0;
                        mask.ucharPtr(i,j)[2] = 255;
                        mask.ucharPtr(i,j)[3] = 255;
                    }
                }    
            }
             */
            cv.imshow("layer-arf", mask);
            ar.lineDetector();
        });
    });
});