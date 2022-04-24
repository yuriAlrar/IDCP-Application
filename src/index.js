/**
 * index.js
 * アプリページの初期化処理
 */
let READER = null;// ユーザーが選択した画像のFileReaderオブジェクト
let IMAGE  = null;// RENDERのImage src
let load_image = (callback=(r,i)=>{})=>{
    //画像の読み込みプロセス、既に読み込まれていたらスキップ
    if(READER && IMAGE){
        callback(READER,IMAGE);
    }
    else{
        $('#fifa1').on('change', (e) => {
            READER = new FileReader();
            READER.addEventListener("load", (e) => {
                IMAGE = e.target.result;
                callback(READER,IMAGE);
            });
            READER.readAsDataURL(e.target.files[0]);
        });
    }
}
let select_img = () =>{
    /** 画像の取込みが完了したら同じサイズのcanvasを上に展開 */
    load_image( (r,e) => {
        var img = new Image(); // 新たな img 要素を作成
        img.addEventListener("load", function() {
            let ic = $("#img-canvas");
            ic.attr("src", e);
            $("#img-cargo").height(ic.height());
            $("canvas").each( (i,e) => {
                $(e).attr("width",  ic.width());
                $(e).attr("height", ic.height());
            } )
        }, false);
        img.addEventListener("error", () => {
            console.log("not gazou");
        });
        img.src = e; // ソースのパスを設定
    });
}
async function canvasRender(){
    const getImagefromCanvas = (id) => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            let ctx = $(id)[0].getContext("2d");
            image.src = ctx.canvas.toDataURL();
            image.onload = () => resolve(image);
            image.onerror = (e) => reject(e);
        });
    };
    const canvas = $("#layer-composition")[0];
    const ctx = canvas.getContext("2d");
    let img1 = await getImagefromCanvas("#layer-mpf");
    ctx.drawImage(img1, 0, 0, canvas.width, canvas.height);
    let img2 = await getImagefromCanvas("#layer-arf");
    ctx.drawImage(img2, 0, 0, canvas.width, canvas.height);
}
let evt_register = () =>{
    /** 処理エンジン/画像処理ボタンのステート切り替え */
    $(".NCS-selector").each( (i,e) => {
        $(e).on("click", ()=>{
            let trig = $(e).children('input');
            $(trig).prop("checked", true ).change();
        });
    });
    /** チェックボックスのイベント監視/色変更 */
    let radioedit = () =>{
        $("input[name='edison']").each( (i,e) => {
            let block = $(e).parent();
            if($(e).prop('checked')){
                //チェックされてたら
                $(block).addClass("uk-card-primary");
                $(block).removeClass("uk-card-default");
            }
            else{
                $(block).removeClass("uk-card-primary");
                $(block).addClass("uk-card-default");
            }
        });
    };
    /** イベント登録 */
    $("input[name='edison']").each( (i,e) => {
        $(e).on("change", ()=>{
            radioedit();
        });
    });
    $("#conversion").on("click", ()=>{
        canvasRender();
    });
}
let get_token = () =>{
   /*** API呼び出し ***/
    $.ajax({
      type:"GET",
      url:"./api/token",
      dataType:"json"
    }).done(function(data, Status, XHR){
        console.log(data);
        sessionStorage.setItem('token',data);
    }).fail(function(jqXHR, textStatus, errorThrown){
    });
}
$(function(){
    /** 初期起動 */
    get_token();// APIのトークン発行
    select_img();// 画像ロードイベント登録
    evt_register();// カード押下イベント登録
    const pres = ["eg1","dt1"];// 処理エンジンリスト
    setTimeout(()=>{
        $("#"+pres[0]).trigger("click");
        $("#"+pres[1]).trigger("click");
    },100);
});
    
