// 場景與目標語塊資料。
// 想擴充？在陣列裡多加一個場景物件即可，不需要改其他檔案。
//
// 每個場景：
//   id      唯一代號（也用在進度儲存）
//   emoji   icon
//   title   中文場景名
//   aiName  AI 扮演的角色名字
//   aiRole  AI 角色設定（給模型看，用英文）
//   goal    這次的任務目標（英文，給模型）
//   goalZh  任務目標（中文，給家長/孩子看）
//   opener  AI 的第一句開場白（會直接念出來，不用多花一次 API）
//   chunks  目標語塊清單，每個：
//            en       要學的整句語塊（給孩子/家長看）
//            zh       中文意思
//            patterns 用來偵測「孩子有沒有說出來」的關鍵片語（小寫、去標點後比對）

window.SCENES = [
  {
    id: "ice-cream",
    emoji: "🍦",
    title: "冰淇淋店",
    avatar: "🧑‍🍳",
    bg: "linear-gradient(180deg,#ffe9f2 0%,#fff7ee 100%)",
    props: [
      { e: "🍦", x: "58%", y: "22%", s: 34, d: 0 },
      { e: "🍨", x: "70%", y: "45%", s: 30, d: 0.6 },
      { e: "🧁", x: "83%", y: "20%", s: 32, d: 1.2 },
      { e: "🍓", x: "92%", y: "50%", s: 26, d: 0.3 },
      { e: "🎀", x: "47%", y: "50%", s: 24, d: 0.9 }
    ],
    aiName: "Sam",
    aiRole: "a friendly ice cream shop server named Sam",
    goal: "Help the child order one scoop of chocolate ice cream and ask how much it costs.",
    goalZh: "點一球巧克力冰淇淋，並問多少錢",
    opener: "Hi there! Welcome to my ice cream shop! What can I get for you?",
    chunks: [
      { en: "Can I have ...?", zh: "我可以要…嗎？", patterns: ["can i have", "could i have"] },
      { en: "I want chocolate, please.", zh: "我想要巧克力，謝謝。", patterns: ["i want chocolate", "chocolate please"] },
      { en: "One scoop, please.", zh: "一球，謝謝。", patterns: ["one scoop"] },
      { en: "How much is it?", zh: "多少錢？", patterns: ["how much is it", "how much"] },
      { en: "Thank you!", zh: "謝謝你！", patterns: ["thank you", "thanks"] }
    ]
  },
  {
    id: "playground",
    emoji: "🛝",
    title: "公園交朋友",
    avatar: "👧",
    bg: "linear-gradient(180deg,#cfe9ff 0%,#f3fbff 100%)",
    props: [
      { e: "☀️", x: "90%", y: "12%", s: 36, d: 0 },
      { e: "🛝", x: "60%", y: "38%", s: 40, d: 0.5 },
      { e: "🌳", x: "45%", y: "45%", s: 36, d: 1 },
      { e: "🌳", x: "78%", y: "48%", s: 30, d: 0.2 },
      { e: "🦋", x: "70%", y: "15%", s: 24, d: 0.8 }
    ],
    aiName: "Mia",
    aiRole: "a friendly 9-year-old kid named Mia playing at the playground",
    goal: "Help the child say hello, introduce their name, and ask Mia to play together.",
    goalZh: "打招呼、說自己的名字、邀請對方一起玩",
    opener: "Hi! I'm Mia. This slide is so fun! What's your name?",
    chunks: [
      { en: "Hi, my name is ...", zh: "嗨，我的名字是…", patterns: ["my name is", "i'm ", "i am "] },
      { en: "What's your name?", zh: "你叫什麼名字？", patterns: ["what's your name", "what is your name"] },
      { en: "Can I play with you?", zh: "我可以跟你一起玩嗎？", patterns: ["can i play with you", "play with you"] },
      { en: "Let's play together!", zh: "我們一起玩吧！", patterns: ["let's play", "lets play", "play together"] },
      { en: "That's fun!", zh: "好好玩！", patterns: ["that's fun", "thats fun", "so fun"] }
    ]
  },
  {
    id: "airport",
    emoji: "✈️",
    title: "機場入境",
    avatar: "👮",
    bg: "linear-gradient(180deg,#dfe9ff 0%,#f6f8ff 100%)",
    props: [
      { e: "✈️", x: "75%", y: "15%", s: 40, d: 0 },
      { e: "🛂", x: "55%", y: "45%", s: 34, d: 0.5 },
      { e: "🧳", x: "88%", y: "50%", s: 30, d: 1 },
      { e: "☁️", x: "45%", y: "12%", s: 30, d: 0.3 },
      { e: "☁️", x: "92%", y: "28%", s: 24, d: 0.9 }
    ],
    aiName: "Officer Lee",
    aiRole: "a kind airport immigration officer named Officer Lee",
    goal: "Help the child greet the officer, say they are here for a holiday, and say how many days they will stay.",
    goalZh: "跟海關打招呼、說來度假、說要待幾天",
    opener: "Hello! Welcome. May I see your passport, please?",
    chunks: [
      { en: "Here you are.", zh: "在這裡（遞東西）。", patterns: ["here you are", "here it is"] },
      { en: "I'm here for a holiday.", zh: "我來度假。", patterns: ["here for a holiday", "for a holiday", "on holiday", "for vacation"] },
      { en: "I will stay for ... days.", zh: "我會待…天。", patterns: ["stay for", "days"] },
      { en: "Thank you, officer.", zh: "謝謝你，警官。", patterns: ["thank you officer", "thank you", "thanks"] }
    ]
  },
  {
    id: "restaurant",
    emoji: "🍜",
    title: "餐廳點餐",
    avatar: "👩‍🍳",
    bg: "linear-gradient(180deg,#fff1dc 0%,#fff9ef 100%)",
    props: [
      { e: "🏮", x: "50%", y: "12%", s: 30, d: 0 },
      { e: "🍜", x: "62%", y: "45%", s: 36, d: 0.4 },
      { e: "🥟", x: "78%", y: "22%", s: 28, d: 0.8 },
      { e: "🍵", x: "90%", y: "45%", s: 28, d: 0.2 },
      { e: "🥢", x: "45%", y: "42%", s: 24, d: 1 }
    ],
    aiName: "Tina",
    aiRole: "a warm restaurant waiter named Tina",
    goal: "Help the child order noodles and a glass of water, and ask for the bill at the end.",
    goalZh: "點一份麵和一杯水，最後請她結帳",
    opener: "Welcome! Here is the menu. Are you ready to order?",
    chunks: [
      { en: "I'd like the noodles, please.", zh: "我想要麵，謝謝。", patterns: ["i'd like", "i would like", "the noodles", "noodles please"] },
      { en: "Can I have some water?", zh: "可以給我一些水嗎？", patterns: ["can i have some water", "some water", "a glass of water"] },
      { en: "Yes, please. / No, thank you.", zh: "好，謝謝。／不用，謝謝。", patterns: ["yes please", "no thank you", "no thanks"] },
      { en: "Can I have the bill, please?", zh: "可以結帳嗎？", patterns: ["the bill", "the check", "can i pay"] }
    ]
  },
  {
    id: "toy-shop",
    emoji: "🧸",
    title: "玩具店",
    avatar: "🧔",
    bg: "linear-gradient(180deg,#e8f5e9 0%,#f7fff6 100%)",
    props: [
      { e: "🧸", x: "55%", y: "45%", s: 34, d: 0 },
      { e: "🚗", x: "68%", y: "20%", s: 30, d: 0.5 },
      { e: "🎁", x: "82%", y: "45%", s: 30, d: 1 },
      { e: "🪀", x: "92%", y: "18%", s: 26, d: 0.3 },
      { e: "🎈", x: "45%", y: "15%", s: 28, d: 0.7 }
    ],
    aiName: "Ben",
    aiRole: "a cheerful toy shop owner named Ben",
    goal: "Help the child say they are looking for a toy car, ask the price, and say it is too expensive or that they will buy it.",
    goalZh: "說要找玩具車、問價錢、說太貴了或決定要買",
    opener: "Hello! Welcome to the toy shop! What are you looking for?",
    chunks: [
      { en: "I'm looking for a toy car.", zh: "我在找一台玩具車。", patterns: ["looking for", "a toy car", "toy car"] },
      { en: "How much is this?", zh: "這個多少錢？", patterns: ["how much is this", "how much"] },
      { en: "That's too expensive.", zh: "那太貴了。", patterns: ["too expensive", "that's expensive"] },
      { en: "I'll take it!", zh: "我要買它！", patterns: ["i'll take it", "ill take it", "i will take it", "i'll buy it"] }
    ]
  },
  {
    id: "directions",
    emoji: "🗺️",
    title: "問路",
    avatar: "👴",
    bg: "linear-gradient(180deg,#d8f3dc 0%,#f6fff4 100%)",
    props: [
      { e: "🌳", x: "50%", y: "40%", s: 36, d: 0 },
      { e: "🪧", x: "65%", y: "45%", s: 32, d: 0.4 },
      { e: "🚻", x: "80%", y: "20%", s: 30, d: 0.8 },
      { e: "🗺️", x: "92%", y: "45%", s: 28, d: 0.2 },
      { e: "⛲", x: "45%", y: "15%", s: 30, d: 0.6 }
    ],
    aiName: "Grandpa Joe",
    aiRole: "a friendly old man named Grandpa Joe walking in the park",
    goal: "Help the child politely ask where the toilet is, and thank the person.",
    goalZh: "禮貌地問廁所在哪、並道謝",
    opener: "Oh, hello there! You look a little lost. Do you need help?",
    chunks: [
      { en: "Excuse me.", zh: "不好意思（叫住人）。", patterns: ["excuse me"] },
      { en: "Where is the toilet?", zh: "廁所在哪裡？", patterns: ["where is the toilet", "where's the toilet", "where is the bathroom", "where's the bathroom"] },
      { en: "Can you help me?", zh: "你可以幫我嗎？", patterns: ["can you help me", "help me"] },
      { en: "Thank you so much!", zh: "非常謝謝你！", patterns: ["thank you so much", "thank you", "thanks"] }
    ]
  }
];
