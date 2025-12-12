import { ROWS, COLS } from './constants.js';
import { createDeck, shuffle } from './deck.js';
import { isValidMove, evaluateHand } from './logic.js';
import * as UI from './ui.js';

let deck = [];
let grid = [];
let currentNextCard = null;
let score = 0;
let isGameOver = false;

function initGame() {
    score = 0;
    isGameOver = false;
    grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    deck = shuffle(createDeck());
    
    UI.addLog("ゲーム開始");
    
    const jokerIndex = deck.findIndex(c => c.isJoker);
    if(jokerIndex > -1) {
        grid[2][2] = deck.splice(jokerIndex, 1)[0];
    }
    
    drawNextCard();
    refreshView();
}

function drawNextCard() {
    if (deck.length > 0) {
        currentNextCard = deck.pop();
    } else {
        currentNextCard = null;
    }
}

function handleCellClick(r, c) {
    if (isGameOver || !currentNextCard) return;
    if (!isValidMove(grid, r, c)) return;

    grid[r][c] = currentNextCard;
    currentNextCard = null;
    refreshView(); 

    setTimeout(() => {
        processTurn();
    }, 300);
}

function processTurn() {
    const lines = [];
    for(let r=0; r<ROWS; r++) lines.push({ cards: grid[r], type: 'row' });
    for(let c=0; c<COLS; c++) lines.push({ cards: grid.map(row => row[c]), type: 'col' });
    lines.push({ cards: [grid[0][0], grid[1][1], grid[2][2], grid[3][3], grid[4][4]], type: 'd1' });
    lines.push({ cards: [grid[0][4], grid[1][3], grid[2][2], grid[3][1], grid[4][0]], type: 'd2' });

    let turnEvents = [];
    
    lines.forEach(line => {
        if (line.cards.every(c => c !== null)) {
            const hand = evaluateHand(line.cards);
            if (hand.score > 0) {
                turnEvents.push(hand);
            }
        }
    });

    if (turnEvents.length > 0) {
        handleScoreAndClear(turnEvents);
    } else {
        finishTurn();
    }
}

// スコア計算用ヘルパー：カードの値を決定する
// A=10, J=11, Q=12, K=13, Joker=13(便宜上)
function getCardValue(card) {
    if (card.isJoker) return 13; 
    if (card.rank === 1) return 10; // Aは10扱い
    return card.rank;
}

function handleScoreAndClear(events) {
    let logMsg = "";
    let cardsToRemoveAll = [];
    let handScores = [];
    
    // 演出表示用のテキスト配列
    let displayTexts = [];

    events.forEach(h => {
        // 1. 数字倍率
        let maxRankVal = 0;
        h.cardsToRemove.forEach(c => {
            const val = getCardValue(c);
            if (val > maxRankVal) maxRankVal = val;
        });
        let rankMult = maxRankVal / 5;
        
        // 2. 色倍率
        let suitMult = h.isSameColor ? 2.0 : 1.0;

        // 単体スコア (小数点は切り捨てて表示を綺麗にする)
        let singleHandScore = Math.floor(h.score * rankMult * suitMult);
        
        handScores.push(singleHandScore);
        
        // ログと演出用テキスト作成
        // 例: "Flush (+1,200)"
        const scoreStr = singleHandScore.toLocaleString();
        logMsg += `${h.name}(${scoreStr}) `;
        displayTexts.push(`${h.name}\n+${scoreStr}`);

        h.cardsToRemove.forEach(c => {
            if (!cardsToRemoveAll.includes(c)) {
                cardsToRemoveAll.push(c);
            }
        });
    });

    // コンボ計算 (掛け算)
    let totalPoints = handScores.reduce((acc, curr) => acc * curr, 1);

    // 演出の分岐
    if (events.length > 1) {
        logMsg += ` x COMBO!`;
        
        // コンボ時の演出テキスト作成
        // "Flush (+300)"
        // "2 Pair (+60)"
        // "COMBO BONUS! Total: 18,000"
        let comboText = displayTexts.join('\n×\n'); // 掛け算記号でつなぐ
        comboText += `\n\nTotal: ${totalPoints.toLocaleString()}!!`;
        
        UI.showComboEffect(comboText, true); // trueは「文字サイズ調整用フラグ」推奨
    } else {
        // 単発
        totalPoints = handScores[0];
        UI.showComboEffect(displayTexts[0]);
    }

    // パーフェクトクリア判定
    const currentCardCount = grid.flat().filter(c => c !== null).length;
    const uniqueRemoveCount = new Set(cardsToRemoveAll).size;
    
    if (uniqueRemoveCount === currentCardCount) {
        totalPoints *= 10;
        logMsg += " [ALL CLEAR x10!!]";
        // 少し遅らせてクリア演出で上書き
        setTimeout(() => UI.showComboEffect("PERFECT CLEAR!!\nSCORE x10", true), 800);
    }

    score += Math.floor(totalPoints);
    UI.addLog(logMsg);

// ★追加: データ消去の前にアニメーションを開始★
    UI.animateRemoval(grid, cardsToRemoveAll);

    // ★変更: 待ち時間をアニメーションに合わせて調整 (0.8sのアニメなので1000ms待つ)
    setTimeout(() => {
        // ここで初めてデータを消す
        for(let r=0; r<ROWS; r++) {
            for(let c=0; c<COLS; c++) {
                if (grid[r][c] && cardsToRemoveAll.includes(grid[r][c])) {
                    grid[r][c] = null;
                }
            }
        }
        finishTurn();
    }, 1000); // アニメーション完了を待って次へ
}

function finishTurn() {
    checkGameEnd();
    if (!isGameOver) {
        drawNextCard();
        refreshView();
    }
}

function checkGameEnd() {
    if (deck.length === 0 && currentNextCard === null) {
        isGameOver = true;
        refreshView();
        setTimeout(() => UI.showGameOver("COMPLETE!", score), 500);
        return;
    }
    const isFull = grid.flat().every(c => c !== null);
    if (isFull) {
         isGameOver = true;
         refreshView();
         setTimeout(() => UI.showGameOver("GAME OVER", score), 500);
    }
}

function refreshView() {
    UI.updateInfo(score, deck.length, currentNextCard);
    UI.renderBoard(grid, currentNextCard, (r,c) => isValidMove(grid, r, c), handleCellClick);
}

UI.initUI({ onReset: initGame });
initGame();