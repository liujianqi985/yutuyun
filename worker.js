export default {
  async fetch(request, env) {
    // CORS 设置
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. 上传视频接口
      if (request.method === 'POST' && path === '/upload') {
        const formData = await request.formData();
        const file = formData.get('file');
        const objectKey = formData.get('objectKey');
        const title = formData.get('title') || objectKey.replace(/\.[^/.]+$/, "");
        const description = formData.get('description') || '';
        
        if (!file || !objectKey) {
          return new Response(JSON.stringify({ error: '缺少文件或对象键' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 上传到 R2
        await env.MY_BUCKET.put(objectKey, file.stream(), {
          httpMetadata: { 
            contentType: file.type,
            // 添加自定义元数据
            customMetadata: {
              title: title,
              description: description,
              originalFilename: file.name
            }
          }
        });

        return new Response(JSON.stringify({ 
          success: true, 
          objectKey: objectKey,
          message: '上传成功'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 2. 获取视频列表（使用数据目录）
      if (request.method === 'GET' && path === '/videos') {
        try {
          // 使用 list() 方法获取存储桶中的所有对象
          const objects = await env.MY_BUCKET.list();
          console.log('R2 对象列表:', objects);
          
          const videos = objects.objects.map(obj => {
            // 从自定义元数据或文件名中提取信息
            const customMetadata = obj.customMetadata || {};
            return {
              id: obj.key,
              filename: obj.key,
              file_size: obj.size,
              r2_object_key: obj.key,
              title: customMetadata.title || obj.key.replace(/\.[^/.]+$/, ""),
              description: customMetadata.description || '',
              uploaded_at: obj.uploaded,
              mime_type: obj.httpMetadata?.contentType || 'video/mp4',
              // 添加公共访问URL
              public_url: `https://pub-e91aeea110e2439bac3d380a8de576f5.r2.dev/${obj.key}`
            };
          });

          // 按上传时间排序（最新的在前）
          videos.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));

          return new Response(JSON.stringify({ 
            success: true,
            videos: videos,
            total: videos.length
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('获取视频列表错误:', error);
          return new Response(JSON.stringify({ 
            success: false,
            error: '获取视频列表失败: ' + error.message,
            videos: []
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // 3. 通过Worker代理视频（备用方案）
      if (request.method === 'GET' && path.startsWith('/video/')) {
        const objectKey = path.replace('/video/', '');
        const object = await env.MY_BUCKET.get(objectKey);
        
        if (!object) {
          return new Response(JSON.stringify({ error: '视频不存在' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'video/mp4',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }

      // 4. 公共视频访问重定向
      if (request.method === 'GET' && path.startsWith('/public/')) {
        const objectKey = path.replace('/public/', '');
        // 重定向到公共开发URL
        return Response.redirect(`https://pub-e91aeea110e2439bac3d380a8de576f5.r2.dev/${objectKey}`, 302);
      }

      // 5. 获取存储桶统计信息
      if (request.method === 'GET' && path === '/stats') {
        const objects = await env.MY_BUCKET.list();
        const totalSize = objects.objects.reduce((sum, obj) => sum + obj.size, 0);
        const totalVideos = objects.objects.length;

        return new Response(JSON.stringify({
          success: true,
          stats: {
            total_videos: totalVideos,
            total_size: totalSize,
            total_size_gb: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
            bucket_name: 'adc'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: '接口不存在' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker错误:', error);
      return new Response(JSON.stringify({ error: '服务器错误: ' + error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
