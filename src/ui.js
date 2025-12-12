import { ROWS, COLS, SUITS, RANK_STR, HAND_SCORES } from './constants.js';

// 絵札のアイコン定義
const FACES = {
    11: '⚔️', // J
    12: '♛',  // Q
    13: '👑'  // K
};

/**
 * ランクごとのピップ配置マップ (テンプレート準拠)
 * 3つのカラム [左, 中, 右] に対して、ピップの向きを定義
 * 0=上向き, 1=下向き(回転)
 */
function getPipMap(rank) {
    switch(rank) {
        case 2: return [[], [0, 1], []];
        case 3: return [[], [0, 0, 1], []];
        case 4: return [[0, 1], [], [0, 1]];
        case 5: return [[0, 1], [0], [0, 1]];
        case 6: return [[0, 0, 1], [], [0, 0, 1]];
        case 7: return [[0, 0, 1], [0], [0, 0, 1]];
        case 8: return [[0, 0, 1], [0, 1], [0, 0, 1]];
        case 9: return [[0, 0, 1, 1], [0], [0, 0, 1, 1]];
        case 10: return [[0, 0, 1, 1], [0, 1], [0, 0, 1, 1]];
        default: return [[], [], []];
    }
}

// 中央エリア（ピップまたは絵札）のHTML生成
function createCenterHTML(rank, suitChar) {
    // J, Q, K
    if (rank >= 11) {
        return `<div class="face-icon">${FACES[rank]}</div>`;
    }
    
    // Ace
    if (rank === 1) {
        return `<div class="pip-ace">${suitChar}</div>`;
    }

    // 数字カード (2-10)
    const map = getPipMap(rank);
    if (!map) return '';

    const buildCol = (arr) => {
        let html = `<div class="pip-column">`;
        arr.forEach(type => {
            const rotClass = type === 1 ? 'rotated' : '';
            html += `<div class="pip ${rotClass}">${suitChar}</div>`;
        });
        html += `</div>`;
        return html;
    };

    return `
        <div class="pip-container">
            ${buildCol(map[0])}
            ${buildCol(map[1])}
            ${buildCol(map[2])}
        </div>
    `;
}

// カード全体のHTML生成
function createCardHTML(card) {
    if (!card) return '';
    
    // Joker処理
    if (card.isJoker) {
        return `
            <div class="card joker">
                <div class="card-corner top-left">
                    <span class="rank joker-text">JOKER</span>
                </div>
                <div class="card-center" style="font-size: 3em;">🎭</div>
                <div class="card-corner bottom-right">
                    <span class="rank joker-text">JOKER</span>
                </div>
            </div>
        `;
    }

    const isRed = card.suit === 2 || card.suit === 3;
    const suitClass = isRed ? 'suit-heart' : 'suit-spade'; // 色判定用クラス（赤か黒か）
    const suitChar = SUITS[card.suit];
    const rank = card.rank;
    const rankStr = RANK_STR[rank];

    // ★追加: 10の場合のみクラスを付与するための判定
    const rankModifierClass = rank === 10 ? 'rank-10' : '';

    const centerHtml = createCenterHTML(rank, suitChar);
    
// ★変更箇所: classの横に data-rank="${rank}" を追加しました
    return `
        <div class="card ${suitClass}" data-rank="${rank}">
            <div class="card-corner top-left">
                <span class="rank ${rankModifierClass}">${rankStr}</span>
                <span class="small-suit">${suitChar}</span>
            </div>
            
            <div class="card-center">
                ${centerHtml}
            </div>
            
            <div class="card-corner bottom-right">
                <span class="rank ${rankModifierClass}">${rankStr}</span>
                <span class="small-suit">${suitChar}</span>
            </div>
        </div>
    `;
}

// --- 以下、既存のUI関数 ---

export function initUI(handlers) {
    // 既存のイベントリスナー
    document.getElementById('btn-rules').onclick = () => document.getElementById('rule-modal').style.display = 'flex';
    document.getElementById('btn-close-rules').onclick = () => document.getElementById('rule-modal').style.display = 'none';
    document.getElementById('rule-modal').onclick = (e) => {
        if(e.target === document.getElementById('rule-modal')) document.getElementById('rule-modal').style.display = 'none';
    };
    document.getElementById('btn-reset').onclick = handlers.onReset;
    
    // ゲームオーバー画面のリスタートボタン
    document.getElementById('btn-restart').onclick = () => {
        document.getElementById('game-over-modal').style.display = 'none';
        handlers.onReset();
    };

    const tableDiv = document.getElementById('rules-table-container');
    let html = '<table><tr><th>役</th><th>点</th></tr>';
    for (let [hand, score] of Object.entries(HAND_SCORES)) {
        html += `<tr><td>${hand}</td><td>${score}</td></tr>`;
    }
    html += '</table>';
    tableDiv.innerHTML = html;

    if (!document.getElementById('combo-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'combo-overlay';
        overlay.className = 'combo-overlay';
        document.body.appendChild(overlay);
    }
}

export function renderBoard(grid, nextCard, isValidMoveFn, onCellClick) {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            const hasCard = grid[r][c] !== null;
            const valid = !hasCard && nextCard && isValidMoveFn(r, c);

            if (valid) {
                cell.classList.add('valid');
                cell.onclick = () => onCellClick(r, c);
            }

            if (hasCard) {
                cell.innerHTML = createCardHTML(grid[r][c]);
            }
            boardEl.appendChild(cell);
        }
    }
}

export function updateInfo(score, deckCount, nextCard) {
    document.getElementById('score').innerText = Math.floor(score).toLocaleString();
    document.getElementById('deck-count').innerText = deckCount;
    
    const nextEl = document.getElementById('next-card');
    if (nextCard) {
        nextEl.innerHTML = '';
        nextEl.className = 'card-preview';
        nextEl.innerHTML = createCardHTML(nextCard);
    } else {
        nextEl.className = 'card-preview empty';
        nextEl.innerHTML = '';
    }
}

// 引数 isLong を追加して、文字サイズを調整できるようにする
export function showComboEffect(text, isLong = false) {
    const el = document.getElementById('combo-overlay');
    
    // 改行コードをHTMLタグに変換
    el.innerHTML = text.replace(/\n/g, '<br>');
    
    // クラス操作でスタイル切り替え
    if (isLong) {
        el.classList.add('long-text');
    } else {
        el.classList.remove('long-text');
    }
    
    el.classList.add('show');
    
    // 表示時間を少し長めに
    setTimeout(() => {
        el.classList.remove('show');
    }, 2000);
}

export function addLog(msg) {
    const logEl = document.getElementById('game-log');
    logEl.innerHTML = `<div class="log-entry">${msg}</div>` + logEl.innerHTML;
}

// ゲーム終了画面の表示 (新規追加)
export function showGameOver(title, score) {
    const modal = document.getElementById('game-over-modal');
    document.getElementById('end-title').innerText = title;
    document.getElementById('end-score').innerText = Math.floor(score).toLocaleString();
    modal.style.display = 'flex';
}

// ... (既存のimportや関数はそのまま) ...

// 末尾に追加

/**
 * 消滅対象のカードにアニメーションクラスを付与する
 * @param {Array} grid - 現在の盤面データ
 * @param {Array} cardsToRemove - 消去対象のカードオブジェクト配列
 */
export function animateRemoval(grid, cardsToRemove) {
    const boardEl = document.getElementById('board');
    const cells = boardEl.children; // 全セルを取得 (flatな配列状)

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const card = grid[r][c];
            // このマスのカードが消去リストに含まれているか確認
            if (card && cardsToRemove.includes(card)) {
                // インデックス計算 (grid layoutの順番通り)
                const index = r * COLS + c;
                const cell = cells[index];
                
                // cellの中にある .card 要素を取得
                const cardEl = cell.querySelector('.card');
                if (cardEl) {
                    cardEl.classList.add('eliminating');
                }
            }
        }
    }
}