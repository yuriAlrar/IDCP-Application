let arf = () => {
    load_image( (r,e) => {
        const ic = "img-canvas";
        const w = $("#"+ic).width();
        const h = $("#"+ic).height();

        console.log("loaded img with cv");
        let src = cv.imread(ic);
        let imd = new cv.Mat();
        let dst = new cv.Mat(src.rows, src.cols, cv.CV_8UC4);
        //cv.cvtColor(dst, dst, cv.COLOR_BGR2RGBA);
        let lines = new cv.Mat();
        // グレイスケール化
        cv.cvtColor(src, imd, cv.COLOR_RGBA2GRAY, 0);

        // 二値化
        //cv.threshold(imd, imd, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

        // エッジ検出
        cv.Canny(imd, imd, 150, 200);
        cv.HoughLinesP(imd, lines, Math.PI / 180, 2, 0, 0);
          // Hough検出した線を描く
        for (let i = 0; i < lines.rows; ++i) {
            let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
            let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);
            cv.line(dst, startPoint, endPoint, new cv.Scalar(255, 0, 0, 255));
        }    
        cv.imshow("layer-arf", dst);
    });
};
$(function(){
    arf();
});