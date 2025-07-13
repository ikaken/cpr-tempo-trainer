/**
 * リダイレクト機能
 * プレイ画面アクセス時に動画選択画面に誘導する
 */

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    // 現在のページがplay.html（プレイ画面）で、動画選択がされていない場合は選択画面にリダイレクト
    const currentPath = window.location.pathname;
    const isPlayPage = currentPath.endsWith('play.html');
    const hasSelectedVideo = localStorage.getItem('selectedVideoId');
    
    if (isPlayPage && !hasSelectedVideo) {
        // 動画が選択されていない場合は選択画面にリダイレクト
        window.location.href = 'index.html';
    }
});
