const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'posts');

const REPLACEMENTS = {
  'bonfire-stand-beginner': [
    {name:'アイリスオーヤマ たき火台 TKB-ST43',price:'6570',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/k-home/574717/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/k-home/cabinet/11073614/574717_ins.jpg?_ex=128x128'},
    {name:'アイリスオーヤマ 焚き火三脚 TKB-TP135',price:'7180',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/k-home/574718/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/k-home/cabinet/11073614/574718_ins.jpg?_ex=128x128'},
    {name:'アイリスオーヤマ 焚き火テーブル TKB-TB98',price:'14800',rakutenRating:'4.0',rakutenReviewCount:'1',affiliateUrl:'https://item.rakuten.co.jp/k-home/574716/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/k-home/cabinet/11073614/574716_ins.jpg?_ex=128x128'},
    {name:'TRGR 焚き火台 ソロ1〜2人用 エントリーモデル',price:'22000',rakutenRating:'5.0',rakutenReviewCount:'1',affiliateUrl:'https://item.rakuten.co.jp/ki-wa-mi/10000268/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/ki-wa-mi/cabinet/268-1.jpg?_ex=128x128'},
    {name:'BaTaRaN 焚き火台 A4サイズ 折りたたみ ステンレス製',price:'3880',rakutenRating:'5.0',rakutenReviewCount:'2',affiliateUrl:'https://item.rakuten.co.jp/js-sister/byll-4573/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/js-sister/cabinet/all-30/all-4573-1.jpg?_ex=128x128'},
  ],
  'camp-backpack-beginner': [
    {name:'サイバトロン 3Pタクティカル バックパック 防水',price:'9280',rakutenRating:'4.73',rakutenReviewCount:'79',affiliateUrl:'https://item.rakuten.co.jp/kittomotto/seibertron-3p-daypack/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/kittomotto/cabinet/seibertron3pdaypack/top5.jpg?_ex=128x128'},
    {name:'tousen 登山バッグ 40〜60L 大容量',price:'4280',rakutenRating:'4.51',rakutenReviewCount:'358',affiliateUrl:'https://item.rakuten.co.jp/tousenmizumoto/c-666-1/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/tousenmizumoto/cabinet/11365363/11769692/imgrc0128465324.jpg?_ex=128x128'},
    {name:'HAWK GEAR バックパック 80L 防水 レインカバー付',price:'7080',rakutenRating:'4.56',rakutenReviewCount:'89',affiliateUrl:'https://item.rakuten.co.jp/ymbstore/backpack01/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/ymbstore/cabinet/outdoor/imgrc0101273586.jpg?_ex=128x128'},
    {name:'HAWK GEAR バックパック 55L 防水 レインカバー付',price:'5990',rakutenRating:'4.60',rakutenReviewCount:'47',affiliateUrl:'https://item.rakuten.co.jp/ymbstore/backpack02/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/ymbstore/cabinet/outdoor/imgrc0101275729.jpg?_ex=128x128'},
    {name:'MANA CAPURU KIRIRU キャンバスリュック 30L',price:'3990',rakutenRating:'4.82',rakutenReviewCount:'50',affiliateUrl:'https://item.rakuten.co.jp/manacapuru/rc004/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/manacapuru/cabinet/07992413/compass1624431060.jpg?_ex=128x128'},
  ],
  'camp-burner-beginner': [
    {name:'イワタニ ジュニアコンパクトバーナー CB-JCB',price:'4400',rakutenRating:'4.72',rakutenReviewCount:'608',affiliateUrl:'https://item.rakuten.co.jp/i-collect/0003180/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/i-collect/cabinet/item02/2000002479.jpg?_ex=128x128'},
    {name:'SOTO AMICUS + パワーガス250 2点セット',price:'6000',rakutenRating:'4.42',rakutenReviewCount:'31',affiliateUrl:'https://item.rakuten.co.jp/naturum/2705518/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/naturum/cabinet/goods/027055/18_1.jpg?_ex=128x128'},
    {name:'SOTO レギュレーターストーブ ST-310 ボンベセット',price:'7480',rakutenRating:'4.68',rakutenReviewCount:'142',affiliateUrl:'https://item.rakuten.co.jp/e-kurashi/xqm66/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/e-kurashi/cabinet/main-img/008/main-xqm66.jpg?_ex=128x128'},
    {name:'Coleman アウトランダーマイクロストーブ PZ 203535',price:'5297',rakutenRating:'4.60',rakutenReviewCount:'43',affiliateUrl:'https://item.rakuten.co.jp/himaraya/0000000080728/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/himaraya/cabinet/x10/0000000080728-1.jpg?_ex=128x128'},
    {name:'CAPTAIN STAG オーリック バーナー・クッカーセット M-6400',price:'5680',rakutenRating:'4.50',rakutenReviewCount:'4',affiliateUrl:'https://item.rakuten.co.jp/hrco-r/m-6400/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_gold/hrco-r/image/m6400/1.jpg?_ex=128x128'},
  ],
  'camp-chair-lightweight': [
    {name:'ポンコタン ウルトラライトフィットチェア ロータイプ',price:'3972',rakutenRating:'4.36',rakutenReviewCount:'1919',affiliateUrl:'https://item.rakuten.co.jp/poncotan/po-001/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_gold/poncotan/sum/fcsum.jpg?_ex=128x128'},
    {name:'Moon Lence アウトドアチェア CH-7 超軽量907g',price:'3799',rakutenRating:'4.41',rakutenReviewCount:'93',affiliateUrl:'https://item.rakuten.co.jp/airkey/2017jpchair/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/airkey/cabinet/09112903/09165046/10-2.jpg?_ex=128x128'},
    {name:'YMBSTORE 超軽量チェア ロータイプ',price:'3970',rakutenRating:'4.51',rakutenReviewCount:'1806',affiliateUrl:'https://item.rakuten.co.jp/ymbstore/outdoor-chair/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/ymbstore/cabinet/outdoor/10339443/imgrc0119491146.jpg?_ex=128x128'},
    {name:'山善 ディレクターチェア DD-02WT サイドテーブル付',price:'5800',rakutenRating:'4.61',rakutenReviewCount:'228',affiliateUrl:'https://item.rakuten.co.jp/e-kurashi/1506329/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/e-kurashi/cabinet/main-img/021/main-s5s84.jpg?_ex=128x128'},
    {name:'ポンコタン ハイバックチェア 超軽量',price:'4982',rakutenRating:'4.15',rakutenReviewCount:'1563',affiliateUrl:'https://item.rakuten.co.jp/poncotan/po-002/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_gold/poncotan/sum/hbsum.jpg?_ex=128x128'},
  ],
  'camp-cooker-beginner': [
    {name:'スノーピーク アルミパーソナルクッカー SCS-020R',price:'5544',rakutenRating:'4.83',rakutenReviewCount:'135',affiliateUrl:'https://item.rakuten.co.jp/snowpeak-official/scs-020r/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/snowpeak-official/cabinet/newthumb202403/scs-020r_2403.jpg?_ex=128x128'},
    {name:'Coleman パッカウェイクッカーセット',price:'6160',rakutenRating:'4.57',rakutenReviewCount:'30',affiliateUrl:'https://item.rakuten.co.jp/store-megasports/32380560/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/store-megasports/cabinet/item/tsa02/tsa0223a0150/tsa0223a0156_pz_a006.jpg?_ex=128x128'},
    {name:'VASTLAND クッカー 4点セット アルミ コッヘル',price:'2980',rakutenRating:'4.56',rakutenReviewCount:'94',affiliateUrl:'https://item.rakuten.co.jp/vastland/vl0259-1/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/vastland/cabinet/products/cooker4_img/vl0259_smn.jpg?_ex=128x128'},
    {name:'TITAN MANIA チタン製クッカー 900ml+350ml',price:'4680',rakutenRating:'4.77',rakutenReviewCount:'13',affiliateUrl:'https://item.rakuten.co.jp/legare-factory/titan1832/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/legare-factory/cabinet/shohin/titanmania/titan1832/01.jpg?_ex=128x128'},
    {name:'Paprika クッカー 3点セット 2-3人用 やかん付',price:'3280',rakutenRating:'4.39',rakutenReviewCount:'341',affiliateUrl:'https://item.rakuten.co.jp/paprika-1936/kukasetto_1/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/paprika-1936/cabinet/10050240/kukasetto_1-01.jpg?_ex=128x128'},
  ],
  'camp-cooler-box-beginner': [
    {name:'ロゴス ハイパー氷点下クーラーM 12L ソフトクーラー',price:'10780',rakutenRating:'4.0',rakutenReviewCount:'1',affiliateUrl:'https://item.rakuten.co.jp/auc-ainetshop/60965/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/auc-ainetshop/cabinet/logos2/60965-1.jpg?_ex=128x128'},
    {name:'アイリスオーヤマ HUGEL VITC-40 真空断熱 40L 大型',price:'32780',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/doudabesa/vitc40cgyhhcl/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/doudabesa/cabinet/denkyu/11372411/vitc40cgyhhcl.jpg?_ex=128x128'},
    {name:'アイリスオーヤマ HUGEL VITC-20 真空断熱 20L',price:'21780',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/doudabesa/vitc20cgy/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/doudabesa/cabinet/denkyu/11372411/vitc20cgy.jpg?_ex=128x128'},
    {name:'ロゴス アクションクーラー25 保冷剤付',price:'8250',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/auc-ainetshop/62695-60966x2/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/auc-ainetshop/cabinet/outdoor/logos2/2/6269560966x2.jpg?_ex=128x128'},
    {name:'アイリスオーヤマ CL-7〜45 ソフトクーラー 7〜45L',price:'1681',rakutenRating:'4.5',rakutenReviewCount:'2',affiliateUrl:'https://item.rakuten.co.jp/mamababy/i204477/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/mamababy/cabinet/jishahin14/204475.jpg?_ex=128x128'},
  ],
  'camp-headlight-beginner': [
    {name:'N-FORCE SC-200B 32g軽量 乾電池式 LEDヘッドライト',price:'1680',rakutenRating:'4.55',rakutenReviewCount:'1493',affiliateUrl:'https://item.rakuten.co.jp/k-power/sc-200b/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/k-power/cabinet/headlampsc200/sc200_202304.jpg?_ex=128x128'},
    {name:'N-FORCE SR-01L 充電式 センサー点灯',price:'2880',rakutenRating:'4.36',rakutenReviewCount:'1516',affiliateUrl:'https://item.rakuten.co.jp/k-power/sq04_d/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/k-power/cabinet/sr01/sr-01_202304.jpg?_ex=128x128'},
    {name:'N-FORCE SC-300R/400R 充電式 防水LEDヘッドライト',price:'1480',rakutenRating:'4.58',rakutenReviewCount:'929',affiliateUrl:'https://item.rakuten.co.jp/k-power/sc-300r/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/k-power/cabinet/sc-300-400/sc-300_20230609.jpg?_ex=128x128'},
    {name:'HRK 6200ルーメン 高輝度充電式LEDヘッドランプ',price:'2799',rakutenRating:'4.38',rakutenReviewCount:'294',affiliateUrl:'https://item.rakuten.co.jp/hrktonya/yj-t105/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/hrktonya/cabinet/11073756/imgrc0094501113.jpg?_ex=128x128'},
    {name:'LAD WEATHER 超軽量42g IP44 USB充電 センサー搭載',price:'1480',rakutenRating:'4.53',rakutenReviewCount:'587',affiliateUrl:'https://item.rakuten.co.jp/vanilla-vague/ledmaster013/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_gold/vanilla-vague/images/thumb/ledmaster013-thum740-001.jpg?_ex=128x128'},
  ],
  'camp-knife-beginner': [
    {name:'ベルモント BM-164 フィールドナイフ 倭-yamato 日本製',price:'7700',rakutenRating:'5.0',rakutenReviewCount:'6',affiliateUrl:'https://item.rakuten.co.jp/auc-ainetshop/83951/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/auc-ainetshop/cabinet/outdoor/teogonia/83951_005.jpg?_ex=128x128'},
    {name:'ベルモント BM-163 フィールドナイフ IP 倭-yamato IPメッキ',price:'9350',rakutenRating:'5.0',rakutenReviewCount:'5',affiliateUrl:'https://item.rakuten.co.jp/auc-ainetshop/83950/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/auc-ainetshop/cabinet/outdoor/teogonia/83950_001.jpg?_ex=128x128'},
    {name:'CAPTAIN STAG キャンピング折込包丁 11.5cm',price:'2330',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/livingut/4976790780568/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/livingut/cabinet/maker_perl3/4976790780568.jpg?_ex=128x128'},
    {name:'LOGOS Bamboo ナイフ＆まな板セット 81280009',price:'4950',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/alpen/7620123092/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/alpen/cabinet/img/504/7620123092_7.jpg?_ex=128x128'},
    {name:"COOK'N'ESCAPE キャンプまな板セット5点 チタンまな板+折りたたみナイフ",price:'5750',rakutenRating:'4.5',rakutenReviewCount:'8',affiliateUrl:'https://item.rakuten.co.jp/kingcamp/200078/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/kingcamp/cabinet/biiino/item/main-image-4/20260212160023_1.jpg?_ex=128x128'},
  ],
  'camp-lantern-led': [
    {name:'DABADA LED ランタン 63灯 ソーラー・手回し充電式',price:'3498',rakutenRating:'4.34',rakutenReviewCount:'5226',affiliateUrl:'https://item.rakuten.co.jp/dabada/led-lantan-63/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/dabada/cabinet/03617945/led-lantan63_tmb1.jpg?_ex=128x128'},
    {name:'BRUNO LED LANTERN 全8色 無段階調光',price:'2750',rakutenRating:'4.52',rakutenReviewCount:'1969',affiliateUrl:'https://item.rakuten.co.jp/canpanera/b06019/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/canpanera/cabinet/item106/item_b06019_0.jpg?_ex=128x128'},
    {name:'Soomloom Helio5000 2Way 300LM LEDランタン',price:'2970',rakutenRating:'4.66',rakutenReviewCount:'1905',affiliateUrl:'https://item.rakuten.co.jp/yiprefer/outdoor-158-a/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/yiprefer/cabinet/outdoor2/outdoor-158-renew_01.jpg?_ex=128x128'},
    {name:'LAD WEATHER 1000LM 防滴防塵 LEDランタン',price:'2280',rakutenRating:'4.52',rakutenReviewCount:'1289',affiliateUrl:'https://item.rakuten.co.jp/vanilla-vague/ledmaster003/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_gold/vanilla-vague/images/thumb/ledmaster003-thum-740-001.jpg?_ex=128x128'},
    {name:'LEBENWOOD 1000LM 5000mAh 150時間点灯 LEDランタン',price:'4980',rakutenRating:'4.73',rakutenReviewCount:'124',affiliateUrl:'https://item.rakuten.co.jp/lebenwood/10004797/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/lebenwood/cabinet/08503648/08690216/10778817/1-rev3.jpg?_ex=128x128'},
  ],
  'camp-lighting-guide': [
    {name:'BALMUDA The Lantern L02A 無段階調光 充電式',price:'15950',rakutenRating:'4.81',rakutenReviewCount:'974',affiliateUrl:'https://item.rakuten.co.jp/plywood/14939010/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/plywood/cabinet/501/14939010.jpg?_ex=128x128'},
    {name:'KZM ギルバートランタン LED レトロアンティーク',price:'19800',rakutenRating:'3.5',rakutenReviewCount:'4',affiliateUrl:'https://item.rakuten.co.jp/sanho-store/kzm-k21t3o02/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/sanho-store/cabinet/cart/kzm-k21t3o02_cart.jpg?_ex=128x128'},
    {name:'M.O.L MOL-L400 充電式 400LM LEDランタン',price:'2980',rakutenRating:'4.66',rakutenReviewCount:'243',affiliateUrl:'https://item.rakuten.co.jp/minatodenk/mt-0024146/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/minatodenk/cabinet/018/mt-0024146.jpg?_ex=128x128'},
    {name:'M.O.L MOL-L1200 充電式 1200LM LEDランタン',price:'4280',rakutenRating:'4.27',rakutenReviewCount:'22',affiliateUrl:'https://item.rakuten.co.jp/minatodenk/mt-0025335/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/minatodenk/cabinet/021/mt-0025335.jpg?_ex=128x128'},
    {name:'ソーラーランタン 1800LM 折り畳み式 5000mAh USB充電',price:'2900',rakutenRating:'4.60',rakutenReviewCount:'508',affiliateUrl:'https://item.rakuten.co.jp/aideall/s-yyd-rt101-bk/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/aideall/cabinet/10896179/10915808/1-1.jpg?_ex=128x128'},
  ],
  'camp-portable-power-beginner': [
    {name:'Smart Tap PowerArQ 500Wh ポータブル電源',price:'69300',rakutenRating:'4.66',rakutenReviewCount:'2141',affiliateUrl:'https://item.rakuten.co.jp/kashima-tokeiten/ac50/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/kashima-tokeiten/cabinet/thumnail/ac592410.jpg?_ex=128x128'},
    {name:'EcoFlow DELTA 3 1000 Air 大容量 1000Wh',price:'87700',rakutenRating:'4.67',rakutenReviewCount:'1173',affiliateUrl:'https://item.rakuten.co.jp/ecoflow/zmr330-jp/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/ecoflow/cabinet/13153557/13153558/d3a.jpg?_ex=128x128'},
    {name:'LACITA エナーボックス 444Wh 正弦波',price:'69800',rakutenRating:'4.58',rakutenReviewCount:'3070',affiliateUrl:'https://item.rakuten.co.jp/c-c-s/citaeb-01/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_gold/c-c-s/citaeb01_top_40off_kikan.jpg?_ex=128x128'},
    {name:'EcoFlow RIVER 2 256Wh リン酸鉄 5年保証',price:'29900',rakutenRating:'4.65',rakutenReviewCount:'853',affiliateUrl:'https://item.rakuten.co.jp/ecoflow/river-2/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/ecoflow/cabinet/13153557/13153558/r2.jpg?_ex=128x128'},
    {name:'BLUETTI AC50B 448Wh リン酸鉄 5年保証',price:'53800',rakutenRating:'4.67',rakutenReviewCount:'21',affiliateUrl:'https://item.rakuten.co.jp/bluettijapan/ac50b-jp-gy-bl-rktjp-00/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/bluettijapan/cabinet/12874450/13196348/13196349/ac50b.jpg?_ex=128x128'},
  ],
  'camp-sleeping-mat': [
    {name:'Aiflycy インフレーターマット 8/10cm 枕付 厚手',price:'7480',rakutenRating:'4.57',rakutenReviewCount:'1088',affiliateUrl:'https://item.rakuten.co.jp/luxim647/3sp02/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/luxim647/cabinet/3sp/3sp02/sp02-zhutu-0916.jpg?_ex=128x128'},
    {name:'Bears Rock キャンプマット 5cm 自動膨張式 枕付',price:'4980',rakutenRating:'4.55',rakutenReviewCount:'2635',affiliateUrl:'https://item.rakuten.co.jp/gorilla55/camping_mat5/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/gorilla55/cabinet/outdoor/04973527/mat5/mat5cm_main.jpg?_ex=128x128'},
    {name:'PYKES PEAK R値8.93 インフレーターマット 8cm',price:'5980',rakutenRating:'4.52',rakutenReviewCount:'240',affiliateUrl:'https://item.rakuten.co.jp/pykespeak/p0207ifmst/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/pykespeak/cabinet/top/13065700/p0207ifmst-a.jpg?_ex=128x128'},
    {name:'FIELDOOR クッションマット 180×60cm 厚さ2cm',price:'1870',rakutenRating:'4.46',rakutenReviewCount:'829',affiliateUrl:'https://item.rakuten.co.jp/smile88/a11327/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/smile88/cabinet/master/1st2/a11327.jpg?_ex=128x128'},
    {name:'Coleman キャンパーインフレーターマット ハイピーク ダブル',price:'16198',rakutenRating:'4.63',rakutenReviewCount:'64',affiliateUrl:'https://item.rakuten.co.jp/alpen/7300105500/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/alpen/cabinet/img/727/7300105500_6.jpg?_ex=128x128'},
  ],
  'camp-table-folding': [
    {name:'MERMONT アルミテーブル 伸縮 高さ調節 折りたたみ',price:'3280',rakutenRating:'3.98',rakutenReviewCount:'1113',affiliateUrl:'https://item.rakuten.co.jp/weiwei/a61b/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/weiwei/cabinet/shouhin-image03/a61b_1r.jpg?_ex=128x128'},
    {name:'山善 アウトドアテーブル 120/180/240cm 木目調',price:'4990',rakutenRating:'4.44',rakutenReviewCount:'964',affiliateUrl:'https://item.rakuten.co.jp/e-kurashi/1506881/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/e-kurashi/cabinet/main-img/021/main-s1e33s.jpg?_ex=128x128'},
    {name:'ROUND-ERA メッシュテーブル 135×60cm 二つ折り',price:'4980',rakutenRating:'4.31',rakutenReviewCount:'176',affiliateUrl:'https://item.rakuten.co.jp/round-era/table-001/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/round-era/cabinet/08532274/09464777/imgrc0114199029.jpg?_ex=128x128'},
    {name:'FIELDOOR テーブル＋ベンチ2脚セット 90cm アルミ',price:'7920',rakutenRating:'4.24',rakutenReviewCount:'1938',affiliateUrl:'https://item.rakuten.co.jp/smile88/a03737/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/smile88/cabinet/master/1st/a03737.jpg?_ex=128x128'},
    {name:'FIELDOOR ロールテーブル 120×70cm 高さ45cm 大型',price:'8800',rakutenRating:'4.45',rakutenReviewCount:'158',affiliateUrl:'https://item.rakuten.co.jp/maxshare/a10079/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/maxshare/cabinet/master/1st/a10079.jpg?_ex=128x128'},
  ],
  'camp-tarp-beginner': [
    {name:'FIELDOOR ワンタッチタープテント 3m×3m スチール',price:'8800',rakutenRating:'4.44',rakutenReviewCount:'7658',affiliateUrl:'https://item.rakuten.co.jp/maxshare/a04309_sale/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/maxshare/cabinet/master/1st2/a04309_sale.jpg?_ex=128x128'},
    {name:'DOD いつかのタープ TT5-631-TN ヘキサタープ',price:'9680',rakutenRating:'4.62',rakutenReviewCount:'159',affiliateUrl:'https://item.rakuten.co.jp/a-price/4589946142228/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/a-price/cabinet/mailmaga/08814302/0-4589946142228.jpg?_ex=128x128'},
    {name:'Bears Rock しろくまスクエアタープ 3×3m ポール2本付き',price:'6600',rakutenRating:'4.39',rakutenReviewCount:'226',affiliateUrl:'https://item.rakuten.co.jp/gorilla55/squaretarp/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/gorilla55/cabinet/outdoor/02973283/squaretarp/squaretarp-top.jpg?_ex=128x128'},
    {name:'DABADA ヘキサタープ 500×480cm 耐水圧2000mm',price:'8998',rakutenRating:'4.68',rakutenReviewCount:'19',affiliateUrl:'https://item.rakuten.co.jp/dabada/hexatarp/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/dabada/cabinet/09375249/imgrc0091182747.jpg?_ex=128x128'},
    {name:'FIELDOOR ヘキサタープ Mサイズ 440×470cm 4〜6人用',price:'4510',rakutenRating:'4.41',rakutenReviewCount:'360',affiliateUrl:'https://item.rakuten.co.jp/maxshare/a12038/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/maxshare/cabinet/master/1st2/a12038.jpg?_ex=128x128'},
  ],
  'family-camp-summer-tent': [
    {name:'TOMOUNT TriArc 2ルーム トンネルテント 4人用 耐水圧2500mm',price:'39999',rakutenRating:'4.40',rakutenReviewCount:'15',affiliateUrl:'https://item.rakuten.co.jp/tomount/triarc-tunnel-tent-v4/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/tomount/cabinet/triarc/1000/1-1.jpg?_ex=128x128'},
    {name:'FIELDOOR キャンプ 4点セット 4〜6人用 ドームテント',price:'27830',rakutenRating:'4.44',rakutenReviewCount:'16',affiliateUrl:'https://item.rakuten.co.jp/smile88/a18347/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/smile88/cabinet/master/1st/a18347.jpg?_ex=128x128'},
    {name:'RATELWORKS BODEN 2ルームテント ファミリーキャンプ用',price:'129800',rakutenRating:'4.75',rakutenReviewCount:'332',affiliateUrl:'https://item.rakuten.co.jp/marueidanboru/rws0111/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/marueidanboru/cabinet/05389878/boden/boden-2-2.jpg?_ex=128x128'},
    {name:'LOWYA ワンタッチテント 4人用 キャノピー付き',price:'19990',rakutenRating:'4.57',rakutenReviewCount:'7',affiliateUrl:'https://item.rakuten.co.jp/low-ya/kc72t/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/low-ya/cabinet/item_cart/outdoor24/kc72t_01.jpg?_ex=128x128'},
    {name:'WAQ Alpha TC ワンポールテント TC素材',price:'31500',rakutenRating:'4.47',rakutenReviewCount:'19',affiliateUrl:'https://item.rakuten.co.jp/waqoutdoor/waq-tcft1/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/waqoutdoor/cabinet/tent/cartimg/imgrc0080747575.jpg?_ex=128x128'},
  ],
  'group-camp-table': [
    {name:'FIELDOOR アウトドアテーブル 180/240cm 6〜8人対応 三つ折り',price:'7260',rakutenRating:'4.41',rakutenReviewCount:'160',affiliateUrl:'https://item.rakuten.co.jp/smile88/a15890/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/smile88/cabinet/master/1st2/a15890.jpg?_ex=128x128'},
    {name:'waku fimac ロールトップテーブル 120×70 高さ調整',price:'9980',rakutenRating:'4.60',rakutenReviewCount:'240',affiliateUrl:'https://item.rakuten.co.jp/auc-topsense/10005150/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/auc-topsense/cabinet/ftp10/10005150_19.jpg?_ex=128x128'},
    {name:'CAPTAIN STAG ヘキサセンターテーブル 96 2個組 組合せ可能',price:'27313',rakutenRating:'5.0',rakutenReviewCount:'1',affiliateUrl:'https://item.rakuten.co.jp/goodlifeshop/pup-1040/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/goodlifeshop/cabinet/outdoor2/pup-1040-012.gif?_ex=128x128'},
    {name:'Helinox テーブルワン ハードトップ L 軽量コンパクト',price:'18800',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/camp-link/cl-1000003101291/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/camp-link/cabinet/16756/cl-1000003101291.jpg?_ex=128x128'},
    {name:'お宝ワールド 折りたたみテーブル 180×70cm 頑丈',price:'5980',rakutenRating:'4.0',rakutenReviewCount:'251',affiliateUrl:'https://item.rakuten.co.jp/otakaratuuhan/10005450/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/otakaratuuhan/cabinet/shohin/shohin11/km-f002.jpg?_ex=128x128'},
  ],
  'mountain-backpack-30l': [
    {name:'NORDKAMM 登山バックパック 30L 防水 ヘルメットホルダー付き',price:'17999',rakutenRating:'4.65',rakutenReviewCount:'34',affiliateUrl:'https://item.rakuten.co.jp/horiuchimirror/nordkamm30l/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/horiuchimirror/cabinet/08220581/12491693/imgrc0333842100.jpg?_ex=128x128'},
    {name:'raramart 登山リュック 30L 登山ガイド監修 背中メッシュ',price:'3470',rakutenRating:'4.41',rakutenReviewCount:'472',affiliateUrl:'https://item.rakuten.co.jp/raramart-phoenix/ns00126/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/raramart-phoenix/cabinet/lank/1rank_ns00126.jpg?_ex=128x128'},
    {name:'スペリオ 登山リュック 30L 背面通気 レインカバー付き',price:'6480',rakutenRating:'4.37',rakutenReviewCount:'866',affiliateUrl:'https://item.rakuten.co.jp/auc-fishers/sp-bg001/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/auc-fishers/cabinet/backpack/creeper30tu/12979290/2026sp-bg001_0.jpg?_ex=128x128'},
    {name:'アコンカグア Mendoza 30L 登山リュック 軽量コンパクト',price:'13800',rakutenRating:'4.63',rakutenReviewCount:'94',affiliateUrl:'https://item.rakuten.co.jp/aconcagua/mendoza/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/aconcagua/cabinet/mendoza/mendozaii.jpg?_ex=128x128'},
    {name:'MAMMUT Lithium 30 30L バックパック 2530-03152',price:'22100',rakutenRating:'4.5',rakutenReviewCount:'4',affiliateUrl:'https://item.rakuten.co.jp/translation-nag/mm253003152/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/translation-nag/cabinet/11982124/compass1744355781.jpg?_ex=128x128'},
  ],
  'sleeping-bag-summer-cospa': [
    {name:'Bears Rock MX-604 封筒型 3.5シーズン 洗える シュラフ',price:'4580',rakutenRating:'4.45',rakutenReviewCount:'5508',affiliateUrl:'https://item.rakuten.co.jp/gorilla55/2011-1012-2/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/gorilla55/cabinet/outdoor/02768102/03299240/mx-604_main_fuwadan.jpg?_ex=128x128'},
    {name:'ARTPIECE ねぶくろん 230T 1.8kg 封筒型 -15度',price:'2780',rakutenRating:'4.39',rakutenReviewCount:'2602',affiliateUrl:'https://item.rakuten.co.jp/artpiece/sd/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/artpiece/cabinet/mainimg/imgrc0150490887.jpg?_ex=128x128'},
    {name:'GARAGE COLLECTION シュラフ 2026モデル 封筒型 オールシーズン',price:'2080',rakutenRating:'4.31',rakutenReviewCount:'1884',affiliateUrl:'https://item.rakuten.co.jp/weiwei/odsbps/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/weiwei/cabinet/shouhin-image02/odsbps_3r.jpg?_ex=128x128'},
    {name:'Naturehike NH21MSD09 3.5シーズン 撥水 封筒型',price:'3990',rakutenRating:'4.20',rakutenReviewCount:'150',affiliateUrl:'https://item.rakuten.co.jp/naturehike-direct/nh21msd09/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/naturehike-direct/cabinet/08960351/08960357/08985356/4-1.jpg?_ex=128x128'},
    {name:'ブリッジカントリー インナーシュラフ 封筒型 薄手',price:'1298',rakutenRating:'4.25',rakutenReviewCount:'579',affiliateUrl:'https://item.rakuten.co.jp/ishi0424/k-innershruff01/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/ishi0424/cabinet/basic-05/k-innershruff01.jpg?_ex=128x128'},
  ],
  'sleeping-bag-winter-beginner': [
    {name:'Bears Rock FX-453G マミー型 -34度 4シーズン センタージップ',price:'17250',rakutenRating:'4.56',rakutenReviewCount:'1110',affiliateUrl:'https://item.rakuten.co.jp/gorilla55/fx-453g/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/gorilla55/cabinet/outdoor/02768102/04157746/fx-453g_main.jpg?_ex=128x128'},
    {name:'Bears Rock FX-432G 封筒型 -30度 ワイド 厚み綿量No1',price:'17250',rakutenRating:'4.62',rakutenReviewCount:'869',affiliateUrl:'https://item.rakuten.co.jp/gorilla55/fx-432g/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/gorilla55/cabinet/outdoor/02768102/fx-503w/fx-503w_main.jpg?_ex=128x128'},
    {name:'Bears Rock FX-403 封筒型 -15度 4シーズン オールシーズン',price:'8900',rakutenRating:'4.48',rakutenReviewCount:'1304',affiliateUrl:'https://item.rakuten.co.jp/gorilla55/fx-403/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/gorilla55/cabinet/outdoor/02768102/04158810/fx-403_main_fuwadan.jpg?_ex=128x128'},
    {name:'Aiflycy Camdoor 寝袋 -25度 冬用 オールシーズン',price:'3980',rakutenRating:'4.47',rakutenReviewCount:'819',affiliateUrl:'https://item.rakuten.co.jp/luxim647/3sd05/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/luxim647/cabinet/3sd/3sd05/imgrc0112082935.jpg?_ex=128x128'},
    {name:'Aiflycy 寝袋 幅広 2人用 3.5シーズン 封筒型',price:'4780',rakutenRating:'4.53',rakutenReviewCount:'1542',affiliateUrl:'https://item.rakuten.co.jp/luxim647/3sd01/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/luxim647/cabinet/3sd/3sd01/imgrc0116522317.jpg?_ex=128x128'},
  ],
  'solo-camp-beginners-guide': [
    {name:'POLeR 1MAN TENT 1人用 超軽量2.2kg コンパクト',price:'22946',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/greenfield-od/pl-1mantent/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/greenfield-od/cabinet/poler/pl-1mantent.jpg?_ex=128x128'},
    {name:'MSR エリクサー1 ドームテント 1人用 ソロキャンプ入門機',price:'35200',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/mitsuyoshi/msr00000000360/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/mitsuyoshi/cabinet/2022/msr/01-2/msr00000000360.jpg?_ex=128x128'},
    {name:'SEMI-STYLE ソロキャンプ入門ドームテント 1〜2人用',price:'4620',rakutenRating:'4.0',rakutenReviewCount:'1',affiliateUrl:'https://item.rakuten.co.jp/semi-style/sh-sh-21-dmt/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/semi-style/cabinet/sh-main/sh-21-dmt_a.jpg?_ex=128x128'},
    {name:'OGAWA タッソT/C ソロキャンプ用テント OG-2727',price:'71500',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/unby/og-2727/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/unby/cabinet/item/og-2727_01.jpg?_ex=128x128'},
    {name:'MY BABY SHOP ペグハンマー ペグケース付き キャンプ設営工具',price:'1500',rakutenRating:'4.38',rakutenReviewCount:'47',affiliateUrl:'https://item.rakuten.co.jp/babyshop--/mbs0034/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/babyshop--/cabinet/outdoor/pegc00p.jpg?_ex=128x128'},
  ],
  'solo-tent-beginner': [
    {name:'BUNDOK BDK-75 ソロティピー モノポール ワンポール 一人用',price:'4980',rakutenRating:'4.46',rakutenReviewCount:'95',affiliateUrl:'https://item.rakuten.co.jp/livinglinks/bdk-75/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/livinglinks/cabinet/bdk-75_v2_1.jpg?_ex=128x128'},
    {name:'Bears Rock TS-201H ハヤブサテント 1〜2人用 ドーム自立式',price:'14250',rakutenRating:'4.55',rakutenReviewCount:'476',affiliateUrl:'https://item.rakuten.co.jp/gorilla55/tent-hayabusa/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/gorilla55/cabinet/outdoor/02973283/05508773/hayabusa-tent-top.jpg?_ex=128x128'},
    {name:'BUNDOK BDK-79 ソロベース TC パップ型 軍幕',price:'6980',rakutenRating:'4.71',rakutenReviewCount:'28',affiliateUrl:'https://item.rakuten.co.jp/livinglinks/bdk-79/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/livinglinks/cabinet/bdk-79_v2_1.jpg?_ex=128x128'},
    {name:'BUNDOK BDK-08O ソロドーム 1人用 自立式 耐水撥水',price:'14800',rakutenRating:'4.75',rakutenReviewCount:'57',affiliateUrl:'https://item.rakuten.co.jp/livinglinks/bdk-08/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/livinglinks/cabinet/bdk-08o_1.jpg?_ex=128x128'},
    {name:'TOMOUNT NY TENT 1〜2人用 超軽量 耐水圧4000mm',price:'19999',rakutenRating:'4.77',rakutenReviewCount:'13',affiliateUrl:'https://item.rakuten.co.jp/tomount/nytent/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/tomount/cabinet/nytent/11960853/01-1.jpg?_ex=128x128'},
  ],
  'two-room-tent-guide': [
    {name:'FIELDOOR トンネルテント 620 4〜8人用 2ルーム 大型',price:'28710',rakutenRating:'4.10',rakutenReviewCount:'190',affiliateUrl:'https://item.rakuten.co.jp/maxshare/a16865/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/maxshare/cabinet/master/1st/a16865.jpg?_ex=128x128'},
    {name:'クーヴァ KURVE 5人用 2ルーム トンネルテント',price:'53480',rakutenRating:'4.10',rakutenReviewCount:'21',affiliateUrl:'https://item.rakuten.co.jp/esports/6000000035579/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/esports/cabinet/6000-205/6000000035579.jpg?_ex=128x128'},
    {name:'Naturehike The hills 2人用 1LDK ツールーム 煙突穴付',price:'39990',rakutenRating:'4.30',rakutenReviewCount:'30',affiliateUrl:'https://item.rakuten.co.jp/naturehike-direct/cnk2300zp017/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/naturehike-direct/cabinet/08942882/09903595/08.jpg?_ex=128x128'},
    {name:'TOMOUNT TriArc 2ルーム トンネルテント 4人用',price:'39999',rakutenRating:'4.40',rakutenReviewCount:'15',affiliateUrl:'https://item.rakuten.co.jp/tomount/triarc-tunnel-tent-v4/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/tomount/cabinet/triarc/1000/1-1.jpg?_ex=128x128'},
    {name:'タンスのゲン ツールームテント 340cm 4〜6人用',price:'29999',rakutenRating:'4.04',rakutenReviewCount:'53',affiliateUrl:'https://item.rakuten.co.jp/tansu/44400010/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/tansu/cabinet/07131939/44400010_10.jpg?_ex=128x128'},
  ],
};

function getAttr(block, attr) {
  const m = block.match(new RegExp(`  ${attr}="([^"]*)"`));
  return m ? m[1] : '';
}

function buildBlock(rank, id, description, badge, d) {
  const lines = [
    '<ProductCardMdx',
    `  rank="${rank}"`,
    `  id="${id}"`,
    `  name="${d.name}"`,
    `  description="${description}"`,
    `  price="${d.price}"`,
    `  rakutenRating="${d.rakutenRating}"`,
    `  rakutenReviewCount="${d.rakutenReviewCount}"`,
    `  affiliateUrl="${d.affiliateUrl}"`,
    `  source="rakuten"`,
  ];
  if (badge) lines.push(`  badge="${badge}"`);
  lines.push(`  image="${d.image}"`);
  lines.push('/>');
  return lines.join('\n');
}

let totalBlocks = 0;
let totalFiles = 0;

for (const [stem, reps] of Object.entries(REPLACEMENTS)) {
  const filepath = path.join(CONTENT_DIR, stem + '.mdx');
  if (!fs.existsSync(filepath)) {
    console.log(`MISSING: ${filepath}`);
    continue;
  }

  let content = fs.readFileSync(filepath, 'utf8');

  // Match ProductCardMdx blocks: opening tag, attribute lines (2 spaces + non-space), closing />
  const blockPattern = /<ProductCardMdx\n(  [^\n]+\n)+\/>/g;
  const blocks = content.match(blockPattern) || [];

  if (blocks.length !== 5) {
    console.log(`WARNING: ${stem} has ${blocks.length} blocks (expected 5)`);
  }

  for (const block of blocks) {
    const rankStr = getAttr(block, 'rank');
    const rankIdx = parseInt(rankStr, 10) - 1;
    if (isNaN(rankIdx) || rankIdx < 0 || rankIdx >= reps.length) {
      console.log(`  skip bad rank="${rankStr}" in ${stem}`);
      continue;
    }
    const id = getAttr(block, 'id');
    const description = getAttr(block, 'description');
    const badge = getAttr(block, 'badge');
    const newBlock = buildBlock(rankStr, id, description, badge, reps[rankIdx]);
    content = content.replace(block, newBlock);
    totalBlocks++;
  }

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`OK: ${stem}.mdx (${blocks.length} blocks)`);
  totalFiles++;
}

console.log(`\nDone: ${totalFiles} files, ${totalBlocks} blocks replaced.`);
