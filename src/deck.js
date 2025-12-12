export function createDeck() {
    let deck = [];
    // 通常の52枚
    for(let s=0; s<4; s++) {
        for(let r=1; r<=13; r++) {
            deck.push({ suit: s, rank: r, isJoker: false });
        }
    }
    // ジョーカー2枚
    deck.push({ suit: 4, rank: 99, isJoker: true });
    deck.push({ suit: 4, rank: 99, isJoker: true });
    return deck;
}

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}