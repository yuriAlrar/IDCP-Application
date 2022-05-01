class imagerender {
    constructor() {
        this.baseImg = $("#img-canvas")[0];
        this.arfLayer = $("#layer-arf")[0];
        this.mpfLayer = $("#layer-mpf")[0];
        this.compositionLayer = $("#layer-composition")[0];
        this.height = this.compositionLayer.height;
        this.width = this.compositionLayer.width;
    }
    async composition(){
        const getImagefromCanvas = (id) => {
            return new Promise((resolve, reject) => {
                const image = new Image();
                let ctx = id.getContext("2d");
                image.src = ctx.canvas.toDataURL();
                image.onload = () => resolve(image);
                image.onerror = (e) => reject(e);
            });
        };
        const ctx = this.compositionLayer.getContext("2d");
        let img1 = await getImagefromCanvas(this.mpfLayer);
        ctx.drawImage(img1, 0, 0, this.width, this.height);
        let img2 = await getImagefromCanvas(this.arfLayer);
        ctx.drawImage(img2, 0, 0, this.width, this.height);
    }
    async toConvertBlob(img){
        return new Promise((resolve, reject) => {
            let _canvas = document.createElement("canvas");
            let ctx = _canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, this.width, this.height);
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
        const targetImg = await this.toConvertBlob(this.baseImg);
        formData.append("files", targetImg, "target.png");
        const maskImg = await this.toConvertBlob(this.compositionLayer);
        formData.append("files", maskImg, "mask.png");
        sendToPool(formData);
        return true;
    }
}