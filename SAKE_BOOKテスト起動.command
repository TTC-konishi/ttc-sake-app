#!/bin/bash
# SAKE BOOK iPhoneテスト用 ワンクリック起動スクリプト
# 使い方: このファイルをダブルクリックするだけ。
# 止めるときは: 開いたターミナルで Control + C、またはウィンドウを閉じる。

cd "$(dirname "$0")" || exit 1

# Macの固定ホスト名（.local）を取得。IPが変わってもこの名前は変わらない
HOSTLOCAL="$(scutil --get LocalHostName 2>/dev/null).local"
# 参考用にLAN内IPも取得（Wi-Fi=en0、ダメならen1）
IP=$(ipconfig getifaddr en0 2>/dev/null)
[ -z "$IP" ] && IP=$(ipconfig getifaddr en1 2>/dev/null)
[ -z "$IP" ] && IP="（取得できませんでした）"

echo ""
echo "============================================================"
echo "  🍶  SAKE BOOK テストサーバーを起動します"
echo "============================================================"
echo ""
echo "  iPhoneのSafariで、下のアドレスを開いてください："
echo ""
echo "      ★おすすめ（固定）: http://$HOSTLOCAL:5173/"
echo "      予備（IPは変わることあり）: http://$IP:5173/"
echo ""
echo "  ※ iPhoneはこのMacと同じWi-Fiにつないでください"
echo "  ※ 合言葉: sake2026"
echo "  ※ OCR（ラベル自動読み取り）はローカルでは動きません"
echo "      → 写真読み取りのテストは本番URLで行ってください"
echo ""
echo "  止めるとき: このウィンドウで Control + C"
echo "============================================================"
echo ""

# 依存パッケージが未インストールなら入れる
if [ ! -d node_modules ]; then
  echo "初回起動のため、必要なパッケージをインストールします（1〜2分）..."
  npm install
fi

# 開発サーバーを起動（--host でLAN公開）
npm run dev -- --host
