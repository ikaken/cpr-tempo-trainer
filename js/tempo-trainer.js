/**
 * テンポトレーナーの中核機能
 */

// 定数
const STANDARD_BPM = 100;        // 標準テンポ（BPM）
const MIN_ACCEPTABLE_BPM = 90;   // 許容最小テンポ
const MAX_ACCEPTABLE_BPM = 110;  // 許容最大テンポ
const MIN_BPM = 80;              // 最小テンポ（これ未満でゲームオーバー）
const MAX_BPM = 120;             // 最大テンポ（これ超過でゲームオーバー）
const WARMUP_COUNT = 8;          // ウォームアップでの必要タップ回数
// 動画再生終了までゲームを続けるため、タップ回数の制限を削除

// ゲーム状態
const gameState = {
    mode: 'start',         // start, warmup, game, result
    warmupTaps: [],        // ウォームアップでのタップ時間記録
    gameTaps: [],          // ゲーム中のタップ時間記録
    currentBpm: STANDARD_BPM,  // 現在のBPM
    beatCount: 0,          // 現在のビート数
    isGameOver: false      // ゲームオーバーフラグ
};

// DOM要素の参照
let elements = {};

/**
 * テンポトレーナーの初期化
 */
function initTempoTrainer() {
    // DOM要素の参照を取得
    elements = {
        // タブ関連
        tabButtons: document.querySelectorAll('.tab-button'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // スタート画面
        startWarmupButton: document.getElementById('start-warmup'),
        
        // ウォームアップ画面
        warmupCounter: document.getElementById('warmup-counter'),
        warmupTotal: document.getElementById('warmup-total'),
        warmupFeedback: document.getElementById('warmup-feedback'),
        warmupBpm: document.getElementById('warmup-bpm'),
        
        // ゲーム画面
        tempoNeedle: document.querySelector('.tempo-needle'),
        beatCount: document.getElementById('beat-count'),
        currentBpm: document.getElementById('current-bpm'),
        tempoFeedback: document.getElementById('tempo-feedback'),
        
        // 結果画面
        resultMessage: document.getElementById('result-message'),
        resultStats: document.getElementById('result-stats'),
        resetGameButton: document.getElementById('reset-game')
    };
    
    // 初期表示の設定
    elements.warmupTotal.textContent = WARMUP_COUNT;
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // YouTube動画再生終了イベントのリスナーを追加
    document.addEventListener('youtube-video-ended', function() {
        // ゲームモードの場合のみ処理
        if (gameState.mode === 'game' && !gameState.isGameOver) {
            console.log('Video ended, ending game');
            gameOver(true); // 動画が終了したのでゲームクリアとして終了
        }
    });
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // スペースキーのイベントリスナーを設定する前に、既存のリスナーを削除
    // スペースキーハンドラーを参照できるように変数化
    const spaceKeyHandler = function(event) {
        if (event.code === 'Space') {
            event.preventDefault(); // スクロールを防止
            console.log('スペースキーが押されました');
            handleSpaceKey();
        }
    };
    
    // グローバル変数にハンドラーを保存
    window.spaceKeyHandler = spaceKeyHandler;
    
    // スペースキーのイベントリスナーを設定
    document.addEventListener('keydown', spaceKeyHandler);
    
    // スタートボタンのイベントリスナー
    if (elements.startWarmupButton) {
        console.log('ウォームアップ開始ボタンにイベントリスナーを設定します');
        elements.startWarmupButton.addEventListener('click', function() {
            console.log('ウォームアップ開始ボタンがクリックされました');
            startWarmup();
        });
    } else {
        console.error('setupEventListeners: ウォームアップ開始ボタンが見つかりません');
    }
    
    // リセットボタンのイベントリスナー
    if (elements.resetGameButton) {
        elements.resetGameButton.addEventListener('click', resetGame);
    } else {
        console.error('setupEventListeners: リセットボタンが見つかりません');
    }
    
    // タブ切り替えのイベントリスナー
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
}

/**
 * タブを切り替える
 * @param {string} tabName - 表示するタブの名前
 */
function switchTab(tabName) {
    console.log(`タブ切り替えが呼び出されました: ${tabName}`);
    
    // DOM要素を直接取得して切り替える
    // タブボタンの切り替え
    const tabButtons = document.querySelectorAll('.tab-button');
    console.log(`タブボタン数: ${tabButtons.length}`);
    
    tabButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.tab === tabName) {
            button.classList.add('active');
            console.log(`タブボタンをアクティブ化: ${button.dataset.tab}`);
        }
    });
    
    // タブコンテンツの切り替え
    const tabContents = document.querySelectorAll('.tab-content');
    console.log(`タブコンテンツ数: ${tabContents.length}`);
    
    tabContents.forEach(content => {
        content.classList.remove('active');
        console.log(`確認中のタブコンテンツID: ${content.id}, 対象タブ: ${tabName}-tab`);
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
            console.log(`タブコンテンツをアクティブ化しました: ${content.id}`);
        }
    });
}

/**
 * スペースキー押下時の処理
 */
function handleSpaceKey() {
    const timestamp = Date.now();
    
    switch (gameState.mode) {
        case 'warmup':
            // 既に8回のタップが完了している場合は何もしない
            if (gameState.warmupTaps.length >= WARMUP_COUNT) {
                return;
            }
            handleWarmupTap(timestamp);
            break;
        case 'game':
            handleGameTap(timestamp);
            break;
    }
}

/**
 * ウォームアップを開始
 */
function startWarmup() {
    console.log('ウォームアップ開始関数が呼び出されました');
    
    try {
        console.log('タブ切り替えを開始します');
        switchTab('warmup');
        console.log('タブ切り替えが完了しました');
        
        gameState.mode = 'warmup';
        gameState.warmupTaps = [];
        gameState.currentBpm = STANDARD_BPM;
        console.log('ゲーム状態を設定しました: ' + gameState.mode);
        
        console.log('ウォームアップカウンターを更新します');
        updateWarmupCounter(0);
        
        if (elements.warmupFeedback) {
            elements.warmupFeedback.textContent = 'スペースキーを押してテンポを測定してください';
            elements.warmupFeedback.style.color = '';
            console.log('フィードバックテキストを設定しました');
        } else {
            console.error('warmupFeedback要素が見つかりません');
        }
        
        if (elements.warmupBpm) {
            elements.warmupBpm.textContent = '';
            console.log('BPM表示をクリアしました');
        } else {
            console.error('warmupBpm要素が見つかりません');
        }
        
        console.log('ウォームアップ開始関数が正常に完了しました');
    } catch (error) {
        console.error('ウォームアップ開始中にエラーが発生しました:', error);
    }
}

/**
 * ウォームアップでのタップを処理
 * @param {number} timestamp - タップした時刻（ミリ秒）
 */
function handleWarmupTap(timestamp) {
    // 既に必要回数に達している場合は何もしない
    if (gameState.warmupTaps.length >= WARMUP_COUNT) {
        return;
    }
    
    gameState.warmupTaps.push(timestamp);
    updateWarmupCounter(gameState.warmupTaps.length);
    
    // 最初のタップの場合は何もしない
    if (gameState.warmupTaps.length === 1) {
        elements.warmupFeedback.textContent = 'そのまま続けてください...';
        return;
    }
    
    // 2回目以降のタップでBPMを計算
    const lastTap = gameState.warmupTaps[gameState.warmupTaps.length - 1];
    const prevTap = gameState.warmupTaps[gameState.warmupTaps.length - 2];
    const interval = lastTap - prevTap;
    
    if (interval > 0) {
        // BPM = 60秒 / (インターバル秒)
        const currentBpm = Math.round(60000 / interval); // ミリ秒を秒に変換して計算
        gameState.currentBpm = currentBpm;
        elements.warmupBpm.textContent = `現在のBPM: ${currentBpm}`;
        
        // フィードバック
        if (currentBpm < MIN_ACCEPTABLE_BPM) {
            elements.warmupFeedback.textContent = 'もう少し速く！';
            elements.warmupFeedback.style.color = '#FF9800';
        } else if (currentBpm > MAX_ACCEPTABLE_BPM) {
            elements.warmupFeedback.textContent = 'もう少しゆっくり！';
            elements.warmupFeedback.style.color = '#FF9800';
        } else {
            elements.warmupFeedback.textContent = '良いテンポです！';
            elements.warmupFeedback.style.color = '#4CAF50';
        }
    }
    
    // 必要回数に達したらウォームアップ終了
    if (gameState.warmupTaps.length === WARMUP_COUNT) {
        finishWarmup();
    }
}

/**
 * ウォームアップのカウンターを更新
 * @param {number} count - 現在のカウント
 */
function updateWarmupCounter(count) {
    console.log(`updateWarmupCounterが呼び出されました: ${count}`);
    
    try {
        if (elements.warmupCounter) {
            elements.warmupCounter.textContent = count;
            console.log(`ウォームアップカウンターを更新しました: ${count}`);
        } else {
            console.error('warmupCounter要素が見つかりません');
        }
    } catch (error) {
        console.error('ウォームアップカウンターの更新中にエラーが発生しました:', error);
    }
}

/**
 * ウォームアップを終了し、結果を評価
 */
function finishWarmup() {
    // 平均BPMを計算
    const intervals = [];
    for (let i = 1; i < gameState.warmupTaps.length; i++) {
        const interval = gameState.warmupTaps[i] - gameState.warmupTaps[i-1];
        intervals.push(interval);
    }
    
    if (intervals.length > 0) {
        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const avgBpm = Math.round(60000 / avgInterval); // ミリ秒を秒に変換
        gameState.currentBpm = avgBpm;
        
        // フィードバック
        if (MIN_ACCEPTABLE_BPM <= avgBpm && avgBpm <= MAX_ACCEPTABLE_BPM) {
            elements.warmupFeedback.textContent = `素晴らしい！平均BPM: ${avgBpm}、目標: ${STANDARD_BPM}`;
            elements.warmupFeedback.style.color = '#4CAF50';
        } else {
            elements.warmupFeedback.textContent = `注意: テンポが不適切です。平均BPM: ${avgBpm}、目標: ${STANDARD_BPM}`;
            elements.warmupFeedback.style.color = '#FF9800';
        }
        
        // ゲームタブに切り替え
        setTimeout(() => {
            switchTab('game');
            gameState.mode = 'game';
            gameState.beatCount = 0;
            gameState.gameTaps = [];
            gameState.isGameOver = false;
            
            // ゲーム画面の初期化
            if (elements.beatCount) {
                elements.beatCount.textContent = '0';
            }
            
            if (elements.tempoNeedle) {
                updateTempoNeedle(gameState.currentBpm);
            }
            
            if (elements.tempoFeedback) {
                elements.tempoFeedback.textContent = 'スペースキーを押してテンポを維持してください';
                elements.tempoFeedback.style.color = '';
            }
            
            // YouTube動画を再生開始
            console.log('YouTube Playerの準備状態を確認します');
            
            // プレーヤーの準備状態を確認してから再生開始
            if (typeof YouTubePlayer !== 'undefined') {
                // isReady関数が定義されている場合は使用
                if (typeof YouTubePlayer.isReady === 'function' && YouTubePlayer.isReady()) {
                    console.log('ウォームアップ完了後に動画再生開始 - プレーヤー準備完了');
                    YouTubePlayer.playVideo();
                } else if (typeof YouTubePlayer.playVideo === 'function') {
                    // isReady関数がないか、falseを返す場合は直接再生を試みる
                    console.log('ウォームアップ完了後に動画再生開始 - 準備状態不明');
                    YouTubePlayer.playVideo();
                } else {
                    console.error('YouTube PlayerのplayVideoメソッドが利用可能ではありません');
                    // 代替方法としてplayYouTubeVideo関数を呼び出す
                    playYouTubeVideo();
                }
            } else {
                console.error('YouTube Playerが定義されていません');
                // 代替方法としてplayYouTubeVideo関数を呼び出す
                playYouTubeVideo();
            }
        }, 0); // 遅延なしでゲーム開始
    }
}

/**
 * YouTube動画を再生する
 * 動画再生の遅延を最小化するため、プレーヤーの状態を確認して再生を開始します
 */
function playYouTubeVideo() {
    try {
        console.log('ウォームアップ後に動画再生を開始します');
        
        // グローバルのYouTubePlayerオブジェクトを使用
        if (typeof YouTubePlayer !== 'undefined') {
            // プレーヤーの状態を確認
            const isReady = typeof YouTubePlayer.isReady === 'function' ? YouTubePlayer.isReady() : false;
            console.log('YouTube Playerの準備状態: ' + (isReady ? '準備完了' : '準備中'));
            
            if (typeof YouTubePlayer.playVideo === 'function') {
                YouTubePlayer.playVideo();
                console.log('YouTubePlayer.playVideo()を使用して再生開始');
                return;
            }
        }
        
        // プレーヤーオブジェクトを直接取得してみる
        if (typeof player !== 'undefined' && player && typeof player.playVideo === 'function') {
            player.playVideo();
            console.log('player.playVideo()を使用して再生開始');
            return;
        }
        
        // フォールバック: loadVideo関数を使用
        if (typeof loadVideo === 'function' && typeof currentVideoId !== 'undefined' && currentVideoId) {
            loadVideo(currentVideoId, true); // 自動再生を有効にして読み込み
            console.log('loadVideo関数を使用して再生開始');
            return;
        }
        
        // 最終手段: iframeを直接操作
        const playerIframe = document.getElementById('player');
        if (playerIframe) {
            const currentSrc = playerIframe.src;
            if (currentSrc.includes('?')) {
                playerIframe.src = currentSrc.split('?')[0] + '?autoplay=1';
            } else {
                playerIframe.src = currentSrc + '?autoplay=1';
            }
            console.log('iframeを使用してYouTube動画の再生を開始しました');
        } else {
            console.error('プレーヤー要素が見つかりません');
        }
    } catch (error) {
        console.error('YouTube動画の再生中にエラーが発生しました:', error);
    }
}

/**
 * ゲームを開始
 */
function startGame() {
    switchTab('game');
    gameState.mode = 'game';
    gameState.gameTaps = [];
    gameState.beatCount = 0;
    gameState.isGameOver = false;
    
    updateBeatCounter(0);
    updateCurrentBpm(gameState.currentBpm);
    elements.tempoFeedback.textContent = 'スペースキーを押してテンポを維持してください';
    elements.tempoFeedback.style.color = '';
    updateTempoNeedle(gameState.currentBpm);
}

/**
 * ゲーム中のタップを処理
 * @param {number} timestamp - タップした時刻（ミリ秒）
 */
function handleGameTap(timestamp) {
    if (gameState.isGameOver) {
        return;
    }
    
    gameState.gameTaps.push(timestamp);
    gameState.beatCount++;
    updateBeatCounter(gameState.beatCount);
    
    // 最初のタップの場合は何もしない
    if (gameState.gameTaps.length === 1) {
        return;
    }
    
    // 2回目以降のタップでBPMを計算
    const lastTap = gameState.gameTaps[gameState.gameTaps.length - 1];
    const prevTap = gameState.gameTaps[gameState.gameTaps.length - 2];
    const interval = lastTap - prevTap;
    
    if (interval > 0) {
        // BPM = 60秒 / (インターバル秒)
        const currentBpm = Math.round(60000 / interval); // ミリ秒を秒に変換して計算
        gameState.currentBpm = currentBpm;
        updateCurrentBpm(currentBpm);
        updateTempoIndicator();
        
        // テンポが許容範囲外ならゲームオーバー
        if (currentBpm < MIN_BPM || currentBpm > MAX_BPM) {
            gameOver(false);
            return;
        }
    }
    
    // 動画の再生終了でゲームが終了するように変更したため、ここでのタップ回数チェックは不要
}

/**
 * ビートカウンターを更新
 * @param {number} count - 現在のカウント
 */
function updateBeatCounter(count) {
    elements.beatCount.textContent = count;
}

/**
 * 現在のBPM表示を更新
 * @param {number} bpm - 現在のBPM
 */
function updateCurrentBpm(bpm) {
    elements.currentBpm.textContent = `BPM: ${bpm}`;
}

/**
 * テンポインジケーターを更新
 */
function updateTempoIndicator() {
    const currentBpm = gameState.currentBpm;
    updateTempoNeedle(currentBpm);
    
    // フィードバック
    if (currentBpm < MIN_ACCEPTABLE_BPM) {
        elements.tempoFeedback.textContent = 'もう少し速く！';
        elements.tempoFeedback.style.color = '#FF9800';
    } else if (currentBpm > MAX_ACCEPTABLE_BPM) {
        elements.tempoFeedback.textContent = 'もう少しゆっくり！';
        elements.tempoFeedback.style.color = '#FF9800';
    } else {
        elements.tempoFeedback.textContent = '良いテンポです！';
        elements.tempoFeedback.style.color = '#4CAF50';
    }
}

/**
 * テンポ針の位置を更新
 * @param {number} bpm - 現在のBPM
 */
function updateTempoNeedle(bpm) {
    // tempo-meterの実際の幅に合わせて計算
    // スケールマークの位置を考慮
    // 80BPMが左端、120BPMが右端になるように計算
    
    // メーターの実際の幅に合わせて調整
    // スケールマークは左右に50pxの余白があるので、それを考慮
    const tempoMeter = document.querySelector('.tempo-meter');
    const tempoMeterWidth = tempoMeter.clientWidth;
    const scaleWidth = tempoMeterWidth - 100; // 左右50pxの余白を引く
    
    // インジケーターの移動範囲を計算
    // 左端から右端までのピクセル単位の移動量
    const halfWidth = scaleWidth / 2;
    
    // BPMの値を比率で計算
    let position;
    
    // BPMに基づいてインジケーターの位置を計算
    if (bpm <= 80) {
        position = -halfWidth; // 80BPM以下は左端
    } else if (bpm >= 120) {
        position = halfWidth; // 120BPM以上は右端
    } else {
        // 80-120BPMの範囲を線形補間
        const ratio = (bpm - 80) / 40; // 0から1の値
        position = -halfWidth + ratio * (halfWidth * 2);
    }
    
    // ピクセル単位の位置を計算
    const pixelPosition = Math.round(position);
    
    // デバッグ用にコンソールに出力
    console.log(`BPM: ${bpm}, Position: ${pixelPosition}px, Meter Width: ${tempoMeterWidth}px`);
    
    // 針の位置をピクセル単位で更新
    elements.tempoNeedle.style.transform = `translateX(${pixelPosition}px)`;
    
    // 針の色を更新
    if (MIN_ACCEPTABLE_BPM <= bpm && bpm <= MAX_ACCEPTABLE_BPM) {
        elements.tempoNeedle.style.backgroundColor = '#4CAF50'; // 緑
    } else if ((MIN_BPM <= bpm && bpm < MIN_ACCEPTABLE_BPM) || 
               (MAX_ACCEPTABLE_BPM < bpm && bpm <= MAX_BPM)) {
        elements.tempoNeedle.style.backgroundColor = '#FF9800'; // オレンジ
    } else {
        elements.tempoNeedle.style.backgroundColor = '#F44336'; // 赤
    }
}

/**
 * ゲーム終了処理
 * @param {boolean} isSuccess - 成功したかどうか
 */
function gameOver(isSuccess) {
    console.log('ゲーム終了処理を開始します。成功: ' + isSuccess);
    gameState.isGameOver = true;
    
    // YouTube動画を停止
    pauseYouTubeVideo();
    
    // 結果画面を表示
    showResult(isSuccess);
}

/**
 * YouTube動画を停止する
 */
function pauseYouTubeVideo() {
    try {
        console.log('YouTube動画を停止します');
        
        // グローバルのYouTubePlayerオブジェクトを使用
        if (typeof YouTubePlayer !== 'undefined') {
            if (typeof YouTubePlayer.pauseVideo === 'function') {
                YouTubePlayer.pauseVideo();
                console.log('YouTubePlayer.pauseVideo()を使用して動画を停止しました');
                return;
            }
        }
        
        // プレーヤーオブジェクトを直接取得してみる
        if (typeof player !== 'undefined' && player && typeof player.pauseVideo === 'function') {
            player.pauseVideo();
            console.log('player.pauseVideo()を使用して動画を停止しました');
            return;
        }
        
        console.warn('YouTubeプレーヤーが見つからないため、動画を停止できませんでした');
    } catch (error) {
        console.error('YouTube動画の停止中にエラーが発生しました:', error);
    }
}

/**
 * 結果画面を表示
 * @param {boolean} isSuccess - 成功したかどうか
 */
function showResult(isSuccess) {
    switchTab('result');
    
    if (isSuccess) {
        elements.resultMessage.textContent = 'おめでとうございます！テンポを維持できました！';
        elements.resultMessage.className = 'result-message success';
    } else {
        elements.resultMessage.textContent = '残念！テンポが許容範囲を超えました。';
        elements.resultMessage.className = 'result-message failure';
    }
    
    // 統計情報
    if (gameState.gameTaps.length > 1) {
        const intervals = [];
        for (let i = 1; i < gameState.gameTaps.length; i++) {
            const interval = gameState.gameTaps[i] - gameState.gameTaps[i-1];
            intervals.push(interval);
        }
        
        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const avgBpm = Math.round(60000 / avgInterval); // ミリ秒を秒に変換
        
        const bpmValues = intervals.map(interval => Math.round(60000 / interval));
        const minBpm = Math.min(...bpmValues);
        const maxBpm = Math.max(...bpmValues);
        
        let statsText = `平均BPM: ${avgBpm}\n`;
        statsText += `最小BPM: ${minBpm}\n`;
        statsText += `最大BPM: ${maxBpm}\n`;
        statsText += `タップ回数: ${gameState.beatCount}`;
        
        elements.resultStats.textContent = statsText;
    }
}

/**
 * ゲームをリセット
 */
function resetGame() {
    switchTab('start');
    gameState.mode = 'start';
    gameState.warmupTaps = [];
    gameState.gameTaps = [];
    gameState.currentBpm = STANDARD_BPM;
    gameState.beatCount = 0;
    gameState.isGameOver = false;
}

// グローバルに公開する関数
window.TempoTrainer = {
    init: initTempoTrainer,
    startWarmup,
    resetGame
};

// DOM読み込み完了時に自動初期化
// 注意: このイベントリスナーは一度だけ実行されるようにします
// app.jsでもTempoTrainer.init()が呼ばれているため、ここではイベントリスナーの設定のみ行います
document.addEventListener('DOMContentLoaded', function() {
    console.log('テンポトレーナーのDOMContentLoadedイベントが発生しました');
    
    // app.jsでもTempoTrainer.init()が呼ばれるので、ここではイベントリスナーの設定のみ行います
    // initTempoTrainer()は呼び出さない
    
    // ウォームアップ開始ボタンの確認（デバッグ用）
    const startWarmupButton = document.getElementById('start-warmup');
    if (startWarmupButton) {
        console.log('ウォームアップ開始ボタンを発見しました');
        // 注：イベントリスナーはsetupEventListeners内で設定されるため、ここでは設定しない
    } else {
        console.error('ウォームアップ開始ボタンが見つかりません');
    }
});
