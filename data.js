window.CONINI = {
  company: '北京可尼尼食品有限公司',
  // User-set standard applies to every regular flavor, regardless of container.
  standardPack: {weightG:3500,price:280},
  // Container dimensions come from the supplied reference, not net-weight estimates.
  containers: [
    {id:'gn-third',name:'国标 1/3 盆',length:325,width:180,depths:[100,150]},
    {id:'gn-half',name:'国标 1/2 盆',length:325,width:265,depths:[65,100]},
    {id:'eu-third',name:'欧标 1/3 盆',length:360,width:165,depths:[80,120]},
    {id:'eu-half',name:'欧标 1/2 盆',length:360,width:250,depths:[80,120]}
  ],
  // Editorial drafts only. Not complete recipes or allergen declarations.
  ingredientDrafts: {
    'pistachio':'牛乳、稀奶油、开心果酱、开心果碎',
    'hazelnut':'牛乳、稀奶油、榛子酱、糖',
    'hazelnut-chocolate':'牛乳、榛子酱、巧克力、稀奶油',
    'milk':'牛乳、稀奶油、糖',
    'vanilla':'牛乳、稀奶油、香草、糖',
    'oreo':'牛乳、稀奶油、可可夹心饼干碎、糖',
    'strawberry':'牛乳、草莓果泥、稀奶油、糖',
    'mango':'牛乳、芒果果泥、稀奶油、糖',
    'blueberry':'牛乳、蓝莓果泥、稀奶油、糖',
    'cherry':'牛乳、车厘子果肉、稀奶油、糖',
    'durian':'牛乳、榴莲果肉、稀奶油、糖',
    'berries':'牛乳、混合莓果果泥、稀奶油、糖',
    'lemon':'柠檬汁、水、糖',
    'lime':'青柠汁、水、糖',
    'passionfruit':'百香果果浆、水、糖',
    'blood-orange':'血橙果汁、水、糖',
    'guava':'芭乐果泥、水、糖',
    'lychee-dragon':'荔枝果肉、红心火龙果果泥、水、糖',
    'tropical':'芒果果泥、菠萝果汁、百香果果浆、水、糖',
    'orange-grapefruit':'橙汁、柚子果肉、水、糖',
    'matcha':'牛乳、稀奶油、抹茶粉、糖',
    'jasmine':'牛乳、茉莉绿茶、稀奶油、糖',
    'thai-tea':'牛乳、泰式红茶、稀奶油、糖',
    'chocolate':'牛乳、巧克力、可可粉、稀奶油、糖',
    'mint-chocolate':'牛乳、稀奶油、薄荷风味原料、巧克力碎',
    'tiramisu':'牛乳、马斯卡彭奶酪、咖啡、可可粉、饼干碎',
    'rum-raisin':'牛乳、稀奶油、葡萄干、朗姆风味原料',
    'rose-rice':'牛乳、玫瑰酱、酒酿、稀奶油、糖',
    'sea-salt-coconut':'椰浆、牛乳、稀奶油、海盐、糖',
    'charcoal-coconut':'椰浆、牛乳、稀奶油、竹炭风味原料（待确认）',
    'mojito':'青柠汁、薄荷风味原料、水、糖'
  },
  homeSlides: [
    {image:'editorial-collage.webp',alt:'意大利拱廊与莓果 Gelato 的品牌拼贴'},
    {image:'campaign-handcraft-v1.webp',alt:'CONINI 创意海报：秉承传统，坚持手作。冰淇淋铲提起开心果 Gelato。'},
    {image:'campaign-affogato-v1.webp',alt:'CONINI 创意海报：让好风味，成为你的招牌。咖啡、甜品、餐饮出品灵感，浓缩咖啡淋在香草 Gelato 上。'}
  ],
  categories: [['all','全部口味'],['sorbet','清爽雪葩'],['nuts','坚果风味'],['fruit','水果风味'],['milk','经典奶香'],['tea','茶与可可'],['blend','复合风味'],['offers','本期特惠'],['samples','试吃样品']],
  homeFlavorSeries: [
    {category:'sorbet',image:'flavor-banner-sorbet.webp'},
    {category:'nuts',image:'flavor-banner-nuts.webp'},
    {category:'fruit',image:'flavor-banner-fruit.webp'},
    {category:'milk',image:'flavor-banner-milk.webp'},
    {category:'tea',image:'flavor-banner-tea.webp'},
    {category:'blend',image:'flavor-banner-blend.webp'}
  ],
  products: [
    ['pistachio','开心果','PISTACHIO','nuts',108,'浓郁坚果香，温柔而绵密。'],
    ['hazelnut','榛子','HAZELNUT','nuts',96,'烘烤坚果的醇厚余韵。'],
    ['hazelnut-chocolate','榛子巧克力','GIANDUIA','nuts',98,'坚果与可可的经典相遇。'],
    ['milk','鲜牛奶','FIOR DI LATTE','milk',76,'纯粹奶香，回归简单。'],
    ['vanilla','波本香草鲜奶','VANILLA','milk',86,'柔和香草，细腻奶香。'],
    ['oreo','奥利奥牛奶','COOKIES & CREAM','milk',82,'饼干风味与奶香交织。'],
    ['strawberry','红颜草莓','STRAWBERRY','fruit',88,'一口明亮的莓果香气。'],
    ['mango','芒果','MANGO','fruit',88,'饱满热带果香，柔滑悠长。'],
    ['blueberry','蓝莓','BLUEBERRY','fruit',92,'酸甜平衡，层次轻盈。'],
    ['cherry','车厘子','CHERRY','fruit',98,'深红果香，留住夏日。'],
    ['durian','榴莲','DURIAN','fruit',108,'馥郁果香，厚实口感。'],
    ['berries','莓果','MIXED BERRIES','fruit',92,'多重莓果，酸甜有致。'],
    ['lemon','柠檬雪葩','LEMON','sorbet',78,'清亮柑橘香，唤醒味蕾。'],
    ['lime','青柠雪葩','LIME','sorbet',78,'清爽利落的青柠风味。'],
    ['passionfruit','百香果雪葩','PASSION FRUIT','sorbet',86,'鲜明热带香气，酸甜奔放。'],
    ['blood-orange','血橙雪葩','BLOOD ORANGE','sorbet',86,'红橙果香，清新鲜活。'],
    ['guava','芭乐雪葩','GUAVA','sorbet',84,'轻柔芭乐，独特热带风味。'],
    ['lychee-dragon','荔枝火龙果','LYCHEE & DRAGON FRUIT','sorbet',92,'清甜荔枝，明艳果香。'],
    ['tropical','热带水果','TROPICAL FRUIT','sorbet',86,'多种果香，热带灵感。'],
    ['orange-grapefruit','橙子柚子','ORANGE & GRAPEFRUIT','sorbet',84,'柑橘清香，微苦回甘。'],
    ['matcha','抹茶','MATCHA','tea',92,'茶香醇厚，回味清雅。'],
    ['jasmine','茉莉绿茶','JASMINE TEA','tea',88,'花香与茶韵，轻盈相伴。'],
    ['thai-tea','泰式奶茶','THAI TEA','tea',86,'浓茶与奶香的温暖融合。'],
    ['chocolate','巧克力','CHOCOLATE','tea',92,'丰厚可可，细腻丝滑。'],
    ['mint-chocolate','薄荷巧克力','MINT CHOCOLATE','blend',92,'清凉薄荷与醇厚可可。'],
    ['tiramisu','提拉米苏','TIRAMISÙ','blend',96,'熟悉的意式甜点灵感。'],
    ['rum-raisin','朗姆葡萄','RUM RAISIN','blend',96,'葡萄果香，醇厚回味。'],
    ['rose-rice','玫瑰酒酿','ROSE & RICE','blend',92,'柔和花香，东方甜意。'],
    ['sea-salt-coconut','海盐椰椰','SEA SALT COCONUT','blend',88,'一丝咸感，衬托椰香。'],
    ['charcoal-coconut','竹炭椰子','CHARCOAL COCONUT','blend',86,'深色外表，柔和椰香。'],
    ['mojito','莫吉托','MOJITO','blend',88,'清新柑橘，微风般轻盈。']
  ].map(([id,name,en,category,price,description]) => ({id,name,en,category,price,description,image:id,pack:'1 kg',unit:'盒',type:category==='sorbet'?'Sorbetto':'Gelato',offer:['milk','strawberry','mango','chocolate'].includes(id)})),
  materials: [
    {id:'cups',name:'品牌冰淇淋纸杯',en:'GELATO CUPS',price:58,pack:'50只 / 组',description:'统一门店出品形象，杯型与设计待定。'},
    {id:'spoons',name:'品尝勺',en:'TASTING SPOONS',price:18,pack:'100支 / 组',description:'适用于门店试吃与日常出品。'},
    {id:'apron',name:'CONINI 围裙',en:'DAILY APRON',price:98,pack:'1件',description:'酒红色品牌工作围裙，款式待定。'},
    {id:'menu-sign',name:'口味展示牌',en:'FLAVOR SIGNS',price:68,pack:'6张 / 组',description:'帮助顾客认识每一种风味。'},
    {id:'posters',name:'门店宣传海报',en:'IN-STORE POSTERS',price:88,pack:'A3 · 3张',description:'品牌视觉海报，画面与材质待定。'},
    {id:'stickers',name:'品牌贴纸',en:'BRAND STICKERS',price:28,pack:'100张 / 组',description:'为外带包装增添品牌标识。'}
  ].map(p=>({...p,category:'materials',type:'品牌物料',unit:'组'}))
};
// Retain the old kg price solely for previously saved box-order records.
CONINI.products = CONINI.products.map(p => ({...p,legacyKgPrice:p.price,price:CONINI.standardPack.price,pack:`${CONINI.standardPack.weightG} g / 盆`,unit:'盆'}));
CONINI.products.push(
  {id:'sample-classic',name:'经典口味试吃组',en:'CLASSIC TASTING SET',category:'samples',price:48,description:'6种口味组合的选品体验；组合内容为演示。',image:'pistachio',pack:'100 g × 6',unit:'组',type:'试吃样品'},
  {id:'sample-fruit',name:'果香雪葩试吃组',en:'FRUIT TASTING SET',category:'samples',price:42,description:'6种水果风味，帮助门店探索菜单；组合为演示。',image:'passionfruit',pack:'100 g × 6',unit:'组',type:'试吃样品'}
);
