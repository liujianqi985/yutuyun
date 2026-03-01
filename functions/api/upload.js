// functions/api/upload.js
export async function onRequest(context) {
  const { request, env } = context;

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': 'https://yutuyun.top',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const fileName = url.searchParams.get('filename');
    const fileType = url.searchParams.get('type') || 'application/octet-stream';

    if (!fileName) {
      return new Response('Missing filename', { status: 400 });
    }

    // 生成安全的文件名
    const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 从环境变量读取配置（在 Pages 设置里添加）
    const {
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME
    } = env;

    // 生成签名 URL（需要那个库，但 Pages Functions 默认支持 Node.js 兼容）
    // 这里为了简单，假设你已经在 Pages 里装了那个库
    const { getPreSignedUploadUrl } = await import('jsr:@mesilicon7/simple-r2-utils');
    
    const signedUrl = await getPreSignedUploadUrl(
      safeFileName,
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
      3600,
      fileType
    );

    return new Response(JSON.stringify({
      url: signedUrl,
      key: safeFileName
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://yutuyun.top',
      },
    });

  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
