export default {
  async fetch(request, env) {
    // CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 1. 超级简化的视频列表
    if (path === '/videos') {
      try {
        // 直接硬编码返回一些测试数据
        const testVideos = [
          {
            id: 'test1',
            filename: 'test-video-1.mp4',
            r2_object_key: 'test-video-1.mp4',
            title: '测试视频1',
            file_size: 1048576,
            uploaded_at: new Date().toISOString(),
            public_url: 'https://pub-e91aeea110e2439bac3d380a8de576f5.r2.dev/test-video-1.mp4'
          }
        ];
        
        return new Response(JSON.stringify({
          success: true,
          videos: testVideos
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
