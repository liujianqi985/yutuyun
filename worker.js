export default {
  async fetch(request, env) {
    // CORS 设置
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    };

    // 直接返回成功信息
    return new Response(JSON.stringify({
      success: true,
      message: '玉兔云 Worker 正常运行！',
      timestamp: new Date().toISOString(),
      path: new URL(request.url).pathname
    }), {
      headers: corsHeaders
    });
  }
}
