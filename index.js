
// モジュールのインポート
const server = require("express")();
const line = require("@line/bot-sdk"); // Messaging APIのSDKをインポート
const { json } = require("express");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr =new XMLHttpRequest();
var kuromoji = require("kuromoji");

// パラメータ設定
const line_config = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN, // 環境変数からアクセストークンをセットしています
    channelSecret: process.env.LINE_CHANNEL_SECRET // 環境変数からChannel Secretをセットしています
};


// Webサーバー設定
server.listen(process.env.PORT || 3000);

// APIコールのためのクライアントインスタンスを作成
const bot = new line.Client(line_config);


// ルーター設定
server.post('/bot/webhook', line.middleware(line_config), (req, res, next) => {
    // 先行してLINE側にステータスコード200でレスポンスする。
    res.sendStatus(200);

    // すべてのイベント処理のプロミスを格納する配列。
    let events_processed = [];

    // イベントオブジェクトを順次処理。
    req.body.events.forEach((event) => {
        // この処理の対象をイベントタイプがメッセージで、かつ、テキストタイプだった場合に限定。
        if (event.type == "message" && event.message.type == "text"){
            // ユーザーからのテキストメッセージが「こんにちは」だった場合のみ反応。
            if (event.message.text == "こんにちは"){
                // replyMessage()で返信し、そのプロミスをevents_processedに追加。
                events_processed.push(bot.replyMessage(event.replyToken, {
                    type: "text",
                    text: "おはよーーー！！！！！☁☀"
                }));
            } else if(event.message.text == "こんばんは"){
                events_processed.push(bot.replyMessage(event.replyToken, {
                    type: "text",
                    text: "夜だね〜〜〜🌙"
                }));
            } else if(event.message.text.includes("天気")){

                var city_name = "不明";
                var res_to_city = "";
                //複数箇所の天気情報取得できるように拡張すべき？必要かな？
                if(event.message.text.includes("東京") || event.message.text.includes("関東")){
                    city_name = "Tokyo";
                } else if(event.message.text.includes("大阪") || event.message.text.includes("関西")){
                    city_name = "Osaka";
                } else if(event.message.text.includes("滋賀") || event.message.text.includes("琵琶湖") || event.message.text.includes("草津")){
                    city_name = "kusatsu";
                } else if(event.message.text.includes("神戸") || event.message.text.includes("兵庫")){
                    city_name = "Kobe";
                } else {
                    res_to_city = "私のわかんない地名だ、、。とりあえずランダムで知ってるところをおしえるね！\n";
                    //ランダムに拡張予定
                    city_name = "kusatsu";
                }

                var target_city = city_name + ",jp";
                let appId = "YOURAPPID";

                const requestUrl = "https://api.openweathermap.org/data/2.5/weather?APPID=" + appId + "&lang=ja&units=metric&q=" + target_city + ";";
          
                //通信方式とURLを設定
                xhr.open("GET",requestUrl);
    
                //通信を実行する
                xhr.send();
    
                   //通信ステータスが変わったら実行される関数
                 xhr.onreadystatechange = function(){
                 //通信が完了
                 if(xhr.readyState == 4){
                    let jsonObj = JSON.parse(xhr.responseText);
                    let weather = jsonObj.weather[0].description;
                    let city = jsonObj.name;
                    let temp = jsonObj.main.temp;
                    var one_phrase = "";
                     if(temp <= 15 && temp > 10){
                        one_phrase = "寒いかな？";
                     } else if (temp > 15 && temp <= 25){
                        one_phrase = "あったかいね！";
                     } else if(temp <= 10){
                        one_phrase = "そろそろ寒くて死んじゃうね！ハワイに行こうよ！！";
                     } else if(temp > 25){
                        one_phrase = "あつすぎるね...水とアイスが恋しい...";
                     }
                     var result = res_to_city + "現在の"　+ city + "の天気は" + weather + "だよ！！\n気温は" + temp + "度だよ！！\n" + one_phrase;
                     events_processed.push(bot.replyMessage(event.replyToken, {
                     type: "text",
                     text: result
                }))
               }
    
             }
        

            } else {
                events_processed.push(bot.replyMessage(event.replyToken, {
                    type: "text",
                    text: "うーーん？？"
                }));
            }
        }
    });

    // すべてのイベント処理が終了したら何個のイベントが処理されたか出力。
    Promise.all(events_processed).then(
        (response) => {
            console.log(`${response.length} event(s) processed.`);
        }
    );
});

//未使用
function forecast(location){
    var target_city = "Kusatsu,jp";
    let appId = "YOURAPPID";
    //   var httpObj = new XMLHttpRequest();
    const requestUrl = "https://api.openweathermap.org/data/2.5/weather?APPID=" + appId + "&lang=ja&units=metric&q=" + target_city + ";";
    //const requestUrl = "http://api.openweathermap.org/data/2.5/weather?id=1850147&units=metric&appid=" + appId;


    // この builder が辞書やら何やらをみて、形態素解析機を造ってくれるオブジェクトです。
    var builder = kuromoji.builder({
    // ここで辞書があるパスを指定します。今回は kuromoji.js 標準の辞書があるディレクトリを指定
    dicPath: 'node_modules/kuromoji/dist/dict'
    });
    //　携帯解析機をつくるメソッド
    builder.build(function(err, tokenizer) {
    //辞書がなかったりするとエラーが飛ぶ
    if(err){
        return "辞書がありません";
    }

    //ターゲットIDを変更したい
    //tokenizer.tokenize に文字列を渡すとその文字列を形態素解析してくれる
    var tokens = tokenizer.tokenize(location);
    //ロケーションネームからコードを取りたい。
    var location_name = "不明";
    for(var i=0; i<tokens.length; i++){
        if(takens[i].pos_detail_1 == "固有名詞" && takens[i].pos_detail_2 == "地域"){
                //表層恪を得る
                location_name = "" + takens[i].surfaceform;
                //最初に現れた地域のみに対応
                break;
            }
        }
    });

      //通信方式とURLを設定
      xhr.open("GET",requestUrl);

      //通信を実行する
      xhr.send();
  
         //通信ステータスが変わったら実行される関数
       xhr.onreadystatechange = function(){
       //通信が完了
       if(xhr.readyState == 4){
          let jsonObj = JSON.parse(xhr.responseText);
           let weather = jsonObj.weather[0].description;
           let city = jsonObj.name;
           let temp = jsonObj.main.temp;
           var result = "現在の"　+ city + "の天気は" + weather + "だよ！！\n気温は" + temp + "度だよ！！\n寒いかな？";
           return result;
     }
  
   }
    return "お天気わかんなかった、、、";
}
