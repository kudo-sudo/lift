# AI トレーナー機能のセットアップ

## 完了した作業

✅ Vercel Serverless Functions でAI APIを実装  
✅ OpenAI API 統合（gpt-4o-mini）  
✅ フロントエンドでAI提案を表示  
✅ ルールベースのフォールバック機能  

---

## Vercel へのデプロイ手順

### 1. Vercel にプロジェクトをデプロイ

```bash
# Vercel CLI をインストール（未インストールの場合）
npm i -g vercel

# プロジェクトルートで
vercel
```

### 2. Vercel Dashboard で環境変数を設定

1. https://vercel.com/dashboard にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables** に移動
4. 以下を追加：

```
OPENAI_API_KEY = sk-proj-xxxxxxxxxxxxxxxx
```

**重要:** Production, Preview, Development すべてにチェック

### 3. 再デプロイ

環境変数を設定したら、再デプロイが必要：

```bash
vercel --prod
```

---

## ローカル開発時のテスト

Vercel の Serverless Functions をローカルで実行するには：

```bash
# Vercel Dev を起動
vercel dev
```

これで `http://localhost:3000` で開発サーバーが起動し、`/api/trainer` も動作します。

---

## 動作確認

1. **Home タブで種目を追加**
2. **Record ボタンで記録を追加**（weight, reps, sets）
3. **Home タブに戻る**
4. **AI Trainer パネル**が表示され、ローディング後に提案が出る

---

## コスト管理

- **gpt-4o-mini** は1回の提案で約 **0.01-0.03円**
- OpenAI Dashboard で **Usage limits** を設定推奨
- 月$5-10程度のハード上限を設定しておくと安心

---

## トラブルシューティング

### AI提案が表示されない

1. **Console でエラー確認**（F12 → Console）
2. **Vercel Dashboard → Functions → Logs** でサーバーログ確認
3. **環境変数が正しく設定されているか確認**

### API エラーが出る

- OpenAI の API キーが有効か確認
- 課金設定が完了しているか確認
- Usage limits に達していないか確認

---

## 機能の切り替え

### AI を無効化してルールベースに戻す

`useTrainer.js` の 6行目：

```javascript
const [useAI, setUseAI] = useState(false) // false に変更
```

---

## 次のステップ（オプション）

- [ ] レート制限の追加（API呼び出しを月100回まで等）
- [ ] キャッシュ機能（同じ記録なら再計算しない）
- [ ] UI でAI/ルールを切り替えるトグル
- [ ] Claude API への切り替えオプション
