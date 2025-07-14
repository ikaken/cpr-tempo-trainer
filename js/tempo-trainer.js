/**
 * テンポトレーナーの中核機能
 * 最適化版：重複コードの削除、エラーハンドリングの強化
 */

// テンポトレーナーモジュール
const TempoTrainerModule = (function() {
    // 定数
    const STANDARD_BPM = 100;        // 標準テンポ（BPM）
    const MIN_ACCEPTABLE_BPM = 90;   // 許容最小テンポ
    const MAX_ACCEPTABLE_BPM = 110;  // 許容最大テンポ
    const MIN_BPM = 80;              // 最小テンポ（これ未満でゲームオーバー）
    const MAX_BPM = 120;             // 最大テンポ（これ超過でゲームオーバー）
    const WARMUP_COUNT = 8;          // ウォームアップでの必要タップ回数
    
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
    
    // スペースキーハンドラー（重複登録防止用）
    let spaceKeyHandler = null;
    
    /**
     * テンポトレーナーの初期化
     */
    function initTempoTrainer() {
        console.log('テンポトレーナーを初期化します');
        
        try {
            // DOM要素の参照を取得
            initDomElements();
            
            // 初期表示の設定
            if (elements.warmupTotal) {
                elements.warmupTotal.textContent = WARMUP_COUNT;
            }
            
            // イベントリスナーの設定
            setupEventListeners();
            
            // YouTube動画再生終了イベントのリスナーを追加
            document.addEventListener('youtube-video-ended', handleVideoEnded);
            
            console.log('テンポトレーナーの初期化が完了しました');
        } catch (error) {
            console.error('テンポトレーナーの初期化中にエラーが発生しました:', error);
        }
    }
    
    /**
     * DOM要素の参照を初期化
     */
    function initDomElements() {
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
        
        // 必須要素の存在確認
        if (!elements.tabButtons || !elements.tabContents) {
            console.warn('タブ要素が見つかりません');
        }
    }
    
    /**
     * イベントリスナーの設定
     */
    function setupEventListeners() {
        // スペースキーのイベントリスナーを設定する前に、既存のリスナーを削除
        if (spaceKeyHandler) {
            document.removeEventListener('keydown', spaceKeyHandler);
        }
        
        // スペースキーハンドラーを定義
        spaceKeyHandler = function(event) {
            if (event.code === 'Space') {
                event.preventDefault(); // スクロールを防止
                console.log('スペースキーが押されました');
                handleSpaceKey();
            }
        };
        
        // スペースキーのイベントリスナーを設定
        document.addEventListener('keydown', spaceKeyHandler);
        
        // スタートボタンのイベントリスナー
        if (elements.startWarmupButton) {
            console.log('ウォームアップ開始ボタンにイベントリスナーを設定します');
            elements.startWarmupButton.addEventListener('click', startWarmup);
        } else {
            console.warn('ウォームアップ開始ボタンが見つかりません');
        }
        
        // タブボタンのイベントリスナー
        if (elements.tabButtons) {
            elements.tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const tabName = button.dataset.tab;
                    if (tabName) {
                        switchTab(tabName);
                    }
                });
            });
        }
        
        // リセットボタンのイベントリスナー
        if (elements.resetGameButton) {
            elements.resetGameButton.addEventListener('click', resetGame);
        }
    }
    
    /**
     * YouTube動画再生終了時の処理
     */
    function handleVideoEnded() {
        // ゲームモードの場合のみ処理
        if (gameState.mode === 'game' && !gameState.isGameOver) {
            console.log('動画が終了したため、ゲームを終了します');
            gameOver(true); // 動画が終了したのでゲームクリアとして終了
        }
    }
    
    /**
     * タブを切り替える
     * @param {string} tabName - 表示するタブの名前
     */
    function switchTab(tabName) {
        console.log(`タブを切り替えます: ${tabName}`);
        
        try {
            // タブボタンの状態を更新
            if (elements.tabButtons) {
                elements.tabButtons.forEach(button => {
                    if (button.dataset.tab === tabName) {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                });
            }
            
            // タブコンテンツの表示を切り替え
            if (elements.tabContents) {
                elements.tabContents.forEach(content => {
                    if (content.id === `${tabName}-tab`) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
            }
        } catch (error) {
            console.error('タブ切り替え中にエラーが発生しました:', error);
        }
    }
    
    /**
     * スペースキー押下時の処理
     */
    function handleSpaceKey() {
        const now = Date.now();
        
        // ゲームモードに応じた処理
        switch (gameState.mode) {
            case 'warmup':
                handleWarmupTap(now);
                break;
            case 'game':
                if (!gameState.isGameOver) {
                    handleGameTap(now);
                }
                break;
        }
    }
    
    /**
     * ウォームアップを開始
     */
    function startWarmup() {
        console.log('ウォームアップを開始します');
        
        try {
            // DOM要素の存在確認
            if (!elements.warmupCounter || !elements.warmupFeedback) {
                console.error('ウォームアップに必要なDOM要素が見つかりません');
                return;
            }
            
            // ゲーム状態をリセット
            gameState.mode = 'warmup';
            gameState.warmupTaps = [];
            gameState.gameTaps = [];
            gameState.beatCount = 0;
            gameState.isGameOver = false;
            
            // ウォームアップタブに切り替え
            switchTab('warmup');
            
            // カウンターを更新
            updateWarmupCounter(0);
            
            // フィードバックを表示
            if (elements.warmupFeedback) {
                elements.warmupFeedback.textContent = 'スペースキーを押してテンポを測定してください';
                elements.warmupFeedback.style.color = '';
            }
            
            if (elements.warmupBpm) {
                elements.warmupBpm.textContent = '';
            }
            
            console.log('ウォームアップの準備が完了しました');
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
        if (!elements.warmupCounter) return;
        
        try {
            console.log(`ウォームアップカウンターを更新: ${count}/${WARMUP_COUNT}`);
            elements.warmupCounter.textContent = count.toString();
        } catch (error) {
            console.error('カウンター更新中にエラーが発生しました:', error);
        }
    }
    
    /**
     * ウォームアップを終了し、結果を評価
     */
    function finishWarmup() {
        console.log('ウォームアップを終了し、結果を評価します');
        
        try {
            // タップ間隔からBPMを計算
            const intervals = [];
            for (let i = 1; i < gameState.warmupTaps.length; i++) {
                intervals.push(gameState.warmupTaps[i] - gameState.warmupTaps[i - 1]);
            }
            
            // 平均間隔を計算
            const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
            
            // BPMに変換（60秒 * 1000ミリ秒 / 平均間隔）
            const bpm = Math.round(60000 / avgInterval);
            gameState.currentBpm = bpm;
            
            console.log(`計測されたBPM: ${bpm}`);
            
            // BPM表示を更新
            if (elements.warmupBpm) {
                elements.warmupBpm.textContent = `現在のBPM: ${bpm}`;
            }
            
            // フィードバックを表示
            if (elements.warmupFeedback) {
                if (bpm >= MIN_ACCEPTABLE_BPM && bpm <= MAX_ACCEPTABLE_BPM) {
                    elements.warmupFeedback.textContent = `素晴らしい！平均BPM: ${bpm}、目標: ${STANDARD_BPM}`;
                    elements.warmupFeedback.style.color = '#4CAF50';
                    
                    // 遅延なしでゲームを開始
                    startGame();
                } else {
                    elements.warmupFeedback.textContent = `注意: テンポが不適切です。平均BPM: ${bpm}、目標: ${STANDARD_BPM}`;
                    elements.warmupFeedback.style.color = '#FF9800';
                    resetWarmup();
                }
            }
        } catch (error) {
            console.error('ウォームアップ終了処理中にエラーが発生しました:', error);
            resetWarmup();
        }
    }
    
    /**
     * ウォームアップをリセット
     */
    function resetWarmup() {
        gameState.warmupTaps = [];
        updateWarmupCounter(0);
    }
    
    /**
     * YouTube動画を再生する
     */
    function playYouTubeVideo() {
        console.log('YouTube動画の再生を試みます');
        
        try {
            // YouTubePlayerが利用可能か確認
            if (typeof YouTubePlayer === 'undefined') {
                console.error('YouTubePlayerが定義されていません');
                return false;
            }
            
            // プレーヤーの準備状態を確認
            if (YouTubePlayer.isReady && YouTubePlayer.isReady()) {
                console.log('YouTubePlayerは準備完了しています、再生を開始します');
                return YouTubePlayer.playVideo();
            } else {
                console.warn('YouTubePlayerの準備ができていません、再生を延期します');
                return false;
            }
        } catch (error) {
            console.error('YouTube動画再生中にエラーが発生しました:', error);
            return false;
        }
    }
    
    /**
     * ゲームを開始
     */
    function startGame() {
        console.log('ゲームを開始します');
        
        try {
            // ゲーム状態を設定
            gameState.mode = 'game';
            gameState.gameTaps = [];
            gameState.beatCount = 0;
            gameState.isGameOver = false;
            
            // ゲームタブに切り替え
            switchTab('game');
            
            // 表示を初期化
            updateBeatCounter(0);
            updateCurrentBpm(gameState.currentBpm);
            if (elements.tempoFeedback) {
                elements.tempoFeedback.textContent = 'スペースキーを押してテンポを維持してください';
                elements.tempoFeedback.style.color = '';
            }
            updateTempoNeedle(gameState.currentBpm);
            
            // YouTube動画を再生
            playYouTubeVideo();
        } catch (error) {
            console.error('ゲーム開始中にエラーが発生しました:', error);
        }
    }
    
    /**
     * ゲーム中のタップを処理
     * @param {number} timestamp - タップした時刻（ミリ秒）
     */
    function handleGameTap(timestamp) {
        // ゲームモードでない場合は何もしない
        if (gameState.mode !== 'game' || gameState.isGameOver) return;
        
        // タップ時刻を記録
        gameState.gameTaps.push(timestamp);
        
        // ビートカウンターを更新
        gameState.beatCount++;
        updateBeatCounter(gameState.beatCount);
        
        // 直近のタップから現在のBPMを計算
        if (gameState.gameTaps.length >= 2) {
            const recentTaps = gameState.gameTaps.slice(-4); // 直近の最大4回のタップを使用
            const intervals = [];
            
            for (let i = 1; i < recentTaps.length; i++) {
                intervals.push(recentTaps[i] - recentTaps[i - 1]);
            }
            
            // 平均間隔を計算
            const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
            
            // BPMに変換
            const bpm = Math.round(60000 / avgInterval);
            gameState.currentBpm = bpm;
            
            // BPM表示を更新
            updateCurrentBpm(bpm);
            
            // テンポインジケーターを更新
            updateTempoIndicator();
            
            // テンポが許容範囲外ならゲームオーバー
            if (bpm < MIN_BPM || bpm > MAX_BPM) {
                console.log(`テンポが許容範囲外です: ${bpm} BPM`);
                gameOver(false);
            }
        }
    }
    
    /**
     * ビートカウンターを更新
     * @param {number} count - 現在のカウント
     */
    function updateBeatCounter(count) {
        if (elements.beatCount) {
            elements.beatCount.textContent = count.toString();
        }
    }
    
    /**
     * 現在のBPM表示を更新
     * @param {number} bpm - 現在のBPM
     */
    function updateCurrentBpm(bpm) {
        if (elements.currentBpm) {
            elements.currentBpm.textContent = `BPM: ${bpm}`;
        }
    }
    
    /**
     * テンポインジケーターを更新
     */
    function updateTempoIndicator() {
        // テンポ針の位置を更新
        updateTempoNeedle(gameState.currentBpm);
        
        // テンポフィードバックを更新
        if (elements.tempoFeedback) {
            if (gameState.currentBpm < MIN_ACCEPTABLE_BPM) {
                elements.tempoFeedback.textContent = 'もう少し速く！';
                elements.tempoFeedback.style.color = '#FF9800';
            } else if (gameState.currentBpm > MAX_ACCEPTABLE_BPM) {
                elements.tempoFeedback.textContent = 'もう少しゆっくり！';
                elements.tempoFeedback.style.color = '#FF9800';
            } else {
                elements.tempoFeedback.textContent = '良いテンポです！';
                elements.tempoFeedback.style.color = '#4CAF50';
            }
        }
    }
    
    /**
     * テンポ針の位置を更新
     * @param {number} bpm - 現在のBPM
     */
    function updateTempoNeedle(bpm) {
        if (!elements.tempoNeedle) return;
        
        try {
            // tempo-meterの実際の幅に合わせて計算
            // スケールマークの位置を考慮
            // 80BPMが左端、120BPMが右端になるように計算
            
            // メーターの実際の幅に合わせて調整
            // スケールマークは左右に50pxの余白があるので、それを考慮
            const tempoMeter = document.querySelector('.tempo-meter');
            if (!tempoMeter) return;
            
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
        } catch (error) {
            console.error('テンポ針の更新中にエラーが発生しました:', error);
        }
    }
    
    /**
     * ゲーム終了処理
     * @param {boolean} isSuccess - 成功したかどうか
     */
    function gameOver(isSuccess) {
        console.log(`ゲームを終了します: ${isSuccess ? '成功' : '失敗'}`);
        
        // ゲーム状態を更新
        gameState.isGameOver = true;
        gameState.mode = 'result';
        
        // YouTube動画を停止
        pauseYouTubeVideo();
        
        // 結果画面を表示
        showResult(isSuccess);
    }
    
    /**
     * YouTube動画を停止する
     */
    function pauseYouTubeVideo() {
        console.log('YouTube動画の停止を試みます');
        
        try {
            // YouTubePlayerが利用可能か確認
            if (typeof YouTubePlayer !== 'undefined') {
                if (YouTubePlayer.pauseVideo) {
                    console.log('YouTubePlayer.pauseVideoを呼び出します');
                    YouTubePlayer.pauseVideo();
                    return true;
                }
            }
            
            // フォールバック: プレーヤーオブジェクトを直接取得
            if (typeof player !== 'undefined' && player && player.pauseVideo) {
                console.log('player.pauseVideoを呼び出します');
                player.pauseVideo();
                return true;
            }
            
            console.warn('YouTubeプレーヤーが見つかりませんでした');
            return false;
        } catch (error) {
            console.error('YouTube動画停止中にエラーが発生しました:', error);
            return false;
        }
    }
    
    /**
     * 結果画面を表示
     * @param {boolean} isSuccess - 成功したかどうか
     */
    function showResult(isSuccess) {
        console.log('結果画面を表示します');
        
        try {
            // 結果タブに切り替え
            switchTab('result');
            
            // 結果メッセージを設定
            if (elements.resultMessage) {
                if (isSuccess) {
                    elements.resultMessage.textContent = 'おめでとう！正しいテンポを維持できました！';
                    elements.resultMessage.className = 'result-message success';
                } else {
                    elements.resultMessage.textContent = 'テンポが範囲外になりました。もう一度挑戦しましょう！';
                    elements.resultMessage.className = 'result-message failure';
                }
            }
            
            // 統計情報を表示
            if (elements.resultStats) {
                const avgBpm = calculateAverageBpm();
                const totalBeats = gameState.beatCount;
                
                elements.resultStats.innerHTML = `
                    <p>平均テンポ: <strong>${avgBpm} BPM</strong></p>
                    <p>総タップ数: <strong>${totalBeats}</strong></p>
                `;
            }
        } catch (error) {
            console.error('結果表示中にエラーが発生しました:', error);
        }
    }
    
    /**
     * 平均BPMを計算
     */
    function calculateAverageBpm() {
        if (gameState.gameTaps.length < 2) return 0;
        
        // タップ間隔の平均を計算
        const intervals = [];
        for (let i = 1; i < gameState.gameTaps.length; i++) {
            intervals.push(gameState.gameTaps[i] - gameState.gameTaps[i - 1]);
        }
        
        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        
        // BPMに変換
        return Math.round(60000 / avgInterval);
    }
    
    /**
     * ゲームをリセット
     */
    function resetGame() {
        console.log('ゲームをリセットします');
        
        // ゲーム状態をリセット
        gameState.mode = 'start';
        gameState.warmupTaps = [];
        gameState.gameTaps = [];
        gameState.beatCount = 0;
        gameState.isGameOver = false;
        gameState.currentBpm = STANDARD_BPM;
        
        // スタート画面に戻る
        switchTab('start');
        
        // カウンターをリセット
        updateWarmupCounter(0);
        updateBeatCounter(0);
        updateCurrentBpm(STANDARD_BPM);
    }
    
    // 公開API
    return {
        init: initTempoTrainer,
        startWarmup: startWarmup,
        resetGame: resetGame,
        
        // 定数を公開
        constants: {
            STANDARD_BPM,
            MIN_ACCEPTABLE_BPM,
            MAX_ACCEPTABLE_BPM,
            MIN_BPM,
            MAX_BPM,
            WARMUP_COUNT
        },
        
        // デバッグ用
        getGameState: function() {
            return { ...gameState };
        }
    };
})();

// グローバルに公開
window.TempoTrainer = TempoTrainerModule;
