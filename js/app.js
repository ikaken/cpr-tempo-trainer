/**
 * アプリケーションのメインスクリプト
 * YouTubeプレーヤーとテンポトレーナーを連携
 */

// DOMの読み込み完了時に実行
document.addEventListener('DOMContentLoaded', () => {
    // テンポトレーナーの初期化
    TempoTrainer.init();
    
    // ローカルストレージから選択された動画IDを取得
    const selectedVideoId = localStorage.getItem('selectedVideoId');
    if (selectedVideoId) {
        console.log(`選択された動画IDを読み込み: ${selectedVideoId}`);
        
        // VideoDataが存在する場合は動画情報を取得
        if (typeof VideoData !== 'undefined') {
            const videoInfo = VideoData.getVideoInfoById(selectedVideoId);
            if (videoInfo) {
                console.log(`動画情報を取得: ${videoInfo.title}`);
                // ページタイトルを動画タイトルに変更
                document.title = `CPRテンポトレーナー - ${videoInfo.title}`;
            }
        }
        
        // プレーヤー準備完了時に動画を読み込むイベントリスナーを追加
        window.addEventListener('youtubePlayerReady', function() {
            console.log('プレーヤー準備完了イベントを受信、動画を読み込みます');
            // 動画IDを設定して読み込む
            setVideoId(selectedVideoId);
            loadVideo(selectedVideoId);
            
            // 動画が正しく読み込まれた後にローカルストレージから削除
            console.log('動画が正しく読み込まれました、ローカルストレージから削除します');
            localStorage.removeItem('selectedVideoId');
        });
        
        // プレーヤーが準備完了していない場合は、currentVideoIdを設定しておく
        console.log('動画IDを保存します: ' + selectedVideoId);
        currentVideoId = selectedVideoId;
    }
    
    // 再生速度ボタンの設定
    const playbackButtons = document.querySelectorAll('.playback-controls button');
    playbackButtons.forEach(button => {
        button.addEventListener('click', () => {
            const rate = parseFloat(button.dataset.rate);
            // YouTube Player APIを使用して再生速度を変更
            YouTubePlayer.setPlaybackRate(rate);
        });
    });
    
    // 再生/一時停止ボタンを追加
    const playbackControls = document.querySelector('.playback-controls');
    if (playbackControls) {
        const playPauseButton = document.createElement('button');
        playPauseButton.textContent = '再生/一時停止';
        playPauseButton.className = 'play-pause-button';
        playPauseButton.addEventListener('click', () => {
            YouTubePlayer.togglePlayPause();
        });
        playbackControls.insertBefore(playPauseButton, playbackControls.firstChild);
    }
    
    // YouTubeプレーヤーの準備完了イベントをリッスン
    document.addEventListener('youtube-player-ready', () => {
        console.log('YouTubeプレーヤーの準備が完了しました');
        // 初期状態を設定
        YouTubePlayer.setPlaybackRate(1.0);
    });
});

// サンプルURLを設定（開発用）
function setDemoUrl() {
    // CPRトレーニング関連の動画URL例
    const demoUrls = [
        'https://www.youtube.com/watch?v=mRvzjEA42co',
        'https://www.youtube.com/watch?v=cosVBV96E2g',
        'https://www.youtube.com/watch?v=hizBdM1Ob68'
    ];
    
    const randomUrl = demoUrls[Math.floor(Math.random() * demoUrls.length)];
    const urlInput = document.getElementById('youtube-url');
    if (urlInput) {
        urlInput.value = randomUrl;
    }
}

// 開発用コードは現在の実装では不要なためコメントアウト
// setTimeout(() => {
//     setDemoUrl();
//     // デモURLは自動的に読み込まない
//     // YouTube Player APIが初期化時にデフォルト動画を読み込むため
// }, 1000);
