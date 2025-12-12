export const ROWS = 5;
export const COLS = 5;

export const SUITS = ['♠', '♣', '♥', '♦', 'Joker']; 
export const RANK_STR = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 新しい得点表
export const HAND_SCORES = {
    "Royal Straight Flush": 10000,
    "5 Card": 5000,
    "Straight Flush": 3000,
    "4 Card": 1000,
    "Full House": 500,
    "Flush": 300,
    "Straight": 150,
    "3 Card": 100,
    "2 Pair": 30,
    "1 Pair": 10
};