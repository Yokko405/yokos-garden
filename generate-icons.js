// SVGからPNGアイコンを生成するスクリプト
// 使用方法: npm install sharp && node generate-icons.js

const fs = require('fs');
const path = require('path');

// sharpライブラリがインストールされているか確認
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ sharpライブラリが見つかりません');
  console.log('\n📦 インストール方法:');
  console.log('   npm install sharp');
  process.exit(1);
}

const svgPath = path.join(__dirname, 'favicon.svg');
const sizes = [
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' }
];

async function generateIcons() {
  console.log('📱 PNGアイコンを生成中...\n');
  
  for (const { size, name } of sizes) {
    try {
      const outputPath = path.join(__dirname, name);
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✅ ${name} (${size}x${size}px) を生成しました`);
    } catch (error) {
      console.error(`❌ ${name} の生成に失敗: ${error.message}`);
    }
  }
  
  console.log('\n✨ 完了！');
  console.log('📝 index.htmlとmanifest.jsonを更新してください');
}

generateIcons().catch(console.error);

