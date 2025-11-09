// Social Preview用の画像（1280x640px）を生成するスクリプト
const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ sharpライブラリが見つかりません');
  console.log('\n📦 インストール方法:');
  console.log('   npm install sharp');
  process.exit(1);
}

const svgPath = path.join(__dirname, 'social-preview.svg');
const outputPath = path.join(__dirname, 'social-preview.png');

async function generateSocialPreview() {
  console.log('📱 Social Preview画像を生成中...\n');
  
  try {
    await sharp(svgPath)
      .resize(1280, 640)
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

