let READER = null;
let IMAGE  = null;
let load_image = (callback=(r,i)=>{})=>{
    $('#fifa1').on('change', (e) => {
        if(READER && IMAGE){
            callback(READER,IMAGE);
        }
        else{
            READER = new FileReader();
            READER.addEventListener("load", (e) => {
                IMAGE = e.target.result;
                callback(READER,IMAGE);
            });
            READER.readAsDataURL(e.target.files[0]);    
        }
    });
}

let select_img = () =>{
    load_image( (r,e) => {
        var img = new Image();   // 新たな img 要素を作成
        img.addEventListener("load", function() {
            let ic = $("#img-canvas");
            ic.attr("src", e);
            
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
let evt_register = () =>{
    $(".NCS-selector").each( (i,e) => {
        $(e).on("click", ()=>{
            let trig = $(e).children('input');
            //$(trig).prop("checked", !( $(trig).prop("checked") ) ).change();
            $(trig).prop("checked", true ).change();
        });
    });
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
    $("input[name='edison']").each( (i,e) => {
        $(e).on("change", ()=>{
            radioedit();
        });
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
    get_token();
    select_img();
    evt_register();
    const pres = ["eg1","dt1"];
    setTimeout(()=>{
        $("#"+pres[0]).trigger("click");
        $("#"+pres[1]).trigger("click");
    },100);
});
    
