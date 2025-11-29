export default {
  async fetch(request, env) {
    // CORS 设置
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 上传视频
      if (request.method === 'POST' && path === '/upload') {
        const formData = await request.formData();
        const file = formData.get('file');
        const objectKey = formData.get('objectKey');
        
        if (!file || !objectKey) {
          return new Response(JSON.stringify({ error: '缺少文件或对象键' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 上传到 R2
        await env.MY_BUCKET.put(objectKey, file.stream(), {
          httpMetadata: { contentType: file.type }
        });

        return new Response(JSON.stringify({ 
          success: true, 
          objectKey: objectKey,
          message: '上传成功'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: '接口不存在' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: '服务器错误: ' + error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
