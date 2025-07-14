/**
 * CPRテンポトレーナー メインアプリケーション
 * 動画選択、リダイレクト、アプリケーション初期化を統合
 */

// メインアプリケーションモジュール
const CPRApp = (function() {
    // プライベート変数
    let selectedVideoId = null;
    let currentPage = '';

    /**
     * アプリケーションの初期化
     */
    function init() {
        // 現在のページを判定
        currentPage = getCurrentPage();
        console.log(`現在のページ: ${currentPage}`);

        // ページに応じた初期化処理
        if (currentPage === 'index') {
            initVideoSelector();
        } else if (currentPage === 'play') {
            initPlayPage();
        }

        // 共通のイベントリスナー設定
        setupCommonEventListeners();
    }

    /**
     * 現在のページを判定する
     * @returns {string} ページ識別子（'index'または'play'）
     */
    function getCurrentPage() {
        const path = window.location.pathname;
        if (path.endsWith('index.html') || path.endsWith('/')) {
            return 'index';
        } else if (path.endsWith('play.html')) {
            return 'play';
        }
        return '';
    }

    /**
     * 共通のイベントリスナーを設定
     */
    function setupCommonEventListeners() {
        // ここに共通のイベントリスナーを追加
    }

    /**
     * 動画選択ページの初期化
     */
    function initVideoSelector() {
        console.log('動画選択ページを初期化します');
        const videoGrid = document.querySelector('.video-selection-grid');
        const startButton = document.getElementById('select-video-button');

        if (!videoGrid || !startButton) {
            console.error('必要なDOM要素が見つかりません');
            return;
        }

        // VideoDataオブジェクトの存在確認
        if (typeof VideoData === 'undefined') {
            console.error('VideoDataオブジェクトが読み込まれていません');
            return;
        }

        // 動画リストを読み込み
        loadVideoList(videoGrid);
        
        // 開始ボタンの初期設定
        startButton.disabled = true;
        
        // 開始ボタンのクリックイベント
        startButton.addEventListener('click', () => {
            if (selectedVideoId) {
                // 選択した動画IDをローカルストレージに保存
                localStorage.setItem('selectedVideoId', selectedVideoId);
                console.log(`選択した動画ID ${selectedVideoId} を保存しました`);
                
                // プレイ画面に遷移
                window.location.href = 'play.html';
            }
        });
    }

    /**
     * 動画リストを読み込み、表示する
     * @param {HTMLElement} container 動画リストを表示するコンテナ要素
     */
    function loadVideoList(container) {
        try {
            // 全ての動画情報を取得
            const videos = VideoData.getAllVideos();
            
            // 各動画のカードを作成
            videos.forEach(video => {
                const card = createVideoCard(video);
                container.appendChild(card);
            });
            
            console.log(`${videos.length}件の動画を読み込みました`);
        } catch (error) {
            console.error('動画リストの読み込みに失敗しました:', error);
        }
    }

    /**
     * 動画カード要素を作成する
     * @param {Object} video 動画情報オブジェクト
     * @returns {HTMLElement} 動画カード要素
     */
    function createVideoCard(video) {
        // カード要素を作成
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.videoId = video.id;
        
        // サムネイル画像を作成
        const thumbnail = document.createElement('div');
        thumbnail.className = 'video-thumbnail';
        const img = document.createElement('img');
        img.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
        img.alt = video.title;
        thumbnail.appendChild(img);
        
        // 動画情報を作成
        const info = document.createElement('div');
        info.className = 'video-info';
        
        // タイトル
        const title = document.createElement('h3');
        title.textContent = video.title;
        info.appendChild(title);
        
        // 説明
        const description = document.createElement('p');
        description.textContent = video.description || '';
        info.appendChild(description);
        
        // カードに要素を追加
        card.appendChild(thumbnail);
        card.appendChild(info);
        
        // クリックイベントを追加
        card.addEventListener('click', () => {
            // 以前に選択されたカードの選択状態を解除
            const selectedCards = document.querySelectorAll('.video-card.selected');
            selectedCards.forEach(selectedCard => {
                selectedCard.classList.remove('selected');
            });
            
            // このカードを選択状態にする
            card.classList.add('selected');
            
            // 選択された動画IDを保存
            selectedVideoId = video.id;
            
            // 開始ボタンを有効化
            const startButton = document.getElementById('select-video-button');
            if (startButton) {
                startButton.disabled = false;
            }
            
            console.log(`動画を選択しました: ${video.title} (${video.id})`);
        });
        
        return card;
    }

    /**
     * プレイページの初期化
     */
    function initPlayPage() {
        console.log('プレイページを初期化します');
        
        // リダイレクト処理
        handleRedirect();
        
        // テンポトレーナーの初期化
        if (typeof TempoTrainer !== 'undefined') {
            TempoTrainer.init();
        } else {
            console.error('TempoTrainerオブジェクトが読み込まれていません');
        }
        
        // ローカルストレージから選択された動画IDを取得
        const storedVideoId = localStorage.getItem('selectedVideoId');
        if (storedVideoId) {
            console.log(`選択された動画IDを読み込み: ${storedVideoId}`);
            
            // VideoDataが存在する場合は動画情報を取得
            if (typeof VideoData !== 'undefined') {
                const videoInfo = VideoData.getVideoInfoById(storedVideoId);
                if (videoInfo) {
                    console.log(`動画情報を取得: ${videoInfo.title}`);
                    // ページタイトルを動画タイトルに変更
                    document.title = `CPRテンポトレーナー - ${videoInfo.title}`;
                }
            }
            
            // プレーヤー準備完了時に動画を読み込むイベントリスナーを追加
            window.addEventListener('youtubePlayerReady', function() {
                console.log('プレーヤー準備完了イベントを受信、動画を読み込みます');
                
                // YouTubePlayerが存在するか確認
                if (typeof YouTubePlayer !== 'undefined') {
                    // 動画IDを設定して読み込む
                    YouTubePlayer.setVideoId(storedVideoId);
                    YouTubePlayer.loadVideo(storedVideoId);
                    
                    // 動画が正しく読み込まれた後にローカルストレージから削除
                    console.log('動画が正しく読み込まれました、ローカルストレージから削除します');
                    localStorage.removeItem('selectedVideoId');
                } else {
                    console.error('YouTubePlayerオブジェクトが読み込まれていません');
                }
            });
        }
        
        // 再生速度ボタンの設定
        setupPlaybackControls();
    }

    /**
     * リダイレクト処理
     * プレイ画面アクセス時に動画選択画面に誘導する
     */
    function handleRedirect() {
        // 現在のページがプレイ画面で、動画選択がされていない場合は選択画面にリダイレクト
        const hasSelectedVideo = localStorage.getItem('selectedVideoId');
        
        if (currentPage === 'play' && !hasSelectedVideo) {
            // 動画が選択されていない場合は選択画面にリダイレクト
            console.log('動画が選択されていないため、選択画面にリダイレクトします');
            window.location.href = 'index.html';
        }
    }

    /**
     * 再生速度コントロールの設定
     */
    function setupPlaybackControls() {
        const playbackButtons = document.querySelectorAll('.playback-controls button');
        if (!playbackButtons.length) return;

        playbackButtons.forEach(button => {
            button.addEventListener('click', () => {
                const rate = parseFloat(button.dataset.rate);
                // YouTube Player APIを使用して再生速度を変更
                if (typeof YouTubePlayer !== 'undefined') {
                    YouTubePlayer.setPlaybackRate(rate);
                }
            });
        });
    }

    // 公開API
    return {
        init: init
    };
})();

// DOMの読み込み完了時に実行
document.addEventListener('DOMContentLoaded', () => {
    CPRApp.init();
});
