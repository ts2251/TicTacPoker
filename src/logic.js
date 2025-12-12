import { ROWS, COLS, HAND_SCORES } from './constants.js';

export function isValidMove(grid, r, c) {
    if (grid[r][c] !== null) return false;
    const isEmpty = grid.every(row => row.every(cell => cell === null));
    if (isEmpty) return r === 2 && c === 2;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i===0 && j===0) continue;
            const nr = r + i;
            const nc = c + j;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                if (grid[nr][nc] !== null) return true;
            }
        }
    }
    return false;
}

function isStraight(ranks, jokers) {
    const uniqueRanks = new Set(ranks);
    if (uniqueRanks.size + jokers < 5) return false;
    const sorted = Array.from(uniqueRanks).sort((a,b) => a-b);
    
    const checkSeq = (arr) => {
        for (let start = 1; start <= 10; start++) {
            let end = start + 4;
            let count = arr.filter(r => r >= start && r <= end).length;
            if (count + jokers >= 5) return true;
        }
        return false;
    };

    if (checkSeq(sorted)) return true;
    if (sorted.includes(1)) {
        const highAceSorted = sorted.map(r => r === 1 ? 14 : r).sort((a,b) => a-b);
        if (checkSeq(highAceSorted)) return true;
    }
    return false;
}

export function evaluateHand(cards) {
    const jokers = cards.filter(c => c.isJoker).length;
    const normalCards = cards.filter(c => !c.isJoker);
    
    // 役判定用：フラッシュ
    const isFlush = (normalCards.length > 0) && normalCards.every(c => c.suit === normalCards[0].suit);
    
    // 倍率ボーナス用：構成カードの色が統一されているか
    // (Jokerはワイルドなので色判定を邪魔しない、またはJoker含めて全部赤/黒か)
    // ここでは「通常カードが全て同じ色ならOK」とします
    const isSameColor = (normalCards.length > 0) && normalCards.every(c => 
        (c.suit < 2 ? 'black' : 'red') === (normalCards[0].suit < 2 ? 'black' : 'red')
    );

    const counts = {};
    const ranks = [];
    normalCards.forEach(c => { 
        counts[c.rank] = (counts[c.rank] || 0) + 1;
        ranks.push(c.rank);
    });
    
    const countValues = Object.values(counts).sort((a,b) => b-a);
    if (countValues.length > 0) {
        countValues[0] += jokers;
    } else {
        countValues.push(5);
    }

    const straight = isStraight(ranks, jokers);

    let isRoyal = false;
    if (straight && isFlush) {
        const royalRanks = new Set([1, 10, 11, 12, 13]);
        const allNormalAreRoyalParts = normalCards.every(c => royalRanks.has(c.rank));
        if (allNormalAreRoyalParts) isRoyal = true;
    }

    let type = "No Hand";
    let base = 0;
    let removeAll = false;

    if (countValues[0] === 5) { type = "5 Card"; removeAll = true; }
    else if (isRoyal) { type = "Royal Straight Flush"; removeAll = true; }
    else if (straight && isFlush) { type = "Straight Flush"; removeAll = true; }
    else if (countValues[0] === 4) { type = "4 Card"; removeAll = true; }
    else if (countValues[0] === 3 && countValues[1] >= 2) { type = "Full House"; removeAll = true; }
    else if (isFlush) { type = "Flush"; removeAll = true; }
    else if (straight) { type = "Straight"; removeAll = true; }
    else if (countValues[0] === 3) { type = "3 Card"; removeAll = false; }
    else if (countValues[0] === 2 && countValues[1] === 2) { type = "2 Pair"; removeAll = false; }
    else if (countValues[0] === 2) { type = "1 Pair"; removeAll = false; }

    base = base || HAND_SCORES[type] || 0;

    let removeCards = [];
    if (base > 0) {
        if (removeAll) {
            removeCards = cards;
        } else {
            const targetRanks = [];
            for(let r in counts) {
                if (counts[r] + jokers >= 2) {
                    targetRanks.push(parseInt(r));
                }
            }
            removeCards = cards.filter(c => c.isJoker || targetRanks.includes(c.rank));
        }
    }

    return { 
        name: type, 
        score: base, 
        cardsToRemove: removeCards, // 倍率計算にこのカードリストを使う
        isSameColor: isSameColor,
        jokersUsed: jokers
    };
}