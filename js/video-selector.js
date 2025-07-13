/**
 * 動画選択画面のスクリプト
 */

// 動画選択グリッドの要素を取得
const videoGrid = document.querySelector('.video-selection-grid');
const startButton = document.getElementById('select-video-button');

// 選択された動画のIDを格納する変数
let selectedVideoId = null;

/**
 * ページ読み込み時の処理
 */
document.addEventListener('DOMContentLoaded', () => {
    // VideoDataオブジェクトが存在するか確認
    if (typeof VideoData === 'undefined') {
        console.error('VideoDataオブジェクトが読み込まれていません。video-data.jsを読み込んでください。');
        return;
    }
    
    // 動画リストを読み込み
    loadVideoList();
    
    // 開始ボタンの初期設定
    startButton.disabled = true;
    
    // 開始ボタンのクリックイベント
    startButton.addEventListener('click', () => {
        if (selectedVideoId) {
            // 選択された動画IDをローカルストレージに保存
            localStorage.setItem('selectedVideoId', selectedVideoId);
            
            // プレイページに遷移
            window.location.href = 'play.html';
        }
    });
});

/**
 * 動画リストを読み込み、表示する
 */
function loadVideoList() {
    try {
        // ローディングメッセージを削除
        const loadingElement = document.querySelector('.video-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // VideoDataから全ての動画情報を取得
        const videos = VideoData.getAllVideos();
        
        // 動画カードを生成して表示
        videos.forEach(video => {
            const videoCard = createVideoCard(video);
            videoGrid.appendChild(videoCard);
        });
    } catch (error) {
        console.error('動画情報の読み込み中にエラーが発生しました:', error);
    }
}

/**
 * 動画カード要素を作成する
 * @param {Object} video 動画情報オブジェクト
 * @returns {HTMLElement} 動画カード要素
 */
function createVideoCard(video) {
    const { id, title, duration, thumbnail } = video;
    
    // 動画カードのコンテナを作成
    const card = document.createElement('div');
    card.className = 'video-item';
    card.dataset.videoId = id;
    
    // サムネイル画像
    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = thumbnail;
    thumbnailImg.alt = title;
    thumbnailImg.className = 'video-thumbnail';
    
    // 動画タイトル
    const titleElement = document.createElement('div');
    titleElement.className = 'video-title';
    titleElement.textContent = title;
    
    // 動画再生時間
    const durationElement = document.createElement('div');
    durationElement.className = 'video-duration';
    durationElement.textContent = duration;
    
    // 要素をカードに追加
    card.appendChild(thumbnailImg);
    card.appendChild(titleElement);
    card.appendChild(durationElement);
    
    // クリックイベントを追加
    card.addEventListener('click', () => {
        // 以前に選択されたカードから選択状態を解除
        const previousSelected = document.querySelector('.video-item.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        
        // 現在のカードを選択状態にする
        card.classList.add('selected');
        
        // 選択された動画IDを記録
        selectedVideoId = id;
        
        // 開始ボタンを有効化
        startButton.disabled = false;
    });
    
    return card;
}
