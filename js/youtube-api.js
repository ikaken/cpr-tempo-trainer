/**
 * YouTube Player API関連の機能
 * 最適化版：重複コードの削除、エラーハンドリングの強化
 */

// YouTubeプレーヤーモジュール
const YouTubePlayerModule = (function() {
    // プライベート変数
    let player = null;
    let currentVideoId = null;
    let isPlayerReady = false;
    let playbackRate = 1.0;
    let playerConfig = {
        height: '360',
        width: '640',
        playerVars: {
            'playsinline': 1,
            'controls': 1,
            'rel': 0
        }
    };

    /**
     * YouTube APIの読み込み
     */
    function loadYouTubeAPI() {
        console.log('YouTube APIを読み込みます');
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    /**
     * プレーヤーの初期化
     */
    function initPlayer() {
        console.log('YouTubeプレーヤーを初期化します');
        try {
            const playerContainer = document.getElementById('player');
            if (!playerContainer) {
                console.error('プレーヤーコンテナが見つかりません');
                return;
            }

            // プレーヤーオプションの設定
            const options = {
                ...playerConfig,
                videoId: currentVideoId || '',
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onError': onPlayerError
                }
            };

            // プレーヤーの作成
            player = new YT.Player('player', options);
            console.log('YouTubeプレーヤーを作成しました');
        } catch (error) {
            console.error('プレーヤーの初期化中にエラーが発生しました:', error);
        }
    }

    /**
     * プレーヤーの準備完了時に呼ばれる関数
     */
    function onPlayerReady(event) {
        console.log('YouTubeプレーヤーの準備が完了しました');
        isPlayerReady = true;

        // カスタムイベントを発行して準備完了を通知
        const readyEvent = new CustomEvent('youtubePlayerReady', {
            detail: { player: player }
        });
        window.dispatchEvent(readyEvent);

        // 動画IDが設定されていれば読み込む
        if (currentVideoId) {
            console.log(`動画ID ${currentVideoId} が設定されているため、動画をキューに入れます`);
            player.cueVideoById(currentVideoId);
        }
    }

    /**
     * プレーヤーの状態変更時に呼ばれる関数
     */
    function onPlayerStateChange(event) {
        // 状態に応じた処理
        switch (event.data) {
            case YT.PlayerState.ENDED:
                console.log('動画の再生が終了しました');
                // カスタムイベントを発行して動画終了を通知
                const endedEvent = new CustomEvent('youtube-video-ended');
                document.dispatchEvent(endedEvent);
                break;
            case YT.PlayerState.PLAYING:
                console.log('動画の再生を開始しました');
                break;
            case YT.PlayerState.PAUSED:
                console.log('動画を一時停止しました');
                break;
        }
    }

    /**
     * プレーヤーのエラー時に呼ばれる関数
     */
    function onPlayerError(event) {
        let errorMessage = '不明なエラーが発生しました';
        
        // エラーコードに応じたメッセージ
        switch (event.data) {
            case 2:
                errorMessage = 'リクエストに無効なパラメータが含まれています';
                break;
            case 5:
                errorMessage = 'HTMLプレーヤーでエラーが発生しました';
                break;
            case 100:
                errorMessage = '要求された動画が見つかりません';
                break;
            case 101:
            case 150:
                errorMessage = '動画の埋め込みが許可されていません';
                break;
        }
        
        console.error(`YouTubeプレーヤーエラー (${event.data}): ${errorMessage}`);
    }

    /**
     * YouTube URLからビデオIDを抽出する関数
     */
    function extractVideoId(url) {
        if (!url) return null;
        
        try {
            // 通常のYouTube URL
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            
            if (match && match[2].length === 11) {
                return match[2];
            }
            
            // 既にIDの場合はそのまま返す
            if (url.length === 11) {
                return url;
            }
            
            return null;
        } catch (error) {
            console.error('動画IDの抽出中にエラーが発生しました:', error);
            return null;
        }
    }

    /**
     * 動画IDを設定する関数
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

    /**
     * 動画を読み込む関数
     */
    function loadVideo(videoId, autoPlay = false) {
        if (!videoId) {
            console.error('動画IDが指定されていません');
            return false;
        }
        
        // 動画IDを抽出（URLが渡された場合に対応）
        const extractedId = extractVideoId(videoId);
        if (!extractedId) {
            console.error('無効な動画IDまたはURL:', videoId);
            return false;
        }
        
        // 現在の動画IDを更新
        currentVideoId = extractedId;
        
        // プレーヤーが準備完了しているか確認
        if (!isPlayerReady || !player) {
            console.warn('プレーヤーがまだ準備できていません。動画IDを保存します');
            return false;
        }
        
        try {
            console.log(`動画を読み込みます: ${extractedId}`);
            if (autoPlay) {
                player.loadVideoById(extractedId);
            } else {
                player.cueVideoById(extractedId);
            }
            return true;
        } catch (error) {
            console.error('動画の読み込み中にエラーが発生しました:', error);
            return false;
        }
    }

    /**
     * 動画を再生する関数
     */
    function playVideo() {
        if (!isPlayerReady || !player) {
            console.error('プレーヤーがまだ準備できていません');
            return false;
        }
        
        try {
            console.log('動画の再生を開始します');
            player.playVideo();
            return true;
        } catch (error) {
            console.error('動画の再生中にエラーが発生しました:', error);
            return false;
        }
    }

    /**
     * 動画を一時停止する関数
     */
    function pauseVideo() {
        if (!isPlayerReady || !player) {
            console.error('プレーヤーがまだ準備できていません');
            return false;
        }
        
        try {
            console.log('動画を一時停止します');
            player.pauseVideo();
            return true;
        } catch (error) {
            console.error('動画の一時停止中にエラーが発生しました:', error);
            return false;
        }
    }

    /**
     * 再生速度を設定する関数
     */
    function setPlaybackRate(rate) {
        if (!isPlayerReady || !player) {
            console.error('プレーヤーがまだ準備できていません');
            return false;
        }
        
        try {
            console.log(`再生速度を設定します: ${rate}x`);
            player.setPlaybackRate(rate);
            playbackRate = rate;
            
            // 再生速度ボタンの表示を更新
            updatePlaybackRateButtons(rate);
            return true;
        } catch (error) {
            console.error('再生速度の設定中にエラーが発生しました:', error);
            return false;
        }
    }

    /**
     * 再生速度ボタンの表示を更新する関数
     */
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

    /**
     * 現在の再生時間を取得する関数
     */
    function getCurrentTime() {
        if (!isPlayerReady || !player) {
            return 0;
        }
        
        try {
            return player.getCurrentTime();
        } catch (error) {
            console.error('再生時間の取得中にエラーが発生しました:', error);
            return 0;
        }
    }

    /**
     * 動画の長さを取得する関数
     */
    function getDuration() {
        if (!isPlayerReady || !player) {
            return 0;
        }
        
        try {
            return player.getDuration();
        } catch (error) {
            console.error('動画の長さの取得中にエラーが発生しました:', error);
            return 0;
        }
    }

    /**
     * プレーヤーのインスタンスを取得する関数
     */
    function getPlayer() {
        return player;
    }

    /**
     * 現在のページがプレイ画面かどうかを判定する関数
     */
    function isPlayPage() {
        // URLから現在のページ名を取得
        const path = window.location.pathname;
        const pageName = path.split('/').pop();
        
        // play.htmlまたはplayで終わる場合はプレイ画面
        return pageName === 'play.html' || pageName === 'play';
    }

    // 初期化処理
    function init() {
        // プレイ画面の場合のみYouTube APIを読み込む
        if (isPlayPage()) {
            loadYouTubeAPI();
        } else {
            console.log('プレイ画面ではないため、YouTube APIの読み込みをスキップします');
        }
    }

    // 公開API
    return {
        init: init,
        initPlayer: initPlayer,
        setVideoId: setVideoId,
        loadVideo: loadVideo,
        playVideo: playVideo,
        pauseVideo: pauseVideo,
        setPlaybackRate: setPlaybackRate,
        getCurrentTime: getCurrentTime,
        getDuration: getDuration,
        getPlayer: getPlayer,
        isReady: function() { return isPlayerReady; },
        extractVideoId: extractVideoId
    };
})();

// YouTube APIが準備完了したときに呼ばれる関数
window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube IFrame API の準備が完了しました');
    YouTubePlayerModule.initPlayer();
};

// グローバルに公開
window.YouTubePlayer = YouTubePlayerModule;

// DOMの読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', function() {
    YouTubePlayerModule.init();
});
