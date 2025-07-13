/**
 * 動画データ設定ファイル
 * 動画情報を一元管理するためのファイル
 */

// 動画データオブジェクト
const VideoData = {
    // YouTube動画URLのリスト
    videoUrls: [
        'https://www.youtube.com/watch?v=5mLape5F0Fw',
        'https://www.youtube.com/watch?v=I_izvAbhExY',
        'https://www.youtube.com/watch?v=NeVLMLrP3og',
        'https://www.youtube.com/watch?v=qZq-q75KeMw',
        'https://www.youtube.com/watch?v=3oMGNKXAHSU'
    ],
    
    // YouTube動画IDのリスト
    videoIds: [
        '5mLape5F0Fw', // アンパンマンのマーチ
        'I_izvAbhExY', // Bee Gees - Stayin' Alive
        'NeVLMLrP3og', // Cherry
        'qZq-q75KeMw', // 世界に一つだけの花
        '3oMGNKXAHSU'  // 地上の星
    ],
    
    // 動画タイトルのリスト
    titles: [
        'アンパンマンのマーチ （テレビサイズver.）［公式オープニングテーマ］',
        'Bee Gees - Stayin\' Alive (Official Video)',
        'Cherry',
        '世界に一つだけの花 - SMAP',
        '地上の星 - 中島みゆき（フル）'
    ],
    
    // 動画再生時間のリスト
    durations: [
        '1:10',
        '4:09',
        '4:21',
        '4:37',
        '5:01'
    ],
    
    // 動画情報を取得するメソッド
    getVideoInfo: function(index) {
        if (index < 0 || index >= this.videoIds.length) {
            return {
                id: 'dQw4w9WgXcQ',
                title: 'デフォルト動画',
                duration: '3:30',
                thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`
            };
        }
        
        return {
            id: this.videoIds[index],
            title: this.titles[index],
            duration: this.durations[index],
            thumbnail: `https://img.youtube.com/vi/${this.videoIds[index]}/mqdefault.jpg`
        };
    },
    
    // 動画IDから情報を取得するメソッド
    getVideoInfoById: function(videoId) {
        const index = this.videoIds.findIndex(id => id === videoId);
        return this.getVideoInfo(index);
    },
    
    // 全ての動画情報を取得するメソッド
    getAllVideos: function() {
        return this.videoIds.map((id, index) => this.getVideoInfo(index));
    }
};
