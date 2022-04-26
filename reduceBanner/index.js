"use strict";
    $(function() {
    // ポップアップ非表示の判定
    let popAppend = false;

    // 履歴の追加
    let hash = location.hash;
    if(hash != '#back') {
        history.pushState(null,null,location.href);
        history.replaceState(null,null,'#back');
    }
    // 設定したハッシュタグが消えたら実行
    window.addEventListener('popstate',(e) => {
        if(location.hash != "#back" && popAppend === false) {
            $('.popup-area').fadeIn();
            popAppend = true;
        }
    });
    // バナー削除
    $('.ha-closed').click(function(event) {
        event.stopPropagation();
        $('.popup-area').fadeOut();
        popAppend = false;
        return false;
    });
    $('.pouup-banner').click(function(event) {
        event.stopPropagation();
        return false;
    });
});