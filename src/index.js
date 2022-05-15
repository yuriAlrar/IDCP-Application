/**
 * index.js
 * アプリページの初期化処理
 */
let READER = null;// ユーザーが選択した画像のFileReaderオブジェクト
let IMAGE  = null;// RENDERのImage src
let load_image = (callback=(r,i)=>{})=>{
    //画像の読み込みプロセス、既に読み込まれていたらスキップ
    if(READER && IMAGE){
        callback(READER, IMAGE);
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
async function evt_register(){
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
    // 変換処理、サーバー送信
    $("#conversion").on("click", ()=>{
        const render = new imagerender();
        render.composition();
        render.sendData();
    });
}
async function get_token(){
    console.log("get api token");
    return new Promise((resolve, reject) => {
        $.ajax({
        type:"GET",
        url:"http://localhost:8000/api/token",
        dataType:"json"
        }).done(function(data, status, XHR){
            sessionStorage.setItem('token', (data.token) ? data.token : "");
            resolve( sessionStorage.getItem('token') );
        }).fail(function(jqXHR, textStatus, errorThrown){
            //エラー追記
            reject();
        });
    });
}
async function get_enginelist(){
   /*** API呼び出し ***/
   console.log("get engine list");
   const token = sessionStorage.getItem('token');
   return new Promise((resolve, reject) => {
    $.ajax({
        type:"GET",
        url:"http://localhost:8000/api/modslist",
        dataType:"json",
        beforeSend: function( xhr, settings ) { 
            xhr.setRequestHeader('Authorization', 'Bearer '+ token); 
        }
      }).done(function(data, status, XHR){
            resolve(data);
      }).fail(function(jqXHR, textStatus, errorThrown){
            //エラー追記
            console.log(textStatus);
            reject();
      });
   });
}
function add_engineList(engines){
    const atRegion = 'Anime-Transition';
    const ptRegion = 'Photography-Transition';
    let at = $('#' + atRegion);
    let pt = $('#' + ptRegion);
    for(let i in engines){
        if(engines[i]['name'] && engines[i]['region']){
            let elem = document.createElement('option');
            elem.innerHTML = engines[i]['name'];
            elem.dataset.id = i
            if(engines[i]['region'] == atRegion){
                at.append(elem);
            } else if(engines[i]['region'] == atRegion){
                pt.append(elem);
            }
        }
    }
}
$(async function(){
    /** 初期起動 */
    select_img();// 画像ロードイベント登録
    evt_register();// カード押下イベント登録
    const pres = ["eg1","dt1"];// 処理エンジンリスト
    // せめてprimiseに書換
    setTimeout(()=>{
        $("#"+pres[0]).trigger("click");
        $("#"+pres[1]).trigger("click");
    },100);
    await get_token();// APIのトークン発行
    const engines = await get_enginelist();// Engineリスト取得
    console.log(engines);
    add_engineList(engines);
});
