class imagerender {
    constructor() {
        this.baseImg = $("#img-canvas")[0];
        this.arfLayer = $("#layer-arf")[0];
        this.mpfLayer = $("#layer-mpf")[0];
        this.compositionLayer = $("#layer-composition")[0];
        this.viewHeight = this.compositionLayer.height;
        this.viewWidth = this.compositionLayer.width;
    }
    async composition(){
        const getImagefromCanvas = (id) => {
            return new Promise((resolve, reject) => {
                const image = new Image();
                let ctx = id.getContext("2d");
                image.src = ctx.canvas.toDataURL('image/png');
                image.onload = () => resolve(image);
                image.onerror = (e) => reject(e);
            });
        };
        const ctx = this.compositionLayer.getContext("2d");
        let img1 = await getImagefromCanvas(this.mpfLayer);
        ctx.drawImage(img1, 0, 0);
        let img2 = await getImagefromCanvas(this.arfLayer);
        ctx.drawImage(img2, 0, 0);
    }
    async toConvertBlob(img){
        return new Promise((resolve, reject) => {
            let _canvas = document.createElement("canvas");
            let ctx = _canvas.getContext("2d");
            _canvas.width = this.viewWidth;
            _canvas.height = this.viewHeight;
            ctx.drawImage(img, 0, 0, this.viewWidth, this.viewHeight);
            _canvas.toBlob((blob) =>{
                if(blob){
                    resolve(blob);
                } else{
                    reject(false);
                }
            },'image/png');
        });
    }
    async sendData(){
        const sendToPool = (formData) => {
            /*** API呼び出し ***/
            const token = sessionStorage.getItem('token');
            console.log(token);
            $.ajax({
                type: 'POST',
                url: 'http://localhost:8000/api/pool/',
                dataType: 'json',
                processData: false,
                contentType: false,
                data: formData,
                beforeSend: function( xhr, settings ) { 
                    xhr.setRequestHeader('Authorization', 'Bearer '+ token); 
                }
            }).done(function(data, status, XHR){
                console.log(data, status);
            }).fail(function(jqXHR, textStatus, errorThrown){
                console.log(jqXHR, textStatus, errorThrown);
            });
        }
        if(!sessionStorage.getItem('token')){
            console.log('not yet token');
            return false;
        }
        let formData = new FormData();
        const jsr = {
            imageinfo:{
                viewWidth:  this.viewWidth,
                viewHeight: this.viewHeight,
                naturalWidth:  this.compositionLayer.naturalWidth,
                naturalHeight: this.compositionLayer.naturalHeight
            },
            meta: {
                timestamp: (new Date()).toISOString(),
                token: sessionStorage.getItem('token') || 'undefined token'
            }
        };
        formData.append('json', JSON.stringify(jsr));
        const targetImg = await this.toConvertBlob(this.baseImg);
        formData.append("files", targetImg, "target");
        const maskImg = await this.toConvertBlob(this.compositionLayer);
        formData.append("files", maskImg, "mask");
        sendToPool(formData);
        return true;
    }
}