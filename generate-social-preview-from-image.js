// 添付画像からSocial Preview用の画像（1280x640px）を生成するスクリプト
const path = require('path');
const sharp = require('sharp');

const inputPath = path.join(__dirname, 'ChatGPT Image 2025年11月9日 12_45_49.png');
const outputPath = path.join(__dirname, 'social-preview.png');

async function generateSocialPreview() {
  console.log('📱 Social Preview画像を生成中...\n');
  
  try {
    // 元画像を読み込んで、中央に配置して1280x640にリサイズ
    // 背景色はアプリのテーマカラー（ピンク系のグラデーション）
    await sharp({
      create: {
        width: 1280,
        height: 640,
        channels: 3,
        background: { r: 255, g: 245, b: 245 } // #fff5f5
      }
    })
    .composite([
      {
        input: await sharp(inputPath)
          .resize(500, 500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer(),
        left: 390, // (1280 - 500) / 2
        top: 70   // (640 - 500) / 2
      }
    ])
    .png()
    .toFile(outputPath);
    
    console.log(`✅ social-preview.png (1280x640px) を生成しました`);
    console.log('\n✨ 完了！');
    console.log('📝 GitHubリポジトリの「About」セクションでこの画像をアップロードしてください');
  } catch (error) {
    console.error(`❌ 生成に失敗: ${error.message}`);
  }
}

generateSocialPreview().catch(console.error);

