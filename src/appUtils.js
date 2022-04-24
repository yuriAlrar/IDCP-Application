/**
 * utils
 */
function evalList(lst1, lst2, strict = false){
    /** 配列の比較　どうも中身の一致を判定する組み込み関数はないらしい */
    if (lst1.length != lst2.length){
        return false;
    } else{
        for(let i = 0; i < lst1.length; i++){
            if( (lst1[i] != lst2[i] && !strict ) || lst1[i] !== lst2[i] ){
                return false;
            }
        }
    }
    return true;
}
