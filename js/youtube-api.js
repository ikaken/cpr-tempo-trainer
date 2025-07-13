/**
 * YouTube Player API関連の機能
 */

// YouTube APIのグローバル変数
let player;
let currentVideoId = null; // デフォルトの動画IDは設定せず、選択された動画を優先
let isPlayerReady = false;

// グローバルにYouTubePlayerオブジェクトを公開
window.YouTubePlayer = {
    playVideo: function() {
        if (player && typeof player.playVideo === 'function') {
            console.log('YouTubePlayer.playVideoが呼び出されました');
            player.playVideo();
            return true;
        } else {
            console.error('YouTubePlayer.playVideo: プレーヤーが初期化されていません');
            return false;
        }
    },
    pauseVideo: function() {
        if (player && typeof player.pauseVideo === 'function') {
            player.pauseVideo();
            return true;
        }
        return false;
    },
    getCurrentTime: function() {
        if (player && typeof player.getCurrentTime === 'function') {
            return player.getCurrentTime();
        }
        return 0;
    },
    getDuration: function() {
        if (player && typeof player.getDuration === 'function') {
            return player.getDuration();
        }
        return 0;
    },
    isReady: function() {
        return isPlayerReady;
    }
};

/**
 * 動画IDを設定する関数
 * @param {string} videoId - YouTube動画ID
 */
function setVideoId(videoId) {
    if (!videoId) return;
    
    console.log(`動画IDを設定: ${videoId}`);
    currentVideoId = videoId;
    
    // プレーヤーが準備完了していれば、動画を読み込む
    if (isPlayerReady && player) {
        player.cueVideoById(videoId);
    }
}

// YouTube APIの読み込み
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// 現在のページがプレイ画面かどうかを判定する関数
function isPlayPage() {
    // URLから現在のページ名を取得
    const path = window.location.pathname;
    const pageName = path.split('/').pop();
    
    // play.htmlまたはplayで終わる場合はプレイ画面
    return pageName === 'play.html' || pageName === 'play';
}

// ページ読み込み時にYouTube APIを読み込む
document.addEventListener('DOMContentLoaded', function() {
    // プレイ画面の場合のみYouTube APIを読み込む
    if (isPlayPage()) {
        loadYouTubeAPI();
    } else {
        console.log('選択画面です。YouTube APIの読み込みをスキップします。');
    }
});

// YouTube APIが準備完了したときに呼ばれる関数
window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube API ready');
    
    // プレイ画面の場合のみ処理を続行
    if (isPlayPage()) {
        // ローカルストレージから動画IDを再取得
        const storedVideoId = localStorage.getItem('selectedVideoId');
        if (storedVideoId && !currentVideoId) {
            console.log(`ローカルストレージから動画IDを取得: ${storedVideoId}`);
            currentVideoId = storedVideoId;
        }
        
        // プレーヤーの初期化
        initPlayer();
    }
}

// プレーヤーの初期化
function initPlayer() {
    // プレイ画面でない場合は処理をスキップ
    if (!isPlayPage()) {
        console.log('プレイ画面ではないため、プレーヤーの初期化をスキップします');
        return;
    }
    
    // プレーヤーコンテナが存在するか確認
    const playerContainer = document.getElementById('player-container');
    if (!playerContainer) {
        console.error('プレーヤーコンテナが見つかりません');
        return;
    }
    
    // プレーヤーDivが存在するか確認
    const playerDiv = document.getElementById('player');
    if (!playerDiv) {
        console.error('プレーヤーDivが見つかりません');
        return;
    }
    
    try {
        // プレーヤーを初期化
        player = new YT.Player('player', {
            height: '360',
            width: '640',
            videoId: currentVideoId || 'dQw4w9WgXcQ', // デフォルト動画
            playerVars: {
                'playsinline': 1,
                'controls': 1,
                'rel': 0,
                'autoplay': 0 // 自動再生を無効化
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
        
        console.log('プレーヤーを初期化しました');
    } catch (error) {
        console.error('プレーヤーの初期化中にエラーが発生しました:', error);
    }
}

// プレーヤーのエラー時に呼ばれる関数
function onPlayerError(event) {
    console.error('YouTube Player error:', event.data);
    // エラーコードに基づいて対処
    let errorMessage = '';
    switch(event.data) {
        case 2:
            errorMessage = '無効なパラメータ値です。';
            break;
        case 5:
            errorMessage = 'HTML5プレーヤーに関連するエラーが発生しました。';
            break;
        case 100:
            errorMessage = '動画が見つかりません。';
            break;
        case 101:
        case 150:
            errorMessage = '埋め込み再生が許可されていない動画です。';
            break;
        default:
            errorMessage = 'エラーが発生しました。';
    }
    
    // エラーメッセージを表示
    const playerElement = document.getElementById('player');
    if (playerElement) {
        playerElement.innerHTML = `<div class="error-message">${errorMessage}<br>別の動画URLを試してください。</div>`;
    }
}

/**
 * 動画を読み込む関数
 * @param {string} videoId - YouTube動画ID
 * @param {boolean} autoPlay - 自動再生するかどうか（デフォルトは再生しない）
 */
function loadVideo(videoId, autoPlay = false) {
    if (!videoId) return;
    
    console.log(`動画を読み込み: ${videoId}, 自動再生: ${autoPlay}`);
    
    // プレーヤーが準備完了している場合は、動画を読み込む
    if (isPlayerReady && player) {
        if (autoPlay && player.loadVideoById) {
            // 自動再生する場合
            player.loadVideoById(videoId);
        } else if (player.cueVideoById) {
            // 自動再生しない場合
            player.cueVideoById(videoId);
        }
        currentVideoId = videoId;
    } else {
        // プレーヤーが準備完了していない場合は、動画IDを保存
        currentVideoId = videoId;
    }
}

/**
 * 動画を再生する関数
 */
function playVideo() {
    if (isPlayerReady && player && player.playVideo) {
        console.log('動画再生開始');
        player.playVideo();
    } else {
        console.error('プレーヤーが準備完了していないため、再生できません');
    }
}

// プレーヤーの準備完了時に呼ばれる関数
function onPlayerReady(event) {
    console.log('YouTube Player ready');
    isPlayerReady = true;
    updatePlaybackRateButtons(1.0);
    
    // プレーヤーの準備が完了したら、動画を読み込むが自動再生はしない
    if (currentVideoId) {
        // loadVideoByIdの代わりにcueVideoByIdを使用して自動再生を防止
        console.log('動画をキューに追加します: ' + currentVideoId);
        player.cueVideoById(currentVideoId);
    } else {
        console.warn('動画 ID が設定されていません');
    }
    
    // カスタムイベントを発火して、プレーヤーが準備完了したことを通知
    console.log('YouTube Playerの準備完了イベントを発火します');
    const playerReadyEvent = new Event('youtubePlayerReady');
    window.dispatchEvent(playerReadyEvent);
    
    // カスタムイベントを発火して、YouTube APIが準備完了したことを通知
    const readyEvent = new CustomEvent('youtube-player-ready');
    document.dispatchEvent(readyEvent);
    
    console.log('YouTube Playerの初期化が完了しました');
}

// プレーヤーの状態変更時に呼ばれる関数
function onPlayerStateChange(event) {
    // YT.PlayerState.ENDED = 0: 動画の再生が終了した状態
    if (event.data === YT.PlayerState.ENDED) {
        console.log('YouTube video ended');
        // 動画再生終了イベントを発行
        const endedEvent = new CustomEvent('youtube-video-ended');
        document.dispatchEvent(endedEvent);
    }
    
    // YT.PlayerState.PLAYING = 1: 動画が再生中の状態
    if (event.data === YT.PlayerState.PLAYING) {
        console.log('YouTube video playing');
        // 動画再生開始イベントを発行
        const playingEvent = new CustomEvent('youtube-video-playing');
        document.dispatchEvent(playingEvent);
    }
}

// YouTube URLからビデオIDを抽出する関数
function extractVideoId(url) {
    if (!url) return '';
    
    // youtu.be形式のURL
    if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1];
        return id.split('?')[0];
    }
    
    // youtube.com/watch形式のURL
    if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        return urlParams.get('v');
    }
    
    return '';
}

// ビデオを読み込む関数
function loadVideo(videoId) {
    if (!videoId) {
        alert('有効なYouTube URLを入力してください');
        return false;
    }
    
    if (player && player.loadVideoById) {
        try {
            // 現在の動画を停止
            player.stopVideo();
            
            // 新しい動画を読み込む
            player.loadVideoById({
                'videoId': videoId,
                'startSeconds': 0,
                'suggestedQuality': 'large'
            });
            
            currentVideoId = videoId;
            console.log(`動画ID: ${videoId} を読み込みました`);
            return true;
        } catch (error) {
            console.error('動画の読み込み中にエラーが発生しました:', error);
        }
    } else {
        console.warn('YouTubeプレーヤーが初期化されていません');
    }
    
    return false;
}

// 再生速度を設定する関数
function setPlaybackRate(rate) {
    if (player && isPlayerReady) {
        try {
            // YouTube Player APIのsetPlaybackRateメソッドを呼び出す
            player.setPlaybackRate(rate);
            console.log(`再生速度を${rate}に設定しました`);
            updatePlaybackRateButtons(rate);
            return true;
        } catch (error) {
            console.error('再生速度の設定中にエラーが発生しました:', error);
        }
    } else {
        console.warn('YouTubeプレーヤーが初期化されていないか、準備が完了していません');
        
        // プレーヤーの準備が完了したら再度設定する
        document.addEventListener('youtube-player-ready', function() {
            setPlaybackRate(rate);
        }, { once: true });
    }
    return false;
}

// 再生/一時停止を切り替える関数
function togglePlayPause() {
    if (!player || !isPlayerReady) {
        console.warn('YouTubeプレーヤーが初期化されていないか、準備が完了していません');
        return false;
    }
    
    try {
        const state = player.getPlayerState();
        
        // 再生中なら一時停止、それ以外なら再生
        if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
            console.log('動画を一時停止しました');
        } else {
            player.playVideo();
            console.log('動画を再生しました');
        }
        
        return true;
    } catch (error) {
        console.error('再生/一時停止の切り替え中にエラーが発生しました:', error);
        return false;
    }
}

// 再生速度ボタンの表示を更新する関数
function updatePlaybackRateButtons(rate) {
    const buttons = document.querySelectorAll('.playback-controls button');
    buttons.forEach(button => {
        const buttonRate = parseFloat(button.dataset.rate);
        if (buttonRate === rate) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// 再生速度を設定
function setPlaybackRate(rate) {
    if (player && isPlayerReady) {
        player.setPlaybackRate(rate);
        updatePlaybackRateButtons(rate);
    }
}

// グローバルオブジェクトを作成し、外部から呼び出せるようにする
window.YouTubePlayer = {
    extractVideoId,
    loadVideo,
    setPlaybackRate,
    togglePlayPause,
    getPlayer: function() { return player; },
    isReady: function() { return isPlayerReady; },
    playVideo: function() {
        if (player && isPlayerReady) {
            try {
                player.playVideo();
                return true;
            } catch (error) {
                console.error('動画再生中にエラーが発生しました:', error);
                return false;
            }
        }
        return false;
    }
};
